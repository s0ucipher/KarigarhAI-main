from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, List
import json
from backend.database import get_db
from backend.auth import get_current_user, require_seller, get_optional_current_user

router = APIRouter(tags=["Products & Marketplace"])

class ProductCreateRequest(BaseModel):
    name: str
    title: str
    description: str
    category_id: int
    material: Optional[str] = None
    craft_details: Optional[str] = None
    tags: Optional[List[str]] = []
    price: float
    original_price: Optional[float] = None
    quantity: int = 1
    original_image_url: str
    enhanced_image_url: Optional[str] = None
    ai_generated_meta: Optional[dict] = None

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    material: Optional[str] = None
    craft_details: Optional[str] = None
    tags: Optional[List[str]] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    quantity: Optional[int] = None
    is_available: Optional[int] = None

@router.get("/api/categories")
def get_categories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return {"categories": [dict(r) for r in rows]}

@router.get("/api/products")
def get_products(
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Category slug or ID"),
    seller_id: Optional[int] = Query(None, description="Filter by artisan seller"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort: Optional[str] = Query("newest", description="newest, price_low, price_high, popular")
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT p.*, c.name_en as category_name_en, c.name_hi as category_name_hi, c.name_bn as category_name_bn,
               c.slug as category_slug, u.name as seller_name, u.avatar_url as seller_avatar,
               sp.location as seller_location, sp.craft_specialization as seller_craft, sp.rating as seller_rating
        FROM products p
        JOIN categories c ON p.category_id = c.id
        JOIN users u ON p.seller_id = u.id
        JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE p.is_available = 1
    """
    params = []

    if q:
        query += """ AND (
            p.name LIKE ? OR p.title LIKE ? OR p.description LIKE ? 
            OR p.tags LIKE ? OR p.material LIKE ? OR c.name_en LIKE ? OR sp.location LIKE ?
        )"""
        term = f"%{q.strip()}%"
        params.extend([term, term, term, term, term, term, term])

    if category:
        if category.isdigit():
            query += " AND p.category_id = ?"
            params.append(int(category))
        else:
            query += " AND c.slug = ?"
            params.append(category)

    if seller_id:
        query += " AND p.seller_id = ?"
        params.append(seller_id)

    if min_price is not None:
        query += " AND p.price >= ?"
        params.append(min_price)

    if max_price is not None:
        query += " AND p.price <= ?"
        params.append(max_price)

    if sort == "price_low":
        query += " ORDER BY p.price ASC"
    elif sort == "price_high":
        query += " ORDER BY p.price DESC"
    else:
        query += " ORDER BY p.created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        d = dict(r)
        try:
            d["tags"] = json.loads(d["tags"]) if d["tags"] else []
        except Exception:
            d["tags"] = []
        try:
            d["ai_generated_meta"] = json.loads(d["ai_generated_meta"]) if d["ai_generated_meta"] else {}
        except Exception:
            d["ai_generated_meta"] = {}
        items.append(d)

    return {"products": items, "count": len(items)}

@router.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*, c.name_en as category_name_en, c.name_hi as category_name_hi, c.name_bn as category_name_bn,
               c.slug as category_slug, u.name as seller_name, u.avatar_url as seller_avatar,
               sp.location as seller_location, sp.craft_specialization as seller_craft,
               sp.story_bio as seller_bio, sp.badge as seller_badge, sp.rating as seller_rating,
               sp.total_sales as seller_sales
        FROM products p
        JOIN categories c ON p.category_id = c.id
        JOIN users u ON p.seller_id = u.id
        JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE p.id = ?
    """, (product_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    product = dict(row)
    try:
        product["tags"] = json.loads(product["tags"]) if product["tags"] else []
    except Exception:
        product["tags"] = []
    try:
        product["ai_generated_meta"] = json.loads(product["ai_generated_meta"]) if product["ai_generated_meta"] else {}
    except Exception:
        product["ai_generated_meta"] = {}

    # Fetch similar recommendations from same category or same seller
    cursor.execute("""
        SELECT id, name, title, price, original_price, enhanced_image_url, original_image_url
        FROM products
        WHERE category_id = ? AND id != ? AND is_available = 1
        LIMIT 4
    """, (product["category_id"], product_id))
    similar_rows = cursor.fetchall()
    product["similar_products"] = [dict(r) for r in similar_rows]

    conn.close()
    return {"product": product}

@router.post("/api/products", status_code=status.HTTP_201_CREATED)
def create_product(req: ProductCreateRequest, current_user: dict = Depends(require_seller)):
    conn = get_db()
    cursor = conn.cursor()

    seller_id = current_user["id"]
    tags_json = json.dumps(req.tags or [])
    ai_meta_json = json.dumps(req.ai_generated_meta or {})

    cursor.execute("""
        INSERT INTO products (
            seller_id, name, title, description, category_id, material,
            craft_details, tags, price, original_price, quantity, is_available,
            original_image_url, enhanced_image_url, ai_generated_meta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    """, (
        seller_id, req.name.strip(), req.title.strip(), req.description.strip(),
        req.category_id, req.material, req.craft_details, tags_json,
        req.price, req.original_price if req.original_price is not None else None, req.quantity,
        req.original_image_url, req.enhanced_image_url or req.original_image_url,
        ai_meta_json
    ))
    new_id = cursor.lastrowid

    # Create notification for the artisan
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'Product Listed Successfully!', ?, 'stock')
    """, (seller_id, f"'{req.name}' is now live on the marketplace."))

    conn.commit()
    conn.close()

    return {"message": "Product published successfully", "product_id": new_id}

@router.put("/api/products/{product_id}")
def update_product(product_id: int, req: ProductUpdateRequest, current_user: dict = Depends(require_seller)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT seller_id, name FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    if row["seller_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You do not have permission to edit this product")

    updates = []
    params = []

    if req.name is not None:
        updates.append("name = ?")
        params.append(req.name.strip())
    if req.title is not None:
        updates.append("title = ?")
        params.append(req.title.strip())
    if req.description is not None:
        updates.append("description = ?")
        params.append(req.description.strip())
    if req.category_id is not None:
        updates.append("category_id = ?")
        params.append(req.category_id)
    if req.material is not None:
        updates.append("material = ?")
        params.append(req.material.strip())
    if req.craft_details is not None:
        updates.append("craft_details = ?")
        params.append(req.craft_details.strip())
    if req.tags is not None:
        updates.append("tags = ?")
        params.append(json.dumps(req.tags))
    if req.price is not None:
        updates.append("price = ?")
        params.append(req.price)
    if req.original_price is not None:
        updates.append("original_price = ?")
        params.append(req.original_price)
    if req.quantity is not None:
        updates.append("quantity = ?")
        params.append(req.quantity)
        if req.quantity == 0:
            updates.append("is_available = 0")
        elif req.is_available is None:
            updates.append("is_available = 1")
    if req.is_available is not None:
        updates.append("is_available = ?")
        params.append(req.is_available)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        query = f"UPDATE products SET {', '.join(updates)} WHERE id = ?"
        params.append(product_id)
        cursor.execute(query, params)
        conn.commit()

    conn.close()
    return {"message": "Product updated successfully"}

@router.delete("/api/products/{product_id}")
def delete_product(product_id: int, current_user: dict = Depends(require_seller)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT seller_id, name FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    if row["seller_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Permission denied")

    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"message": "Product removed successfully"}
