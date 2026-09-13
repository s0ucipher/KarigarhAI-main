import io
import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_access_token

class TestVercelRouting(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.seller_token = create_access_token({
            "sub": 1,
            "role": "seller",
            "email": "ramesh@example.com"
        })
        self.auth_headers = {"Authorization": f"Bearer {self.seller_token}"}

    def test_health_endpoints(self):
        # Direct /api/health
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

        # Root /api and /api/
        res2 = self.client.get("/api")
        self.assertEqual(res2.status_code, 200)
        res3 = self.client.get("/api/")
        self.assertEqual(res3.status_code, 200)

        # Direct /api/index.py
        res4 = self.client.get("/api/index.py")
        self.assertEqual(res4.status_code, 200)

    def test_vercel_rewrite_header_restoration(self):
        # When Vercel rewrites /api/seller/dashboard to /api/index.py with x-matched-path
        res = self.client.get(
            "/api/index.py",
            headers={
                **self.auth_headers,
                "x-matched-path": "/api/seller/dashboard"
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("profile", data)
        self.assertIn("stats", data)

    def test_vercel_stripped_api_prefix(self):
        # When Vercel catch-all strips /api and calls /seller/dashboard directly
        res = self.client.get(
            "/seller/dashboard",
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("profile", data)

    def test_vercel_dynamic_catch_all_query(self):
        # When Vercel invokes [...path] with query path=seller/dashboard
        res = self.client.get(
            "/api/[...path]",
            params={"path": "seller/dashboard"},
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("profile", data)

    def test_upload_and_enhance_via_vercel_rewrite(self):
        # Create a small 100x100 RGB image
        from PIL import Image
        img_byte_arr = io.BytesIO()
        img = Image.new("RGB", (100, 100), color=(180, 100, 60))
        img.save(img_byte_arr, format="JPEG")
        img_bytes = img_byte_arr.getvalue()

        # Test POST upload-and-enhance rewritten to /api/index.py with x-matched-path
        files = [
            ("files", ("test_craft.jpg", io.BytesIO(img_bytes), "image/jpeg")),
            ("file", ("test_craft.jpg", io.BytesIO(img_bytes), "image/jpeg")),
        ]
        data = {
            "language": "en",
            "hint": "Clay pot handcrafted"
        }

        res = self.client.post(
            "/api/index.py",
            headers={
                **self.auth_headers,
                "x-matched-path": "/api/ai/upload-and-enhance"
            },
            files=files,
            data=data
        )
        self.assertEqual(res.status_code, 200)
        res_data = res.json()
        self.assertTrue(res_data.get("success"))
        self.assertIn("image_enhancements", res_data)
        self.assertIn("ai_catalog", res_data)

    def test_uploads_alias_routing(self):
        # Both /uploads/ and /api/uploads/ should be handled by serve_upload_file
        # (even if file does not exist, it should return 404 JSON, NOT 405 Method Not Allowed or index.html)
        res1 = self.client.get("/uploads/nonexistent_test.jpg")
        self.assertEqual(res1.status_code, 404)
        self.assertEqual(res1.json(), {"detail": "Image not found"})

        res2 = self.client.get("/api/uploads/nonexistent_test.jpg")
        self.assertEqual(res2.status_code, 404)
        self.assertEqual(res2.json(), {"detail": "Image not found"})

if __name__ == "__main__":
    unittest.main()
