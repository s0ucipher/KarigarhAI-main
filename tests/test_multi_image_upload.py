import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import BASE_DIR, UPLOAD_DIR

class TestMultiImageUpload(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Login as seller
        login_res = cls.client.post("/api/auth/login", json={
            "email": "ramesh@kalasetu.ai",
            "password": "artisan123"
        })
        assert login_res.status_code == 200, f"Seller login failed: {login_res.text}"
        cls.token = login_res.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}
        cls.sample_dir = BASE_DIR / "frontend" / "static" / "images" / "products"

    def test_01_single_image_upload_backward_compatible(self):
        """Uploading 1 photo returns both image_enhancement and image_enhancements with length 1."""
        img_path = self.sample_dir / "terracotta_vase.jpg"
        with open(img_path, "rb") as f:
            res = self.client.post(
                "/api/ai/upload-and-enhance",
                headers=self.headers,
                files={"file": ("terracotta_vase.jpg", f.read(), "image/jpeg")},
                data={"language": "en"}
            )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("image_enhancement", data)
        self.assertIn("image_enhancements", data)
        self.assertEqual(len(data["image_enhancements"]), 1)
        self.assertIn("enhanced_url", data["image_enhancement"])
        self.assertIn("solid_background_color", data["image_enhancement"])

    def test_02_multiple_images_upload_3_photos(self):
        """Uploading 3 photos processes each photo individually and returns 3 enhanced photos."""
        photos = ["terracotta_vase.jpg", "bankura_horse.jpg", "madhubani_tree.jpg"]
        files = []
        for p in photos:
            with open(self.sample_dir / p, "rb") as f:
                files.append(("files", (p, f.read(), "image/jpeg")))

        res = self.client.post(
            "/api/ai/upload-and-enhance",
            headers=self.headers,
            files=files,
            data={"language": "en"}
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("image_enhancements", data)
        self.assertEqual(len(data["image_enhancements"]), 3)

        # Verify each enhanced photo exists and has independent metadata
        for idx, enh in enumerate(data["image_enhancements"]):
            self.assertIn("original_url", enh)
            self.assertIn("enhanced_url", enh)
            self.assertIn("solid_background_color", enh)
            self.assertTrue(enh["solid_background_color"].startswith("#"))
            # Enhanced image file must exist on disk
            enh_name = enh["enhanced_url"].split("?")[0].split("/")[-1]
            self.assertTrue((UPLOAD_DIR / enh_name).exists(), f"Enhanced file missing: {enh_name}")

        # Verify primary enhancement is mapped to photo 1
        self.assertEqual(data["image_enhancement"]["original_url"], data["image_enhancements"][0]["original_url"])
        self.assertEqual(data["image_enhancement"]["enhanced_url"], data["image_enhancements"][0]["enhanced_url"])

    def test_03_max_limit_5_photos(self):
        """Uploading exactly 5 photos succeeds and enhances all 5 photos."""
        sample_files = list(self.sample_dir.glob("*.jpg"))[:5]
        self.assertEqual(len(sample_files), 5)
        files = []
        for sf in sample_files:
            with open(sf, "rb") as f:
                files.append(("files", (sf.name, f.read(), "image/jpeg")))

        res = self.client.post(
            "/api/ai/upload-and-enhance",
            headers=self.headers,
            files=files,
            data={"language": "en"}
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(len(data["image_enhancements"]), 5)

    def test_04_exceeding_limit_prevent_additional_photos(self):
        """Uploading more than 5 photos enforces the 5-photo limit and ignores additional photos."""
        sample_files = list(self.sample_dir.glob("*.jpg"))
        # Repeat files to send 7 files
        files = []
        for i in range(7):
            sf = sample_files[i % len(sample_files)]
            with open(sf, "rb") as f:
                files.append(("files", (f"photo_{i}_{sf.name}", f.read(), "image/jpeg")))

        res = self.client.post(
            "/api/ai/upload-and-enhance",
            headers=self.headers,
            files=files,
            data={"language": "en"}
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        # Strictly limited to 5 photos
        self.assertEqual(len(data["image_enhancements"]), 5)

    def test_05_zero_photos_rejected(self):
        """Submitting zero photos returns HTTP 400 Bad Request."""
        res = self.client.post(
            "/api/ai/upload-and-enhance",
            headers=self.headers,
            data={"language": "en"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 1 product photo", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
