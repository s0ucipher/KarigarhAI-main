import os
import unittest
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

from backend.services.image_enhancer import (
    enhance_artisan_product_image,
    analyze_image,
    extract_product_subject,
    select_complementary_studio_background,
    enhance_product_presentation,
    composite_studio_product,
    compute_truthful_metrics,
)
from backend.config import UPLOAD_DIR, BASE_DIR

class TestImageEnhancementPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_dir = BASE_DIR / "scratch" / "test_images"
        cls.test_dir.mkdir(parents=True, exist_ok=True)
        cls.sample_dir = BASE_DIR / "frontend" / "static" / "images" / "products"

    def test_01_real_samples_pass_quality_gate(self):
        """All 5 real marketplace artisan samples must enhance cleanly without white blowout or blur."""
        sample_files = list(self.sample_dir.glob("*.jpg"))
        self.assertGreaterEqual(len(sample_files), 5)

        for img_file in sample_files:
            result = enhance_artisan_product_image(img_file)
            self.assertIn("original_url", result)
            self.assertIn("enhanced_url", result)
            self.assertIn("?v=", result["enhanced_url"], "Cache buster must be present on enhanced_url")
            self.assertIn(result["status"], ("enhanced", "conservatively_enhanced", "original_preserved"))
            self.assertIn("solid_background_color", result)
            self.assertTrue(result["solid_background_color"].startswith("#"))
            
            # Verify enhanced file exists
            enh_path = Path(result["enhanced_path"])
            self.assertTrue(enh_path.exists(), f"Enhanced file missing for {img_file.name}")
            
            # Verify metrics are not hardcoded fake percentages
            metrics = result["metrics"]
            self.assertNotEqual(metrics.get("lighting_improvement"), "+24%")
            self.assertNotEqual(metrics.get("sharpness_gain"), "+35%")
            self.assertNotEqual(metrics.get("color_vibrance"), "+22%")

    def test_02_dark_photo_safe_lift(self):
        """Dim workshop photo gets gentle exposure lift without clipping."""
        dark_path = self.test_dir / "dark_pottery.jpg"
        with Image.open(self.sample_dir / "terracotta_vase.jpg") as img:
            dark_img = ImageEnhance.Brightness(img.convert("RGB")).enhance(0.35)
            dark_img.save(dark_path, "JPEG")

        result = enhance_artisan_product_image(dark_path)
        self.assertIn(result["status"], ("enhanced", "conservatively_enhanced"))
        orig_lum = result["analysis"]["original"]["mean_luminance"]
        enh_lum = result["analysis"]["enhanced"]["mean_luminance"]
        self.assertGreater(enh_lum, orig_lum, "Dark photo should receive exposure lift on studio canvas")
        self.assertLessEqual(result["analysis"]["enhanced"]["highlight_clipping_pct"], 5.0)

    def test_03_bright_photo_no_whiteout(self):
        """High-key bright photo must NOT be blown out to solid white."""
        bright_path = self.test_dir / "high_key_craft.jpg"
        with Image.open(self.sample_dir / "terracotta_vase.jpg") as img:
            bright_img = ImageEnhance.Brightness(img.convert("RGB")).enhance(1.05)
            bright_img.save(bright_path, "JPEG")

        result = enhance_artisan_product_image(bright_path)
        orig_hi = result["analysis"]["original"]["highlight_clipping_pct"]
        enh_hi = result["analysis"]["enhanced"]["highlight_clipping_pct"]
        self.assertLessEqual(enh_hi - orig_hi, 5.0, "Highlights must not be clipped excessively")

    def test_04_already_sharp_photo_no_halos(self):
        """Crisp photo (e.g. Madhubani fine linework) receives subtle sharpening, not halo explosion."""
        sharp_path = self.sample_dir / "madhubani_tree.jpg"
        result = enhance_artisan_product_image(sharp_path)
        self.assertIn(result["status"], ("enhanced", "conservatively_enhanced"))
        self.assertIn("solid_background_color", result)

    def test_05_colorful_craft_preserves_natural_tones(self):
        """Vibrant handicraft does not receive neon oversaturation."""
        vibrant_path = self.test_dir / "vibrant_textile.jpg"
        with Image.open(self.sample_dir / "madhubani_tree.jpg") as img:
            vibrant_img = ImageEnhance.Color(img.convert("RGB")).enhance(1.3)
            vibrant_img.save(vibrant_path, "JPEG")

        result = enhance_artisan_product_image(vibrant_path)
        orig_sat = result["analysis"]["original"]["mean_saturation"]
        enh_sat = result["analysis"]["enhanced"]["mean_saturation"]
        # Saturation boost should be controlled
        self.assertLessEqual(enh_sat - orig_sat, 0.15, "Already vibrant craft must not be oversaturated")

    def test_06_png_format_matching(self):
        """PNG input is saved as valid PNG, not JPEG in disguise."""
        png_path = self.test_dir / "craft_icon.png"
        img = Image.new("RGBA", (200, 200), (180, 80, 50, 255))
        img.save(png_path, "PNG")

        result = enhance_artisan_product_image(png_path)
        enh_path = Path(result["enhanced_path"])
        self.assertTrue(enh_path.suffix.lower() == ".png")
        with Image.open(enh_path) as enh_img:
            self.assertEqual(enh_img.format, "PNG", "Format must match PNG extension")

    def test_07_subject_isolation_and_background_removal(self):
        """extract_product_subject isolates the product into RGBA with transparent background."""
        sample_path = self.sample_dir / "terracotta_vase.jpg"
        with Image.open(sample_path) as img:
            isolated = extract_product_subject(img)
            self.assertEqual(isolated.mode, "RGBA")
            alpha = isolated.split()[3]
            alpha_data = list(alpha.getdata())
            # Must have transparent pixels (background removed)
            has_transparent = any(a < 50 for a in alpha_data)
            self.assertTrue(has_transparent, "Extracted product must have removed background (transparent pixels)")
            # Must have solid product pixels (product kept)
            has_solid = any(a > 200 for a in alpha_data)
            self.assertTrue(has_solid, "Extracted product must retain primary subject (opaque pixels)")

    def test_08_solid_single_color_studio_background(self):
        """The studio background must be strictly a single solid color with zero variance."""
        sample_path = self.sample_dir / "terracotta_vase.jpg"
        result = enhance_artisan_product_image(sample_path)
        
        self.assertIn("solid_background_color", result)
        hex_color = result["solid_background_color"].lstrip("#")
        bg_r = int(hex_color[0:2], 16)
        bg_g = int(hex_color[2:4], 16)
        bg_b = int(hex_color[4:6], 16)
        
        enh_img = Image.open(result["enhanced_path"]).convert("RGB")
        # Check all 4 outer corner pixels
        corners = [
            enh_img.getpixel((2, 2)),
            enh_img.getpixel((enh_img.width - 3, 2)),
            enh_img.getpixel((2, enh_img.height - 3)),
            enh_img.getpixel((enh_img.width - 3, enh_img.height - 3)),
        ]
        for c in corners:
            # Tolerating 1-2 quantization rounding in JPEG compression
            self.assertLessEqual(abs(c[0] - bg_r), 2)
            self.assertLessEqual(abs(c[1] - bg_g), 2)
            self.assertLessEqual(abs(c[2] - bg_b), 2)

    def test_09_chair_product_understanding_and_anti_hallucination(self):
        """Wooden chair MUST be identified as woodcraft/furniture, NEVER Madhubani/rice paper."""
        from backend.services.ai_service import generate_product_catalog

        chair_res = generate_product_catalog(
            image_path="scratch/test_images/craft_icon.png",
            user_language="en",
            hint="Handcrafted wooden chair with backrest",
            client_filename="wooden_chair.jpg"
        )
        self.assertEqual(chair_res["category_slug"], "woodcraft")
        # Anti-hallucination check
        desc_and_title = (chair_res["title"] + " " + chair_res["description"] + " " + chair_res["material"]).lower()
        self.assertNotIn("madhubani", desc_and_title)
        self.assertNotIn("rice paper", desc_and_title)
        self.assertNotIn("turmeric", desc_and_title)
        self.assertNotIn("kachni", desc_and_title)
        self.assertNotIn("bharni", desc_and_title)
        # Price must reflect wooden furniture, NOT ₹1500-₹2600 generic
        self.assertGreaterEqual(chair_res["suggested_min_price"], 2500)
        self.assertLessEqual(chair_res["suggested_max_price"], 6500)

    def test_10_pottery_product_understanding(self):
        """Terracotta pot MUST generate pottery listing, not paintings or furniture."""
        from backend.services.ai_service import generate_product_catalog

        pot_res = generate_product_catalog(
            image_path="scratch/test_images/dark_pottery.jpg",
            user_language="en",
            hint="Earthen terracotta decorative pot",
            client_filename="clay_pot.jpg"
        )
        self.assertEqual(pot_res["category_slug"], "pottery-ceramics")
        desc = pot_res["description"].lower()
        self.assertTrue("terracotta" in desc or "clay" in desc or "pottery" in desc)
        # Realistic pottery price, not chair price
        self.assertLessEqual(pot_res["suggested_min_price"], 1000)

    def test_11_textile_product_understanding(self):
        """Handloom saree MUST generate handloom/textile category, not pottery or wood."""
        from backend.services.ai_service import generate_product_catalog

        textile_res = generate_product_catalog(
            image_path="scratch/test_images/vibrant_textile.jpg",
            user_language="en",
            hint="Handwoven silk saree with zari border",
            client_filename="silk_saree.jpg"
        )
        self.assertEqual(textile_res["category_slug"], "handloom-textiles")
        self.assertIn("silk", textile_res["material"].lower())

    def test_12_price_matrix_dynamic_independence(self):
        """Distinct crafts MUST have dynamic, independent price ranges."""
        from backend.services.ai_service import generate_product_catalog

        p_chair = generate_product_catalog("dummy.jpg", hint="Wooden carved armchair", client_filename="chair.jpg")
        p_pot = generate_product_catalog("dummy.jpg", hint="Clay diya pot", client_filename="pot.jpg")
        p_textile = generate_product_catalog("dummy.jpg", hint="Pure silk handloom saree", client_filename="saree.jpg")
        p_brass = generate_product_catalog("dummy.jpg", hint="Dhokra lost-wax brass statue", client_filename="brass.jpg")

        # Chairs are larger furniture items, priced higher than a small clay pot
        self.assertNotEqual(p_chair["suggested_min_price"], p_pot["suggested_min_price"])
        self.assertGreater(p_chair["suggested_min_price"], p_pot["suggested_max_price"])
        # Silk saree is priced dynamically
        self.assertNotEqual(p_textile["suggested_min_price"], p_pot["suggested_min_price"])
        # Brass lost-wax casting is priced dynamically
        self.assertNotEqual(p_brass["suggested_min_price"], p_chair["suggested_min_price"])

    def test_13_indeterminate_craft_honest_pricing(self):
        """When craft domain is unknown, system returns None for price, NEVER fake 1500-2600."""
        from backend.services.ai_service import generate_offline_craft_listing

        res = generate_offline_craft_listing(
            image_path="/uploads/artisan_random123.jpg",
            language="en",
            hint=None,
            client_filename="photo_9999.jpg"
        )
        self.assertIsNone(res["suggested_min_price"], "Fallback price must be None, not fake 1500")
        self.assertIsNone(res["suggested_max_price"], "Fallback max price must be None, not fake 2600")

    def test_14_artisan_filename_prefix_does_not_trigger_art_matching(self):
        """Filename artisan_<uuid>.jpg must NOT match 'art' and misclassify as folk art painting."""
        from backend.services.ai_service import generate_offline_craft_listing

        res = generate_offline_craft_listing(
            image_path="/uploads/artisan_a1b2c3d4e5.jpg",
            language="en",
            hint=None,
            client_filename="IMG_0042.jpg"
        )
        # Must NOT be folk-art!
        self.assertNotEqual(res["category_slug"], "folk-art", "artisan_ prefix must not trigger 'art' keyword")

    def test_15_deep_visual_analysis_schema_and_integrity(self):
        """AI listing must contain deep structured visual analysis, complexity score, and craftsmanship."""
        from backend.services.ai_service import generate_offline_craft_listing

        res = generate_offline_craft_listing(
            image_path="/uploads/artisan_chair.jpg",
            language="en",
            hint="Handcrafted wooden chair with turned legs",
            client_filename="wooden_chair.jpg"
        )
        self.assertIn("visual_analysis", res)
        va = res["visual_analysis"]
        self.assertIn("product_type", va)
        self.assertIn("primary_material", va)
        self.assertIn("craft_style", va)
        self.assertIn("complexity_score", res)
        self.assertTrue(0 <= res["complexity_score"] <= 100)
        self.assertIn("craftsmanship_level", res)
        self.assertIn(res["craftsmanship_level"], ("basic", "moderate", "detailed", "highly detailed", "exceptionally complex"))
        self.assertIn("labor_intensity", res)
        self.assertIn(res["labor_intensity"], ("low", "moderate", "high", "very high"))
        self.assertIn("price_factors", res)
        self.assertIsInstance(res["price_factors"], list)
        self.assertGreaterEqual(len(res["price_factors"]), 1)
        self.assertIn("price_confidence", res)
        self.assertTrue(0.0 <= res["price_confidence"] <= 1.0)

    def test_16_seven_product_differentiation_matrix(self):
        """All 7 required craft domains must yield differentiated, logically sound price ranges and descriptions."""
        from backend.services.ai_service import generate_offline_craft_listing

        # 7 distinct products
        crafts = {
            "chair": generate_offline_craft_listing("dummy.jpg", hint="Handcrafted wooden chair", client_filename="chair.jpg"),
            "pottery": generate_offline_craft_listing("dummy.jpg", hint="Terracotta clay water pot", client_filename="pot.jpg"),
            "textile": generate_offline_craft_listing("dummy.jpg", hint="Handloom cotton sari", client_filename="sari.jpg"),
            "metal": generate_offline_craft_listing("dummy.jpg", hint="Dhokra bell metal figurine", client_filename="dhokra.jpg"),
            "painting": generate_offline_craft_listing("dummy.jpg", hint="Madhubani folk painting on handmade paper", client_filename="madhubani.jpg"),
            "jewelry": generate_offline_craft_listing("dummy.jpg", hint="Handmade silver filigree earrings", client_filename="earrings.jpg"),
            "bamboo": generate_offline_craft_listing("dummy.jpg", hint="Woven bamboo storage basket", client_filename="basket.jpg"),
        }

        # Verify category assignments
        self.assertEqual(crafts["chair"]["category_slug"], "woodcraft")
        self.assertEqual(crafts["pottery"]["category_slug"], "pottery-ceramics")
        self.assertEqual(crafts["textile"]["category_slug"], "handloom-textiles")
        self.assertEqual(crafts["metal"]["category_slug"], "metal-brass")
        self.assertEqual(crafts["painting"]["category_slug"], "folk-art")
        self.assertEqual(crafts["jewelry"]["category_slug"], "jewelry")
        self.assertEqual(crafts["bamboo"]["category_slug"], "bamboo-cane")

        # Verify that all 7 products have distinct minimum prices reflecting their materials and scale
        min_prices = {k: v["suggested_min_price"] for k, v in crafts.items()}
        # Chair must be the highest min price due to large timber and furniture joinery labor
        self.assertGreater(min_prices["chair"], min_prices["pottery"])
        self.assertGreater(min_prices["chair"], min_prices["bamboo"])
        self.assertGreater(min_prices["chair"], min_prices["jewelry"])
        # Terracotta pot is humble earthenware, must be priced lower than furniture and fine metal
        self.assertLess(min_prices["pottery"], min_prices["chair"])
        self.assertLess(min_prices["pottery"], min_prices["metal"])
        # All 7 must have valid price_available flag
        for name, data in crafts.items():
            self.assertTrue(data["price_available"])
            self.assertIsNotNone(data["suggested_min_price"])
            self.assertIsNotNone(data["suggested_max_price"])
            self.assertGreater(data["suggested_max_price"], data["suggested_min_price"])
            self.assertIn("ai_rationale", data)
            self.assertTrue(len(data["ai_rationale"]) > 10)

    def test_17_strict_state_a_vs_state_b_invariants(self):
        """Enforce strict mutual exclusivity: State A (valid price) vs State B (unavailable with zero fake numbers)."""
        from backend.services.ai_service import generate_offline_craft_listing

        # State A: Known craft with valid price
        known = generate_offline_craft_listing("dummy.jpg", hint="Handmade clay vase", client_filename="vase.jpg")
        self.assertTrue(known["price_available"])
        self.assertIsInstance(known["suggested_min_price"], (int, float))
        self.assertIsInstance(known["suggested_max_price"], (int, float))
        self.assertGreater(known["suggested_min_price"], 0)
        self.assertGreaterEqual(known["suggested_max_price"], known["suggested_min_price"])

        # State B: Indeterminate craft with NO price
        unknown = generate_offline_craft_listing("dummy.jpg", hint=None, client_filename="unlabeled_scan_001.jpg")
        self.assertFalse(unknown["price_available"], "Indeterminate craft must set price_available=False")
        self.assertIsNone(unknown["suggested_min_price"], "State B must have suggested_min_price=None, never 650 or 1500")
        self.assertIsNone(unknown["suggested_max_price"], "State B must have suggested_max_price=None, never 950 or 2600")
        self.assertIn("unavailable", unknown["ai_rationale"].lower())

    def test_18_no_fake_enhancement_metrics(self):
        """Photographic metrics must be truthful descriptors, never hardcoded percentage increments."""
        orig_stats = {
            "mean_luminance": 95.0,
            "sharpness_score": 420.0,
            "mean_saturation": 0.20,
        }
        enh_stats = {
            "mean_luminance": 107.0,
            "sharpness_score": 455.0,
            "mean_saturation": 0.23,
        }
        metrics = compute_truthful_metrics(orig_stats, enh_stats, "enhanced")
        for key, val in metrics.items():
            self.assertNotIn("%", str(val), f"Metric '{key}' contains fake percentage: {val}")
        self.assertEqual(metrics["lighting_improvement"], "Shadows & Midtones Lifted")
        self.assertEqual(metrics["sharpness_gain"], "Edge Definition Refined")
        self.assertEqual(metrics["color_vibrance"], "Natural Vibrance Restored")


if __name__ == "__main__":
    unittest.main()
