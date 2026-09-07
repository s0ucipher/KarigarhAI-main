import json
from fastapi import APIRouter, Depends, HTTPException
from backend.database import get_db
from backend.auth import require_seller

router = APIRouter(prefix="/api/seller", tags=["Artisan Seller"])

@router.get("/dashboard")
def get_dashboard_data(current_user: dict = Depends(require_seller)):
    seller_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    # Seller profile stats
    cursor.execute("SELECT * FROM seller_profiles WHERE user_id = ?", (seller_id,))
    profile_row = cursor.fetchone()
    profile = dict(profile_row) if profile_row else {}

    # Products count & list
    cursor.execute("""
        SELECT p.*, c.name_en as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.seller_id = ?
        ORDER BY p.created_at DESC
    """, (seller_id,))
    all_products = [dict(r) for r in cursor.fetchall()]
    total_products = len(all_products)

    # Low stock items (< 3)
    low_stock = [p for p in all_products if p["quantity"] <= 2]

    # Active Orders
    cursor.execute("""
        SELECT DISTINCT o.id, o.order_number, o.status, o.total_amount, o.created_at,
               u.name as buyer_name, u.phone as buyer_phone, o.delivery_address_json
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN users u ON o.buyer_id = u.id
        WHERE oi.seller_id = ? AND o.status NOT IN ('delivered', 'cancelled')
        ORDER BY o.created_at DESC
    """, (seller_id,))
    active_orders = [dict(r) for r in cursor.fetchall()]

    for o in active_orders:
        try:
            o["delivery_address"] = json.loads(o["delivery_address_json"])
        except Exception:
            o["delivery_address"] = {}

    # Recent completed orders count
    cursor.execute("""
        SELECT COUNT(DISTINCT o.id)
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.seller_id = ? AND o.status = 'delivered'
    """, (seller_id,))
    delivered_count = cursor.fetchone()[0]

    conn.close()

    return {
        "stats": {
            "total_products": total_products,
            "active_orders_count": len(active_orders),
            "completed_orders_count": delivered_count,
            "total_sales_count": profile.get("total_sales", 0),
            "total_earnings": profile.get("earnings", 0.0),
            "rating": profile.get("rating", 4.9),
            "badge": profile.get("badge", "Artisan")
        },
        "profile": profile,
        "recent_products": all_products[:5],
        "all_products": all_products,
        "active_orders": active_orders,
        "low_stock_items": low_stock
    }

@router.get("/artisan/{artisan_id}")
def get_public_artisan_profile(artisan_id: int):
    """Public profile for buyers to view the craftsman's story, photo, location, and crafts."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT u.id, u.name, u.avatar_url, sp.craft_specialization, sp.location,
               sp.story_bio, sp.badge, sp.rating, sp.total_sales
        FROM users u
        JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE u.id = ? AND u.role = 'seller'
    """, (artisan_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Artisan not found")

    artisan = dict(row)

    # Get their live products
    cursor.execute("""
        SELECT p.*, c.name_en as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.seller_id = ? AND p.is_available = 1
        ORDER BY p.created_at DESC
    """, (artisan_id,))
    artisan["products"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"artisan": artisan}
