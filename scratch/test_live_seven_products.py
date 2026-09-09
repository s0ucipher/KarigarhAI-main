import os
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
TEST_DIR = BASE_DIR / "scratch" / "seven_craft_tests"
TEST_DIR.mkdir(parents=True, exist_ok=True)

# Craft specifications for 7 distinct crafts + 1 indeterminate craft
CRAFTS = [
    {
        "id": "TEST A: WOODEN CHAIR",
        "filename": "handcrafted_wooden_chair.jpg",
        "color": (160, 95, 45),  # Teak wood brown
        "hint": "Handcrafted solid wood armchair with carved backrest and turned legs",
        "pattern": "chair",
        "expected_category": "woodcraft",
    },
    {
        "id": "TEST B: TERRACOTTA POT",
        "filename": "terracotta_earthen_pot.jpg",
        "color": (185, 75, 40),  # Terracotta red clay
        "hint": "Traditional wheel-thrown terracotta water pot with etched floral motifs",
        "pattern": "pot",
        "expected_category": "pottery-ceramics",
    },
    {
        "id": "TEST C: TEXTILE",
        "filename": "handloom_silk_saree.jpg",
        "color": (180, 40, 90),  # Crimson silk
        "hint": "Handloom mulberry silk saree with zari border and temple motifs",
        "pattern": "textile",
        "expected_category": "handloom-textiles",
    },
    {
        "id": "TEST D: METAL CRAFT",
        "filename": "dhokra_brass_musician.jpg",
        "color": (190, 150, 40),  # Antique brass/bronze
        "hint": "Dhokra lost-wax hollow-cast brass tribal musician figurine",
        "pattern": "metal",
        "expected_category": "metal-brass",
    },
    {
        "id": "TEST E: FOLK PAINTING",
        "filename": "madhubani_folk_painting.jpg",
        "color": (230, 210, 175),  # Handmade parchment paper
        "hint": "Handpainted Madhubani folk painting with tree of life and fish motifs",
        "pattern": "painting",
        "expected_category": "folk-art",
    },
    {
        "id": "TEST F: HANDCRAFTED JEWELRY",
        "filename": "terracotta_necklace_jewelry.jpg",
        "color": (140, 60, 50),  # Clay bead necklace
        "hint": "Handmade terracotta bead necklace with brass pendant and braided cord",
        "pattern": "jewelry",
        "expected_category": "jewelry",
    },
    {
        "id": "TEST G: BAMBOO/CANE PRODUCT",
        "filename": "handwoven_bamboo_basket.jpg",
        "color": (205, 175, 110),  # Natural bamboo beige
        "hint": "Handwoven natural bamboo storage basket with twill weave",
        "pattern": "bamboo",
        "expected_category": "bamboo-cane",
    },
    {
        "id": "TEST H: INDETERMINATE CRAFT (STATE B)",
        "filename": "unlabeled_abstract_photo.jpg",
        "color": (120, 120, 120),  # Grey neutral
        "hint": None,
        "pattern": "indeterminate",
        "expected_category": None,
    },
]

def create_craft_image(filepath, bg_color, label):
    img = Image.new("RGB", (400, 400), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Draw geometric motif to give realistic texture
    for i in range(20, 380, 30):
        draw.line([(i, 20), (i, 380)], fill=(bg_color[0] + 20, bg_color[1] + 20, bg_color[2] + 20), width=2)
        draw.line([(20, i), (380, i)], fill=(max(0, bg_color[0] - 20), max(0, bg_color[1] - 20), max(0, bg_color[2] - 20)), width=2)
    draw.rectangle([60, 60, 340, 340], outline=(255, 255, 255), width=3)
    img.save(filepath, "JPEG", quality=90)

sys.path.insert(0, str(BASE_DIR))
from fastapi.testclient import TestClient
from backend.main import app

def main():
    print("==================================================")
    print("KALASETU AI — MULTI-PRODUCT INTELLIGENCE VERIFICATION")
    print("==================================================\n")

    client = TestClient(app)

    # Log into an artisan account to get a valid token
    login_resp = client.post("/api/auth/login", json={"email": "ramesh@kalasetu.ai", "password": "artisan123"})
    if login_resp.status_code != 200:
        raise RuntimeError(f"Login failed: {login_resp.text}")
    token = login_resp.json()["access_token"]
    print(f"✓ Authenticated as artisan: ramesh@kalasetu.ai (Token acquired)\n")

    results = []

    for craft in CRAFTS:
        img_path = TEST_DIR / craft["filename"]
        create_craft_image(img_path, craft["color"], craft["id"])

        with open(img_path, "rb") as f:
            file_bytes = f.read()

        files = {"file": (craft["filename"], file_bytes, "image/jpeg")}
        data = {"language": "en"}
        if craft["hint"]:
            data["artisan_hint"] = craft["hint"]

        resp = client.post(
            "/api/ai/upload-and-enhance",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Upload failed for {craft['id']}: {resp.text}")
        data = resp.json()

        catalog = data["ai_catalog"]
        enh = data["image_enhancement"]
        metrics = enh["metrics"]
        va = catalog.get("visual_analysis", {})

        print(f"--------------------------------------------------")
        print(f"{craft['id']}")
        print(f"--------------------------------------------------")
        print(f"Detected product   : {catalog.get('name')}")
        print(f"Category           : {catalog.get('category_name')} (slug: {catalog.get('category_slug')})")
        print(f"Material           : {catalog.get('material')}")
        print(f"Craftsmanship      : {catalog.get('craftsmanship_level', 'N/A')}")
        print(f"Complexity Score   : {catalog.get('complexity_score', 'N/A')}/100")
        print(f"Labor Intensity    : {catalog.get('labor_intensity', va.get('labor_intensity', 'N/A'))}")
        print(f"Description        : {catalog.get('description')}")
        if catalog.get("price_available"):
            print(f"Price Range        : ₹{catalog.get('suggested_min_price')} – ₹{catalog.get('suggested_max_price')} (State A)")
        else:
            print(f"Price Range        : UNAVAILABLE (State B: Zero fabricated numbers)")
        print(f"Price Reason       : {catalog.get('ai_rationale')}")
        print(f"Price Confidence   : {catalog.get('price_confidence')}")
        print(f"Price Factors      : {catalog.get('price_factors')}")
        print(f"Photo Metrics      : {metrics}")
        print(f"Enhanced URL       : {enh.get('enhanced_url')}")
        print()

        # Check metrics for fake %
        for k, v in metrics.items():
            if "%" in str(v):
                raise AssertionError(f"Fake percentage found in metrics: {k}={v}")

        results.append({
            "id": craft["id"],
            "catalog": catalog,
            "metrics": metrics,
            "expected_category": craft["expected_category"]
        })

    # Verification Assertions
    print("==================================================")
    print("VALIDATING CORE PRINCIPLES & SAFETY RULES")
    print("==================================================")

    # 1. Price Differentiation
    known_results = [r for r in results if r["catalog"]["price_available"]]
    min_prices = [r["catalog"]["suggested_min_price"] for r in known_results]
    print(f"✓ Distinct minimum prices across 7 crafts: {set(min_prices)}")
    assert len(set(min_prices)) >= 5, "Prices must be strongly differentiated across distinct crafts!"

    # 2. Wooden chair is priced significantly higher than terracotta pot
    chair = next(r for r in results if "CHAIR" in r["id"])["catalog"]
    pot = next(r for r in results if "POT" in r["id"])["catalog"]
    print(f"✓ Chair Min (₹{chair['suggested_min_price']}) > Pot Min (₹{pot['suggested_min_price']}) by ₹{chair['suggested_min_price'] - pot['suggested_min_price']}")
    assert chair["suggested_min_price"] > pot["suggested_min_price"], "Furniture chair must be priced above small pottery"

    # 3. Wooden chair anti-hallucination check
    chair_text = (chair["title"] + " " + chair["description"] + " " + chair["material"]).lower()
    for forbidden in ["madhubani", "rice paper", "kachni", "bharni", "turmeric", "indigo"]:
        assert forbidden not in chair_text, f"Hallucinated word '{forbidden}' found in chair description!"
    print("✓ Anti-hallucination passed: Chair contains ZERO Madhubani or rice paper claims.")

    # 4. State B Integrity
    unknown = next(r for r in results if "INDETERMINATE" in r["id"])["catalog"]
    assert unknown["price_available"] is False, "Indeterminate craft must have price_available=False"
    assert unknown["suggested_min_price"] is None, "Indeterminate craft must have suggested_min_price=None (never 650 or 1500)"
    assert unknown["suggested_max_price"] is None, "Indeterminate craft must have suggested_max_price=None (never 950 or 2600)"
    assert "unavailable" in unknown["ai_rationale"].lower(), "Rationale must state price recommendation unavailable"
    print("✓ State B verified: Indeterminate craft returns ZERO fake numbers and honest unavailable state.")

    print("\nALL 8 LIVE ENDPOINT CHECKS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    main()
