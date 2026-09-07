import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db
from backend.auth import get_current_user, require_buyer, require_seller

router = APIRouter(prefix="/api/orders", tags=["Order Management"])

class CheckoutAddress(BaseModel):
    full_name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str

class CheckoutRequest(BaseModel):
    address: CheckoutAddress
    payment_method: Optional[str] = "Cash on Delivery"
    # If direct checkout of single item
    direct_product_id: Optional[int] = None
    direct_quantity: Optional[int] = 1

class UpdateOrderStatusRequest(BaseModel):
    status: str  # 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'

VALID_STATUSES = ['order_placed', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']

@router.post("/checkout")
def checkout(req: CheckoutRequest, current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    items_to_order = []

    if req.direct_product_id:
        cursor.execute("""
            SELECT p.id, p.name, p.price, p.quantity, p.is_available, p.seller_id,
                   p.enhanced_image_url, p.original_image_url
            FROM products p WHERE p.id = ?
        """, (req.direct_product_id,))
        p = cursor.fetchone()
        if not p or not p["is_available"] or p["quantity"] < req.direct_quantity:
            conn.close()
            raise HTTPException(status_code=400, detail="Requested item is no longer available in this quantity")
        items_to_order.append({
            "product_id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "quantity": req.direct_quantity,
            "seller_id": p["seller_id"],
            "image": p["enhanced_image_url"] or p["original_image_url"]
        })
    else:
        # From cart
        cursor.execute("""
            SELECT ci.id as cart_item_id, ci.quantity,
                   p.id as product_id, p.name, p.price, p.quantity as stock, p.is_available,
                   p.seller_id, p.enhanced_image_url, p.original_image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        """, (user_id,))
        cart_rows = cursor.fetchall()
        if not cart_rows:
            conn.close()
            raise HTTPException(status_code=400, detail="Your cart is empty")

        for r in cart_rows:
            if not r["is_available"] or r["stock"] < r["quantity"]:
                conn.close()
                raise HTTPException(status_code=400, detail=f"Item '{r['name']}' has insufficient stock")
            items_to_order.append({
                "product_id": r["product_id"],
                "name": r["name"],
                "price": r["price"],
                "quantity": r["quantity"],
                "seller_id": r["seller_id"],
                "image": r["enhanced_image_url"] or r["original_image_url"]
            })

    # Calculate total
    subtotal = sum(item["price"] * item["quantity"] for item in items_to_order)
    delivery_fee = 0.0 if subtotal >= 999.0 else 70.0
    total_amount = round(subtotal + delivery_fee, 2)

    order_number = f"KGS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    address_json = json.dumps(req.address.model_dump())

    # Create order
    cursor.execute("""
        INSERT INTO orders (order_number, buyer_id, total_amount, status, delivery_address_json, payment_method, payment_status)
        VALUES (?, ?, ?, 'order_placed', ?, ?, 'pending')
    """, (order_number, user_id, total_amount, address_json, req.payment_method))
    order_id = cursor.lastrowid

    # Create order items and adjust stock
    seller_notified = set()
    for item in items_to_order:
        cursor.execute("""
            INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, product_name, product_image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (order_id, item["product_id"], item["seller_id"], item["quantity"], item["price"], item["name"], item["image"]))

        # Deduct stock
        cursor.execute("""
            UPDATE products 
            SET quantity = quantity - ?,
                is_available = CASE WHEN quantity - ? <= 0 THEN 0 ELSE 1 END
            WHERE id = ?
        """, (item["quantity"], item["quantity"], item["product_id"]))

        # Check for low stock alert (< 3 remaining)
        cursor.execute("SELECT quantity, name FROM products WHERE id = ?", (item["product_id"],))
        updated_prod = cursor.fetchone()
        if updated_prod and updated_prod["quantity"] <= 2:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, related_order_id)
                VALUES (?, 'Low Stock Alert!', ?, 'stock', ?)
            """, (item["seller_id"], f"Only {updated_prod['quantity']} left for '{updated_prod['name']}'. Please replenish soon.", order_id))

        # Notify Seller
        if item["seller_id"] not in seller_notified:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, related_order_id)
                VALUES (?, 'New Order Received! 🎉', ?, 'order', ?)
            """, (
                item["seller_id"],
                f"You received order #{order_number} for '{item['name']}'. Buyer: {req.address.full_name}, {req.address.city}.",
                order_id
            ))
            # Update seller total sales
            cursor.execute("""
                UPDATE seller_profiles
                SET total_sales = total_sales + 1,
                    earnings = earnings + ?
                WHERE user_id = ?
            """, (item["price"] * item["quantity"], item["seller_id"]))
            seller_notified.add(item["seller_id"])

    # Notify Buyer
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, related_order_id)
        VALUES (?, 'Order Placed Successfully! 📦', ?, 'order', ?)
    """, (
        user_id,
        f"Order #{order_number} for ₹{total_amount} placed. The artisan will hand-pack your craft shortly.",
        order_id
    ))

    # Clear cart if cart order
    if not req.direct_product_id:
        cursor.execute("DELETE FROM cart_items WHERE user_id = ?", (user_id,))

    conn.commit()
    conn.close()

    return {
        "message": "Order placed successfully",
        "order_id": order_id,
        "order_number": order_number,
        "total_amount": total_amount
    }

@router.get("/buyer")
def get_buyer_orders(current_user: dict = Depends(require_buyer)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.* FROM orders o
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC
    """, (user_id,))
    orders = [dict(r) for r in cursor.fetchall()]

    for o in orders:
        try:
            o["delivery_address"] = json.loads(o["delivery_address_json"])
        except Exception:
            o["delivery_address"] = {}

        cursor.execute("""
            SELECT oi.*, u.name as seller_name, sp.location as seller_location
            FROM order_items oi
            JOIN users u ON oi.seller_id = u.id
            JOIN seller_profiles sp ON u.id = sp.user_id
            WHERE oi.order_id = ?
        """, (o["id"],))
        o["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"orders": orders}

@router.get("/seller")
def get_seller_orders(current_user: dict = Depends(require_seller)):
    seller_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT o.id, o.order_number, o.status, o.total_amount,
                        o.delivery_address_json, o.payment_method, o.payment_status,
                        o.created_at, o.updated_at, u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN users u ON o.buyer_id = u.id
        WHERE oi.seller_id = ?
        ORDER BY o.created_at DESC
    """, (seller_id,))
    orders = [dict(r) for r in cursor.fetchall()]

    for o in orders:
        try:
            o["delivery_address"] = json.loads(o["delivery_address_json"])
        except Exception:
            o["delivery_address"] = {}

        cursor.execute("""
            SELECT * FROM order_items
            WHERE order_id = ? AND seller_id = ?
        """, (o["id"], seller_id))
        o["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"orders": orders}

@router.get("/{order_id}")
def get_order_details(order_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    order = dict(row)
    # Check permissions
    if current_user["role"] == "buyer" and order["buyer_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        order["delivery_address"] = json.loads(order["delivery_address_json"])
    except Exception:
        order["delivery_address"] = {}

    cursor.execute("""
        SELECT oi.*, u.name as seller_name, sp.location as seller_location
        FROM order_items oi
        JOIN users u ON oi.seller_id = u.id
        JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE oi.order_id = ?
    """, (order_id,))
    order["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"order": order}

@router.put("/{order_id}/status")
def update_order_status(order_id: int, req: UpdateOrderStatusRequest, current_user: dict = Depends(require_seller)):
    if req.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {VALID_STATUSES}")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, order_number, buyer_id, status FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify seller has items in this order
    cursor.execute("SELECT id FROM order_items WHERE order_id = ? AND seller_id = ?", (order_id, current_user["id"]))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="You have no items in this order")

    cursor.execute("""
        UPDATE orders
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (req.status, order_id))

    # Send Notification to Buyer
    status_messages = {
        "accepted": ("Order Accepted! 🤝", f"The artisan has accepted your order #{order['order_number']} and is preparing it with care."),
        "processing": ("Handcrafting & Packing 🎨", f"Your order #{order['order_number']} is being safely packed in artisan packaging."),
        "shipped": ("Order Shipped! 🚚", f"Your order #{order['order_number']} has been shipped and is in transit."),
        "out_for_delivery": ("Out for Delivery 🛵", f"Your order #{order['order_number']} will arrive today!"),
        "delivered": ("Order Delivered! ✨", f"Your order #{order['order_number']} has been delivered. Thank you for supporting local artisans!"),
        "cancelled": ("Order Cancelled", f"Order #{order['order_number']} has been cancelled.")
    }

    if req.status in status_messages:
        title, msg = status_messages[req.status]
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, related_order_id)
            VALUES (?, ?, ?, 'order', ?)
        """, (order["buyer_id"], title, msg, order_id))

    conn.commit()
    conn.close()

    return {"message": f"Order status updated to '{req.status}'"}
