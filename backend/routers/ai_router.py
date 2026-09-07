import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from backend.config import UPLOAD_DIR
from backend.auth import get_current_user, require_seller
from backend.services.image_enhancer import enhance_artisan_product_image
from backend.services.ai_service import generate_product_catalog
from backend.database import get_db

router = APIRouter(prefix="/api/ai", tags=["AI Artisan Assistant"])

class RegenerateRequest(BaseModel):
    image_url: str
    language: Optional[str] = "en"
    hint: Optional[str] = None

@router.post("/upload-and-enhance")
async def upload_and_enhance(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en"),
    hint: Optional[str] = Form(None),
    current_user: dict = Depends(require_seller)
):
    """
    Core AI workflow for artisans:
    1. Saves uploaded craft photo.
    2. Runs Pillow image enhancement pipeline (lighting, contrast, sharpening, studio gradient).
    3. Runs AI catalog generation (Gemini Vision or Artisan Knowledge Engine).
    4. Maps category to matching category ID in database.
    5. Returns both images for side-by-side comparison + generated product details for review.
    """
    # Validate extension
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        ext = ".jpg"

    unique_filename = f"artisan_{uuid.uuid4().hex[:10]}{ext}"
    saved_path = UPLOAD_DIR / unique_filename

    # Save raw image
    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file exceeds 20MB limit")

    with open(saved_path, "wb") as f:
        f.write(contents)

    # 1. AI Image Enhancement
    try:
        enhancement_result = enhance_artisan_product_image(saved_path)
    except Exception as e:
        print(f"Error during image enhancement: {e}")
        # Fallback to original image if Pillow fails
        enhancement_result = {
            "original_url": f"/uploads/{unique_filename}",
            "enhanced_url": f"/uploads/{unique_filename}",
            "metrics": {
                "lighting_improvement": "Standard",
                "sharpness_gain": "Original",
                "color_vibrance": "Natural",
                "studio_grade": "Uploaded"
            }
        }

    # 2. AI Product Information Generation
    try:
        ai_catalog = generate_product_catalog(
            image_path=str(saved_path),
            user_language=language or current_user.get("language", "en"),
            hint=hint
        )
    except Exception as e:
        print(f"Error during AI catalog generation: {e}")
        ai_catalog = {
            "name": "Handmade Artisan Craft",
            "title": "Authentic Traditional Handcrafted Product",
            "description": "Lovingly made by local craftsmen using traditional techniques.",
            "category_slug": "pottery-ceramics",
            "category_name": "Pottery & Terracotta",
            "material": "Natural Artisan Materials",
            "craft_details": "Handcrafted by local master artisan.",
            "tags": ["Handmade", "Traditional", "Artisan"],
            "search_keywords": ["handmade craft", "traditional art"],
            "suggested_min_price": 500,
            "suggested_max_price": 800,
            "ai_rationale": "Fair artisan craft pricing."
        }

    # Map category_slug to category_id
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name_en, name_hi, name_bn FROM categories WHERE slug = ?", (ai_catalog.get("category_slug", "pottery-ceramics"),))
    cat_row = cursor.fetchone()
    if cat_row:
        ai_catalog["category_id"] = cat_row["id"]
        ai_catalog["category_names"] = {
            "en": cat_row["name_en"],
            "hi": cat_row["name_hi"],
            "bn": cat_row["name_bn"]
        }
    else:
        ai_catalog["category_id"] = 1
    conn.close()

    return {
        "success": True,
        "image_enhancement": enhancement_result,
        "ai_catalog": ai_catalog
    }

@router.post("/regenerate-text")
def regenerate_text(
    req: RegenerateRequest,
    current_user: dict = Depends(require_seller)
):
    """Regenerates title, description and pricing based on language switch or additional artisan hint."""
    img_name = Path(req.image_url).name
    img_path = UPLOAD_DIR / img_name

    ai_catalog = generate_product_catalog(
        image_path=str(img_path) if img_path.exists() else img_name,
        user_language=req.language or "en",
        hint=req.hint
    )

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name_en, name_hi, name_bn FROM categories WHERE slug = ?", (ai_catalog.get("category_slug", "pottery-ceramics"),))
    cat_row = cursor.fetchone()
    if cat_row:
        ai_catalog["category_id"] = cat_row["id"]
        ai_catalog["category_names"] = {
            "en": cat_row["name_en"],
            "hi": cat_row["name_hi"],
            "bn": cat_row["name_bn"]
        }
    else:
        ai_catalog["category_id"] = 1
    conn.close()

    return {"ai_catalog": ai_catalog}
