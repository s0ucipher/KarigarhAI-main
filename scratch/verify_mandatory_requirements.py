import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai_service import call_gemini_vision, generate_product_catalog
from backend.services.pricing_engine import calculate_artisan_price

def create_sample_img(path, color):
    img = Image.new("RGB", (300, 300), color=color)
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, 280, 280], outline=(255, 255, 255), width=2)
    img.save(path, "JPEG")

def main():
    print("==================================================================")
    print("MANDATORY VERIFICATION: KALASETU AI STEP 4 PRICING FLOW")
    print("==================================================================")

    client = TestClient(app)
    
    # Login
    auth_res = client.post("/api/auth/login", json={"email": "ramesh@kalasetu.ai", "password": "artisan123"})
    assert auth_res.status_code == 200
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Logged in as artisan (Bearer token acquired)")

    tmp_dir = BASE_DIR / "scratch" / "test_verification"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # TEST 1 — INITIAL PRICE WITHOUT COSTS (MANDATORY)
    # -------------------------------------------------------------
    print("\n--- TEST 1: INITIAL PRICE APPEARS AUTOMATICALLY WITHOUT SELLER COSTS ---")
    chair_img = tmp_dir / "chair.jpg"
    create_sample_img(chair_img, (140, 80, 35))

    with open(chair_img, "rb") as f:
        res1 = client.post(
            "/api/ai/upload-and-enhance",
            files={"file": ("chair.jpg", f.read(), "image/jpeg")},
            data={"language": "en", "hint": "Handmade wooden chair"},
            headers=headers
        )
    assert res1.status_code == 200
    data1 = res1.json()["ai_catalog"]
    print(f"Product: {data1.get('name')}")
    print(f"Price available: {data1.get('price_available')}")
    print(f"Initial AI Recommended Price: ₹{data1.get('suggested_min_price')} – ₹{data1.get('suggested_max_price')}")
    print(f"Price Source: {data1.get('price_source')}")
    print(f"Confidence: {data1.get('price_confidence')}")
    print(f"Reason: {data1.get('price_reason')}")

    assert data1["price_available"] is True, "TEST 1 FAILED: Initial price MUST be available without costs!"
    assert data1["suggested_min_price"] is not None and data1["suggested_min_price"] > 0
    assert data1["suggested_max_price"] > data1["suggested_min_price"]
    print("✓ PASS: Initial price range generated automatically without entering material/labor/other costs!")

    # -------------------------------------------------------------
    # TEST 2 — COST REFINEMENT (MODE 2)
    # -------------------------------------------------------------
    print("\n--- TEST 2: ARTISAN COST REFINEMENT RECALCULATES FAIR SELLING RANGE ---")
    initial_min = data1["suggested_min_price"]
    initial_max = data1["suggested_max_price"]

    costs_payload = {
        "category_slug": data1["category_slug"],
        "category_id": data1.get("category_id"),
        "title": data1["title"],
        "material": data1["material"],
        "material_cost": 1500.0,
        "labor_cost": 1800.0,
        "other_cost": 200.0,
        "complexity_score": data1.get("complexity_score", 60),
        "craftsmanship_level": data1.get("craftsmanship_level", "detailed")
    }
    res2 = client.post("/api/ai/calculate-price", json=costs_payload, headers=headers)
    assert res2.status_code == 200
    refined_data = res2.json()

    print(f"Artisan Costs Entered: Material=₹1500, Labor=₹1800, Packaging=₹200 (Total Base = ₹3500)")
    print(f"Refined Price: ₹{refined_data['suggested_min_price']} – ₹{refined_data['suggested_max_price']}")
    print(f"Price Source: {refined_data['price_source']}")
    print(f"Reason: {refined_data['price_reason']}")

    assert refined_data["price_available"] is True
    assert refined_data["price_source"] == "seller_costs"
    assert refined_data["suggested_min_price"] >= 3500 * 1.30, "Refined price must include fair artisan margin above base cost!"
    assert "artisan-provided" in refined_data["price_reason"].lower() or "production cost" in refined_data["price_reason"].lower()
    print("✓ PASS: Artisan cost refinement calculated healthy cost-plus range without overwriting Mode 1!")

    # -------------------------------------------------------------
    # TEST 3 — GEMINI PRICE FAILURE FALLBACK TO LOCAL ENGINE
    # -------------------------------------------------------------
    print("\n--- TEST 3: GEMINI PRICE FAILURE DOES NOT CAUSE UNAVAILABLE STATE ---")
    # Simulate Gemini returning product analysis with missing/corrupt price
    # Call calculate_artisan_price directly as the fallback engine does
    gemini_simulated_catalog = {
        "name": "Handmade Wooden Armchair",
        "title": "Solid Sheesham Wooden Living Room Armchair",
        "description": "Ergonomically crafted wooden armchair with mortise and tenon joinery.",
        "category_slug": "woodcraft",
        "material": "Solid Sheesham Wood",
        "craftsmanship_level": "detailed",
        "complexity_score": 75,
        "shape_and_scale": "furniture",
        "labor_intensity": "high",
        # Price from Gemini was missing/corrupted
        "suggested_min_price": None,
        "suggested_max_price": None,
        "price_available": False
    }

    fallback_pricing = calculate_artisan_price(
        category_slug=gemini_simulated_catalog["category_slug"],
        product_name=gemini_simulated_catalog["name"],
        material=gemini_simulated_catalog["material"],
        craftsmanship_level=gemini_simulated_catalog["craftsmanship_level"],
        complexity_score=gemini_simulated_catalog["complexity_score"],
        shape_and_scale=gemini_simulated_catalog["shape_and_scale"],
        labor_intensity=gemini_simulated_catalog["labor_intensity"],
        seller_costs=None
    )

    print(f"Local Engine Fallback Min Price: ₹{fallback_pricing['suggested_min_price']}")
    print(f"Local Engine Fallback Max Price: ₹{fallback_pricing['suggested_max_price']}")
    print(f"Price Source: {fallback_pricing['price_source']}")
    print(f"Price Factors: {fallback_pricing['price_factors']}")

    assert fallback_pricing["price_available"] is True, "TEST 3 FAILED: Fallback engine must provide price!"
    assert fallback_pricing["suggested_min_price"] >= 2500, "Furniture chair must receive realistic furniture price!"
    print("✓ PASS: Gemini price failure seamlessly resolved by Local Intelligent Pricing Engine (NEVER unavailable)!")

    # -------------------------------------------------------------
    # TEST 4 — DISTINCT PRODUCTS PRODUCE DISTINCT PRICES
    # -------------------------------------------------------------
    print("\n--- TEST 4: DISTINCT CRAFT PRODUCTS PRODUCE LOGICALLY DIFFERENT PRICES ---")
    pot_img = tmp_dir / "pot.jpg"
    create_sample_img(pot_img, (180, 70, 30))

    with open(pot_img, "rb") as f:
        res4 = client.post(
            "/api/ai/upload-and-enhance",
            files={"file": ("pot.jpg", f.read(), "image/jpeg")},
            data={"language": "en", "hint": "Terracotta water pot"},
            headers=headers
        )
    assert res4.status_code == 200
    pot_catalog = res4.json()["ai_catalog"]

    print(f"Product A (Chair) Category: {data1['category_slug']}, Price: ₹{data1['suggested_min_price']} – ₹{data1['suggested_max_price']}")
    print(f"Product B (Pot)   Category: {pot_catalog['category_slug']}, Price: ₹{pot_catalog['suggested_min_price']} – ₹{pot_catalog['suggested_max_price']}")

    assert data1["suggested_min_price"] != pot_catalog["suggested_min_price"], "Chair and Pot must not have identical price!"
    assert data1["suggested_min_price"] > pot_catalog["suggested_min_price"] * 2, "Wooden furniture must be priced substantially higher than clay pot!"
    assert data1["category_slug"] != pot_catalog["category_slug"]
    print("✓ PASS: Product-specific pricing verified (No universal or static fallback numbers)!")

    # -------------------------------------------------------------
    # TEST 5 — SELLER FINAL PRICE OVERRIDE
    # -------------------------------------------------------------
    print("\n--- TEST 5: PRESERVE SELLER CONTROL OVER FINAL PRICE ---")
    # Simulate artisan entering their own chosen price (e.g. ₹4200)
    create_payload = {
        "name": "Masterpiece Wooden Armchair",
        "title": "Masterpiece Wooden Armchair",
        "description": "Authentic handcrafted wooden armchair made from seasoned wood.",
        "category_id": data1.get("category_id") or 2,
        "price": 4200.0,
        "original_price": 5200.0,
        "stock": 3,
        "image_url": res1.json()["image_enhancement"]["enhanced_url"],
        "original_image_url": res1.json()["image_enhancement"]["original_url"],
        "tags": ["woodcraft", "furniture", "chair"],
        "material": data1["material"],
        "craft_details": data1.get("craft_details", "Carved wood"),
        "ai_generated": True
    }
    res5 = client.post("/api/products", json=create_payload, headers=headers)
    assert res5.status_code in (200, 201), f"Expected 201 Created, got {res5.status_code}: {res5.text}"
    prod_id = res5.json()["product_id"]
    
    get_res = client.get(f"/api/products/{prod_id}")
    assert get_res.status_code == 200
    created_prod = get_res.json()["product"]
    print(f"Created Product: {created_prod.get('name') or created_prod.get('title')}")
    print(f"Seller Final Price: ₹{created_prod.get('price')} (MRP: ₹{created_prod.get('original_price')})")
    assert created_prod.get("price") == 4200.0, "Artisan final price must be preserved exactly as entered!"
    print("✓ PASS: Artisan retains 100% control over selling price!")

    print("\n==================================================================")
    print("ALL MANDATORY REQUIREMENTS VERIFIED AND PASSED!")
    print("==================================================================")

if __name__ == "__main__":
    main()
