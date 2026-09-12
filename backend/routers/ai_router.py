import os
import uuid
import logging
from urllib.parse import urlparse
from pathlib import Path
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Any, Union, List
from backend.config import UPLOAD_DIR
from backend.auth import get_current_user, require_seller
from backend.services.image_enhancer import enhance_artisan_product_image
from backend.services.ai_service import generate_product_catalog
from backend.services.pricing_engine import calculate_artisan_price
from backend.database import get_db

logger = logging.getLogger("kalasetu.ai_router")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/api/ai", tags=["AI Artisan Assistant"])

class RegenerateRequest(BaseModel):
    image_url: str
    language: Optional[str] = "en"
    hint: Optional[str] = None
    material_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    other_cost: Optional[float] = None

class PriceCalculationRequest(BaseModel):
    category_slug: Optional[str] = None
    category_name: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[Any] = None
    product_name: Optional[str] = None
    title: Optional[str] = None
    name: Optional[str] = None
    product_type: Optional[str] = None
    material: Optional[str] = None
    craftsmanship_level: Optional[str] = None
    craftsmanship: Optional[str] = None
    complexity_score: Optional[int] = None
    complexity: Optional[int] = None
    shape_and_scale: Optional[str] = None
    scale: Optional[str] = None
    labor_intensity: Optional[str] = "moderate"
    material_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    other_cost: Optional[float] = None
    user_hint: Optional[str] = None
    hint: Optional[str] = None

@router.post("/upload-and-enhance")
async def upload_and_enhance(
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),
    language: Optional[str] = Form("en"),
    hint: Optional[str] = Form(None),
    material_cost: Optional[float] = Form(None),
    labor_cost: Optional[float] = Form(None),
    other_cost: Optional[float] = Form(None),
    current_user: dict = Depends(require_seller)
):
    """
    Core AI workflow for artisans:
    1. Saves uploaded craft photos (1 to 5 photos) with unique request context.
    2. Runs Pillow image enhancement pipeline on each photo individually.
    3. Runs AI catalog generation using the primary product photo.
    4. Maps category to matching category ID in database.
    5. Returns both images for side-by-side comparison + generated product details for review.
    """
    req_id = uuid.uuid4().hex[:10]

    # Consolidate files from both `files` and `file` inputs
    uploaded_files: List[UploadFile] = []
    if files:
        uploaded_files.extend(files)
    if file:
        if not any(f.filename == file.filename for f in uploaded_files):
            uploaded_files.append(file)

    # Validate upload limits (1 to 3 photos)
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="Please upload at least 1 product photo.")

    # Enforce maximum 3 photos limit; prevent additional photos beyond 3
    if len(uploaded_files) > 3:
        logger.info(f"[{req_id}] User provided {len(uploaded_files)} photos; preventing additional photos beyond 3.")
        uploaded_files = uploaded_files[:3]

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    enhancement_results = []
    primary_saved_path = None
    primary_filename = None

    for idx, f in enumerate(uploaded_files):
        ext = Path(f.filename).suffix.lower()
        if ext not in allowed_extensions:
            ext = ".jpg"

        unique_filename = f"artisan_{req_id}_{idx}{ext}"
        saved_path = UPLOAD_DIR / unique_filename

        logger.info(f"[{req_id}] Processing photo {idx+1}/{len(uploaded_files)}: client_file='{f.filename}', size_hint='{f.size if hasattr(f, 'size') else 'unknown'}'")

        contents = await f.read()
        if len(contents) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Image file '{f.filename}' exceeds 20MB limit")

        with open(saved_path, "wb") as out_f:
            out_f.write(contents)

        if idx == 0:
            primary_saved_path = saved_path
            primary_filename = f.filename

        # 1. AI Image Enhancement for each individual photo
        try:
            enh_res = enhance_artisan_product_image(saved_path)
            enhancement_results.append(enh_res)
        except Exception as e:
            logger.error(f"[{req_id}] Error during image enhancement for photo {idx+1}: {e}")
            raise HTTPException(
                status_code=422,
                detail=f"Image enhancement could not be completed for photo {idx+1}. Please try another photo."
            )

    # Extract seller costs if provided
    seller_costs = None
    if material_cost is not None or labor_cost is not None or other_cost is not None:
        seller_costs = {
            "material_cost": material_cost or 0.0,
            "labor_cost": labor_cost or 0.0,
            "other_cost": other_cost or 0.0,
        }

    # 2. AI Product Information Generation (Two-Stage Pipeline using primary photo)
    try:
        ai_catalog = generate_product_catalog(
            image_path=str(primary_saved_path),
            user_language=language or current_user.get("language", "en"),
            hint=hint,
            client_filename=primary_filename,
            seller_costs=seller_costs
        )
    except Exception as e:
        logger.error(f"[{req_id}] Error during AI catalog generation: {e}")
        fallback_pricing = calculate_artisan_price(
            category_slug="pottery-ceramics",
            product_name="Handmade Artisan Craft",
            product_type="Artisan Craft",
            material="Natural Artisan Materials",
            craftsmanship_level="moderate",
            complexity_score=40,
            shape_and_scale="tabletop",
            labor_intensity="moderate",
            seller_costs=seller_costs,
            user_hint=hint
        )
        ai_catalog = {
            "name": "Handmade Artisan Craft",
            "title": "Authentic Traditional Handcrafted Product",
            "description": "Authentic handcrafted creation lovingly made by local artisans. Review and customize this title and description with details of your unique craft.",
            "category_slug": "pottery-ceramics",
            "category_name": "Pottery & Terracotta",
            "material": "Natural Artisan Materials",
            "craft_details": "Handcrafted by local master artisan.",
            "tags": ["Handmade", "Traditional", "ArtisanCraft"],
            "search_keywords": ["handmade craft", "artisan product"],
            "price_available": True,
            "suggested_min_price": fallback_pricing["suggested_min_price"],
            "suggested_max_price": fallback_pricing["suggested_max_price"],
            "price_confidence": fallback_pricing["price_confidence"],
            "price_source": fallback_pricing["price_source"],
            "complexity_score": 40,
            "craftsmanship_level": "moderate",
            "price_factors": fallback_pricing["price_factors"],
            "ai_rationale": fallback_pricing["ai_rationale"],
            "price_reason": fallback_pricing["price_reason"],
            "confidence": 0.80
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

    logger.info(f"[{req_id}] AI processing complete for {len(enhancement_results)} photo(s): product='{ai_catalog.get('name')}', cat='{ai_catalog.get('category_slug')}', price_avail={ai_catalog.get('price_available')}")

    return {
        "success": True,
        "image_enhancement": enhancement_results[0],
        "image_enhancements": enhancement_results,
        "ai_catalog": ai_catalog
    }

@router.post("/regenerate-text")
def regenerate_text(
    req: RegenerateRequest,
    current_user: dict = Depends(require_seller)
):
    """Regenerates title, description and pricing based on language switch or additional artisan hint."""
    parsed_path = urlparse(req.image_url).path
    img_name = Path(parsed_path).name
    img_path = UPLOAD_DIR / img_name

    # If user provided enhanced_ URL, prefer original if available
    if img_name.startswith("enhanced_"):
        orig_name = img_name[len("enhanced_"):]
        if (UPLOAD_DIR / orig_name).exists():
            img_path = UPLOAD_DIR / orig_name

    seller_costs = None
    if req.material_cost is not None or req.labor_cost is not None or req.other_cost is not None:
        seller_costs = {
            "material_cost": req.material_cost or 0.0,
            "labor_cost": req.labor_cost or 0.0,
            "other_cost": req.other_cost or 0.0,
        }

    try:
        ai_catalog = generate_product_catalog(
            image_path=str(img_path) if img_path.exists() else img_name,
            user_language=req.language or "en",
            hint=req.hint,
            client_filename=img_name,
            seller_costs=seller_costs
        )
    except Exception as e:
        logger.error(f"Error during regenerate_text: {e}")
        fallback_pricing = calculate_artisan_price(
            category_slug="pottery-ceramics",
            product_name="Handmade Artisan Craft",
            product_type="Artisan Craft",
            material="Natural Artisan Materials",
            craftsmanship_level="moderate",
            complexity_score=40,
            shape_and_scale="tabletop",
            labor_intensity="moderate",
            seller_costs=seller_costs,
            user_hint=req.hint
        )
        ai_catalog = {
            "name": "Handmade Artisan Craft",
            "title": "Authentic Traditional Handcrafted Product",
            "description": "Authentic handcrafted creation lovingly made by local artisans. Review and customize this title and description with details of your unique craft.",
            "category_slug": "pottery-ceramics",
            "category_name": "Pottery & Terracotta",
            "material": "Natural Artisan Materials",
            "craft_details": "Handcrafted by local master artisan.",
            "tags": ["Handmade", "Traditional", "ArtisanCraft"],
            "search_keywords": ["handmade craft", "artisan product"],
            "price_available": True,
            "suggested_min_price": fallback_pricing["suggested_min_price"],
            "suggested_max_price": fallback_pricing["suggested_max_price"],
            "price_confidence": fallback_pricing["price_confidence"],
            "price_source": fallback_pricing["price_source"],
            "complexity_score": 40,
            "craftsmanship_level": "moderate",
            "price_factors": fallback_pricing["price_factors"],
            "ai_rationale": fallback_pricing["ai_rationale"],
            "price_reason": fallback_pricing["price_reason"],
            "confidence": 0.80
        }

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


@router.post("/calculate-price")
def calculate_price_endpoint(
    req: PriceCalculationRequest,
    current_user: dict = Depends(require_seller)
):
    """
    Computes an instant, product-specific recommended price range based on visual craft
    attributes and/or artisan-provided seller costs.
    """
    seller_costs = None
    if req.material_cost is not None or req.labor_cost is not None or req.other_cost is not None:
        seller_costs = {
            "material_cost": req.material_cost or 0.0,
            "labor_cost": req.labor_cost or 0.0,
            "other_cost": req.other_cost or 0.0,
        }

    resolved_name = req.product_name or req.title or req.name or ""
    resolved_scale = req.shape_and_scale or req.scale or "tabletop"
    resolved_craftsmanship = req.craftsmanship_level or req.craftsmanship or "detailed"
    resolved_complexity = req.complexity_score or req.complexity or 50
    resolved_hint = req.user_hint or req.hint or ""

    resolved_cat = req.category_slug
    if not resolved_cat or resolved_cat == "other":
        if req.category_name:
            cn = req.category_name.lower()
            if "wood" in cn or "furniture" in cn or "toy" in cn:
                resolved_cat = "woodcraft"
            elif "pot" in cn or "clay" in cn or "terracotta" in cn or "ceramic" in cn:
                resolved_cat = "pottery-ceramics"
            elif "textile" in cn or "handloom" in cn or "saree" in cn:
                resolved_cat = "handloom-textiles"
            elif "metal" in cn or "brass" in cn or "dhokra" in cn:
                resolved_cat = "metal-brass"
            elif "paint" in cn or "folk" in cn:
                resolved_cat = "folk-art"
            elif "jewel" in cn:
                resolved_cat = "jewelry"
            elif "bamboo" in cn or "cane" in cn:
                resolved_cat = "bamboo-cane"

    if not resolved_cat or resolved_cat == "other":
        cat_id = req.category_id or (req.category if isinstance(req.category, int) else None)
        if cat_id:
            try:
                conn = get_db()
                c = conn.cursor()
                c.execute("SELECT slug FROM categories WHERE id = ?", (cat_id,))
                row = c.fetchone()
                if row and row["slug"]:
                    resolved_cat = row["slug"]
                conn.close()
            except Exception:
                pass

    res = calculate_artisan_price(
        category_slug=resolved_cat or "other",
        product_name=resolved_name,
        product_type=req.product_type,
        material=req.material,
        craftsmanship_level=resolved_craftsmanship,
        complexity_score=resolved_complexity,
        shape_and_scale=resolved_scale,
        labor_intensity=req.labor_intensity or "moderate",
        seller_costs=seller_costs,
        user_hint=resolved_hint,
    )
    return res
