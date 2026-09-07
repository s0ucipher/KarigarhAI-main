"""Additive mobile-API router — reuses existing services, rewrites nothing.

Provides the endpoints the KalaSetu AI mobile app needs that the legacy
web SPA did not have:
  GET/POST /api/enquiries (+ status update)   buyer <-> artisan messaging
  POST     /api/translate                      catalogue translation (en/hi/bn)
  POST     /api/pricing/recommend              labelled price recommendation
  GET      /api/speech/info                    speech capability descriptor
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.database import get_db
from backend.services.ai_service import generate_product_catalog

router = APIRouter(tags=["Mobile"])


# ---------- Enquiries ----------
class EnquiryCreate(BaseModel):
    product_id: int
    seller_id: Optional[int] = None
    message: str
    quantity: int = 1


class EnquiryStatus(BaseModel):
    status: str  # sent | read | replied | closed


@router.post("/api/enquiries", status_code=201)
def create_enquiry(payload: EnquiryCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can send enquiries")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    conn = get_db()
    cur = conn.cursor()
    prod = cur.execute(
        "SELECT id, seller_id, title, name FROM products WHERE id = ?",
        (payload.product_id,),
    ).fetchone()
    if not prod:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    seller_id = payload.seller_id or prod["seller_id"]
    cur.execute(
        """INSERT INTO enquiries (product_id, buyer_id, seller_id, message, quantity)
           VALUES (?, ?, ?, ?, ?)""",
        (payload.product_id, user["id"], seller_id, payload.message.strip(),
         max(1, payload.quantity or 1)),
    )
    eid = cur.lastrowid
    cur.execute(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'enquiry')",
        (seller_id, "New enquiry received",
         f"{user.get('name', 'A buyer')} asked about '{prod['title'] or prod['name']}'"),
    )
    conn.commit()
    row = cur.execute("SELECT * FROM enquiries WHERE id = ?", (eid,)).fetchone()
    conn.close()
    return {"enquiry": dict(row)}


@router.get("/api/enquiries")
def list_enquiries(user: dict = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    col = "buyer_id" if user["role"] == "buyer" else "seller_id"
    rows = cur.execute(
        f"""SELECT e.*, p.title AS product_name, p.enhanced_image_url AS product_image,
                   u.name AS other_party
            FROM enquiries e
            LEFT JOIN products p ON p.id = e.product_id
            LEFT JOIN users u ON u.id = CASE WHEN e.buyer_id = ? THEN e.seller_id ELSE e.buyer_id END
            WHERE e.{col} = ? ORDER BY e.created_at DESC LIMIT 100""",
        (user["id"], user["id"]),
    ).fetchall()
    conn.close()
    return {"enquiries": [dict(r) for r in rows]}


@router.put("/api/enquiries/{enquiry_id}")
def update_enquiry(enquiry_id: int, payload: EnquiryStatus,
                   user: dict = Depends(get_current_user)):
    if payload.status not in ("sent", "read", "replied", "closed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    conn = get_db()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM enquiries WHERE id = ?", (enquiry_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if user["id"] not in (row["buyer_id"], row["seller_id"]):
        conn.close()
        raise HTTPException(status_code=403, detail="Not a participant")
    cur.execute("UPDATE enquiries SET status = ? WHERE id = ?",
                (payload.status, enquiry_id))
    conn.commit()
    updated = cur.execute("SELECT * FROM enquiries WHERE id = ?",
                          (enquiry_id,)).fetchone()
    conn.close()
    return {"enquiry": dict(updated)}


# ---------- Translation ----------
class TranslateRequest(BaseModel):
    image_url: Optional[str] = None
    language: str = "en"
    hint: Optional[str] = None
    text: Optional[str] = None  # reserved: phrase-level translation passthrough


@router.post("/api/translate")
def translate_catalogue(req: TranslateRequest, user: dict = Depends(get_current_user)):
    if req.language not in ("en", "hi", "bn"):
        raise HTTPException(status_code=400, detail="Supported languages: en, hi, bn")
    if not req.image_url:
        return {"language": req.language, "translated": {"text": req.text or ""}}
    from pathlib import Path
    from backend.config import UPLOAD_DIR
    img_path = UPLOAD_DIR / Path(req.image_url).name
    catalog = generate_product_catalog(
        image_path=str(img_path) if img_path.exists() else Path(req.image_url).name,
        user_language=req.language,
        hint=req.hint,
    )
    return {"language": req.language, "ai_catalog": catalog}


# ---------- Pricing ----------
class PricingRequest(BaseModel):
    material_cost: float = 0
    labour_cost: float = 0
    days_spent: float = 0
    other_costs: float = 0
    margin_percent: float = 20
    ai_min: Optional[float] = None
    ai_max: Optional[float] = None


@router.post("/api/pricing/recommend")
def recommend_price(req: PricingRequest, user: dict = Depends(get_current_user)):
    base = max(0, req.material_cost) + max(0, req.labour_cost) + max(0, req.other_costs)
    if req.days_spent and not req.labour_cost:
        base += req.days_spent * 400  # fallback daily artisan wage assumption
    cost_plus = round(base * (1 + max(0, req.margin_percent) / 100), 2)
    rec_min = rec_max = None
    if req.ai_min and req.ai_max:
        rec_min = round((cost_plus + req.ai_min) / 2, 2)
        rec_max = round((cost_plus + req.ai_max) / 2, 2)
    else:
        rec_min, rec_max = round(cost_plus * 0.95, 2), round(cost_plus * 1.15, 2)
    return {
        "recommendation": True,  # never presented as guaranteed market price
        "cost_plus_price": cost_plus,
        "recommended_min": rec_min,
        "recommended_max": rec_max,
        "currency": "INR",
        "note": "AI-assisted recommendation based on your costs and comparable craft bands. You set the final price.",
    }


# ---------- Speech ----------
@router.get("/api/speech/info")
def speech_info():
    return {
        "input": "Use native device speech-to-text (keyboard mic) and send the transcript as the catalogue `hint`.",
        "output_tts": "Mobile app reads instructions aloud via Expo Speech (en/hi/bn).",
        "supported_languages": ["en", "hi", "bn"],
    }
