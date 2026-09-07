from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.database import get_db
from backend.auth import require_buyer

router = APIRouter(prefix="/api/cart", tags=["Shopping Cart"])

class AddToCartRequest(BaseModel):
    product_id: int
    quantity: int = 1

class UpdateCartItemRequest(BaseModel):
    quantity: int

@router.get("")
def get_cart(current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT ci.id as cart_item_id, ci.quantity, ci.created_at,
               p.id as product_id, p.name, p.title, p.price, p.original_price,
               p.quantity as stock_available, p.is_available,
               p.enhanced_image_url, p.original_image_url,
               u.name as seller_name, sp.location as seller_location
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN users u ON p.seller_id = u.id
        JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    items = [dict(r) for r in rows]
    subtotal = sum(item["price"] * item["quantity"] for item in items if item["is_available"])
    # Free shipping on orders above 999
    delivery_fee = 0.0 if subtotal >= 999.0 or subtotal == 0 else 70.0
    total = subtotal + delivery_fee

    return {
        "items": items,
        "item_count": sum(item["quantity"] for item in items),
        "subtotal": round(subtotal, 2),
        "delivery_fee": round(delivery_fee, 2),
        "total": round(total, 2)
    }

@router.post("/add")
def add_to_cart(req: AddToCartRequest, current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, price, quantity, is_available FROM products WHERE id = ?", (req.product_id,))
    product = cursor.fetchone()
    if not product:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    if not product["is_available"] or product["quantity"] < 1:
        conn.close()
        raise HTTPException(status_code=400, detail="Product is currently out of stock")

    # Check if item already exists in user's cart
    cursor.execute("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?", (user_id, req.product_id))
    existing = cursor.fetchone()

    if existing:
        new_qty = existing["quantity"] + req.quantity
        if new_qty > product["quantity"]:
            new_qty = product["quantity"]
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_qty, existing["id"]))
    else:
        qty = min(req.quantity, product["quantity"])
        cursor.execute("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", (user_id, req.product_id, qty))

    conn.commit()
    conn.close()
    return {"message": "Product added to cart"}

@router.put("/item/{item_id}")
def update_cart_item(item_id: int, req: UpdateCartItemRequest, current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT ci.id, ci.product_id, p.quantity as stock_available
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = ? AND ci.user_id = ?
    """, (item_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Cart item not found")

    if req.quantity <= 0:
        cursor.execute("DELETE FROM cart_items WHERE id = ?", (item_id,))
    else:
        qty = min(req.quantity, row["stock_available"])
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (qty, item_id))

    conn.commit()
    conn.close()
    return {"message": "Cart updated"}

@router.delete("/item/{item_id}")
def remove_cart_item(item_id: int, current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM cart_items WHERE id = ? AND user_id = ?", (item_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Item removed from cart"}

@router.delete("/clear")
def clear_cart(current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM cart_items WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"message": "Cart cleared"}
