import os
import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.main import app
from backend.database import init_db

class TestKalaSetuAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["features"]["ai_image_enhancement"])

    def test_02_categories(self):
        res = self.client.get("/api/categories")
        self.assertEqual(res.status_code, 200)
        categories = res.json()["categories"]
        self.assertGreaterEqual(len(categories), 5)
        slugs = [c["slug"] for c in categories]
        self.assertIn("pottery-ceramics", slugs)
        self.assertIn("metal-brass", slugs)

    def test_02a_guest_can_browse_public_marketplace_data(self):
        """Browsing endpoints stay public; only account actions require a token."""
        products_res = self.client.get("/api/products")
        self.assertEqual(products_res.status_code, 200)
        products = products_res.json()["products"]
        self.assertGreater(len(products), 0)

        product_id = products[0]["id"]
        detail_res = self.client.get(f"/api/products/{product_id}")
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.json()["product"]["id"], product_id)

        artisan_id = detail_res.json()["product"]["seller_id"]
        artisan_res = self.client.get(f"/api/seller/artisan/{artisan_id}")
        self.assertEqual(artisan_res.status_code, 200)
        self.assertEqual(artisan_res.json()["artisan"]["id"], artisan_id)

        protected_res = self.client.get("/api/cart")
        self.assertEqual(protected_res.status_code, 401)
        self.assertEqual(
            protected_res.json()["detail"],
            "Authentication required. Please log in."
        )

    def test_03_auth_login_seeded_users(self):
        # Test login as artisan Ramesh
        res = self.client.post("/api/auth/login", json={
            "email": "ramesh@kalasetu.ai",
            "password": "artisan123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "seller")
        self.assertIn("seller_profile", data["user"])

        # Test login as buyer Priya
        res_buyer = self.client.post("/api/auth/login", json={
            "email": "priya@buyer.in",
            "password": "artisan123"
        })
        self.assertEqual(res_buyer.status_code, 200)
        data_buyer = res_buyer.json()
        self.assertEqual(data_buyer["user"]["role"], "buyer")

    def test_04_auth_register_new_artisan(self):
        import uuid
        unique_email = f"artisan_{uuid.uuid4().hex[:6]}@kalasetu.test"
        res = self.client.post("/api/auth/register", json={
            "name": "Bappa Malakar",
            "email": unique_email,
            "password": "artisanpass123",
            "role": "seller",
            "phone": "+91 91234 56789",
            "craft_specialization": "Sholapith Traditional Craft",
            "location": "Kumartuli, Kolkata"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role"], "seller")
        self.assertIn("access_token", data)

    def test_05_ai_upload_and_enhance(self):
        # Login as seller
        login_res = self.client.post("/api/auth/login", json={
            "email": "ramesh@kalasetu.ai",
            "password": "artisan123"
        })
        token = login_res.json()["access_token"]

        # Use an existing seed image
        sample_img_path = BASE_DIR / "frontend" / "static" / "images" / "products" / "terracotta_vase.jpg"
        self.assertTrue(sample_img_path.exists())

        with open(sample_img_path, "rb") as f:
            res = self.client.post(
                "/api/ai/upload-and-enhance",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("test_craft.jpg", f, "image/jpeg")},
                data={"language": "en"}
            )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("image_enhancement", data)
        self.assertIn("enhanced_url", data["image_enhancement"])
        self.assertIn("ai_catalog", data)
        self.assertIn("title", data["ai_catalog"])
        self.assertIn("suggested_min_price", data["ai_catalog"])

    def test_06_product_creation_and_search(self):
        # Login as seller
        login_res = self.client.post("/api/auth/login", json={
            "email": "ramesh@kalasetu.ai",
            "password": "artisan123"
        })
        token = login_res.json()["access_token"]

        # Create new product
        create_res = self.client.post(
            "/api/products",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Terracotta Earthen Diya Set",
                "title": "Set of 6 Festive Handcrafted Terracotta Oil Lamps",
                "description": "Pure clay earthen lamps crafted by hand on a traditional potter wheel.",
                "category_id": 1,
                "material": "River Clay",
                "craft_details": "Hand-molded and sun-dried",
                "tags": ["Diwali", "Diya", "Terracotta", "Handmade"],
                "price": 299.0,
                "original_price": 399.0,
                "quantity": 10,
                "original_image_url": "/static/images/products/terracotta_vase.jpg",
                "enhanced_image_url": "/static/images/products/terracotta_vase.jpg"
            }
        )
        self.assertEqual(create_res.status_code, 201)
        prod_id = create_res.json()["product_id"]

        # Search for product
        search_res = self.client.get("/api/products?q=Diya")
        self.assertEqual(search_res.status_code, 200)
        found = [p for p in search_res.json()["products"] if p["id"] == prod_id]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["name"], "Terracotta Earthen Diya Set")

    def test_07_cart_and_checkout_flow(self):
        # Login as buyer Priya
        login_buyer = self.client.post("/api/auth/login", json={
            "email": "priya@buyer.in",
            "password": "artisan123"
        })
        buyer_token = login_buyer.json()["access_token"]

        # Ensure product 1 has sufficient stock for test
        from backend.database import get_db
        conn = get_db()
        conn.execute("UPDATE products SET quantity = 10, is_available = 1 WHERE id = 1")
        conn.commit()
        conn.close()

        # Add product 1 (Terracotta Vase) to cart
        add_res = self.client.post(
            "/api/cart/add",
            headers={"Authorization": f"Bearer {buyer_token}"},
            json={"product_id": 1, "quantity": 2}
        )
        self.assertEqual(add_res.status_code, 200)

        # Get cart
        cart_res = self.client.get("/api/cart", headers={"Authorization": f"Bearer {buyer_token}"})
        self.assertEqual(cart_res.status_code, 200)
        cart = cart_res.json()
        self.assertGreaterEqual(len(cart["items"]), 1)

        # Checkout
        checkout_res = self.client.post(
            "/api/orders/checkout",
            headers={"Authorization": f"Bearer {buyer_token}"},
            json={
                "address": {
                    "full_name": "Priya Sharma",
                    "phone": "+91 98765 43210",
                    "street": "Flat 402, Green Glen Residency",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "pincode": "560103"
                },
                "payment_method": "Cash on Delivery"
            }
        )
        self.assertEqual(checkout_res.status_code, 200)
        order_data = checkout_res.json()
        self.assertIn("order_number", order_data)
        order_id = order_data["order_id"]

        # Check buyer orders list
        buyer_orders_res = self.client.get("/api/orders/buyer", headers={"Authorization": f"Bearer {buyer_token}"})
        self.assertEqual(buyer_orders_res.status_code, 200)
        my_orders = buyer_orders_res.json()["orders"]
        matched = [o for o in my_orders if o["id"] == order_id]
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0]["status"], "order_placed")

        # Seller checks orders and updates status
        login_seller = self.client.post("/api/auth/login", json={
            "email": "ramesh@kalasetu.ai",
            "password": "artisan123"
        })
        seller_token = login_seller.json()["access_token"]

        seller_orders_res = self.client.get("/api/orders/seller", headers={"Authorization": f"Bearer {seller_token}"})
        self.assertEqual(seller_orders_res.status_code, 200)

        # Update order status: order_placed -> accepted -> shipped -> delivered
        status_update_res = self.client.put(
            f"/api/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {seller_token}"},
            json={"status": "accepted"}
        )
        self.assertEqual(status_update_res.status_code, 200)

        # Verify buyer received notification
        notifs_res = self.client.get("/api/notifications", headers={"Authorization": f"Bearer {buyer_token}"})
        self.assertEqual(notifs_res.status_code, 200)
        notifs = notifs_res.json()["notifications"]
        self.assertTrue(any("Accepted" in n["title"] or "Order" in n["title"] for n in notifs))

    def test_08_firebase_config(self):
        res = self.client.get("/api/auth/firebase-config")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("apiKey", data)
        self.assertIn("projectId", data)
        self.assertIn("is_configured", data)

    def test_09_google_auth(self):
        from unittest.mock import patch
        # Test invalid token
        res_fail = self.client.post("/api/auth/google", json={"id_token": "invalid-token-12345"})
        self.assertEqual(res_fail.status_code, 401)

        # Test valid token with mocked token verification
        mock_payload = {
            "email": "testgoogleuser@artisan.test",
            "name": "Arun Craft Lover",
            "picture": "https://lh3.googleusercontent.com/test-photo.jpg",
            "sub": "google-sub-123456"
        }
        with patch("backend.routers.auth_router.verify_google_firebase_token", return_value=mock_payload):
            res = self.client.post("/api/auth/google", json={"id_token": "valid-mock-token"})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("access_token", data)
            self.assertEqual(data["user"]["email"], "testgoogleuser@artisan.test")
            self.assertEqual(data["user"]["role"], "buyer")

            token = data["access_token"]
            me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
            self.assertEqual(me_res.status_code, 200)
            self.assertEqual(me_res.json()["user"]["email"], "testgoogleuser@artisan.test")

            # Subsequent login with same Google account logs in existing user
            res_repeat = self.client.post("/api/auth/google", json={"id_token": "valid-mock-token"})
            self.assertEqual(res_repeat.status_code, 200)
            self.assertEqual(res_repeat.json()["user"]["id"], data["user"]["id"])

if __name__ == "__main__":
    unittest.main()
