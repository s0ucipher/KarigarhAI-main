import unittest
import requests

BASE_URL = "http://127.0.0.1:8000"

class TestPricingIndependence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Login as artisan Ramesh
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ramesh@kalasetu.ai",
            "password": "artisan123"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        cls.token = resp.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    def test_publish_independent_prices(self):
        # Selling Price = 1500, Original Market Value = 1563
        payload = {
            "name": "Independence Test Diya 1",
            "title": "Independence Test Diya 1 Title",
            "description": "Handcrafted earthen lamp test",
            "category_id": 1,
            "material": "Clay",
            "craft_details": "Handmade",
            "tags": ["Test"],
            "price": 1500.0,
            "original_price": 1563.0,
            "quantity": 5,
            "original_image_url": "/static/images/products/terracotta_vase.jpg",
            "enhanced_image_url": "/static/images/products/terracotta_vase.jpg"
        }
        res = requests.post(f"{BASE_URL}/api/products", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        prod_id = res.json()["product_id"]

        get_res = requests.get(f"{BASE_URL}/api/products/{prod_id}")
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()["product"]
        self.assertEqual(data["price"], 1500.0)
        self.assertEqual(data["original_price"], 1563.0)

    def test_publish_when_original_price_null(self):
        # Selling Price = 1800, Original Market Value is None
        payload = {
            "name": "Independence Test Diya 2",
            "title": "Independence Test Diya 2 Title",
            "description": "Handcrafted earthen lamp test",
            "category_id": 1,
            "material": "Clay",
            "craft_details": "Handmade",
            "tags": ["Test"],
            "price": 1800.0,
            "original_price": None,
            "quantity": 3,
            "original_image_url": "/static/images/products/terracotta_vase.jpg",
            "enhanced_image_url": "/static/images/products/terracotta_vase.jpg"
        }
        res = requests.post(f"{BASE_URL}/api/products", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        prod_id = res.json()["product_id"]

        get_res = requests.get(f"{BASE_URL}/api/products/{prod_id}")
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()["product"]
        self.assertEqual(data["price"], 1800.0)
        # Verify backend did not derive original_price = price
        self.assertIsNone(data["original_price"])

if __name__ == "__main__":
    unittest.main()
