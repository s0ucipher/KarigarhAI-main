"""
KalaSetu AI — Local Intelligent Pricing Engine (Stage 2 Fallback & Cost Engine)
==============================================================================

Provides a deterministic, explainable, multi-factor pricing system for handcrafted
Indian artisan products.

Priority Architecture:
1. Seller Cost Priority:
   If artisan provides material_cost, labor_cost, and/or other_cost:
   Base Cost = Total Cost.
   Apply a fair artisan margin (30% to 75% depending on craft & complexity).
   Returns cost-plus recommendation.

2. Product-Specific Visual Attribute Pricing:
   Base Category Baseline
   × Material Factor
   × Craftsmanship Factor
   × Complexity Factor (0-100 score)
   × Size / Scale Factor
   × Functionality Factor
   × Finishing Factor
   × Uniqueness Factor

3. Category Sanity Floor and Ceiling Bounds:
   Guarantees that a chair is never priced as a terracotta saucer,
   and a simple clay pot never receives luxury furniture pricing.

4. Deterministic & Explainable:
   Zero randomness. Produces structured price_factors and clear ai_rationale.
"""

import math
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("kalasetu.pricing_engine")
logger.setLevel(logging.INFO)

# =============================================================================
# 1. CATEGORY BASELINES & BOUNDS
# =============================================================================

CATEGORY_BASELINES: Dict[str, Dict[str, Any]] = {
    "woodcraft": {
        "default": {"min": 750, "max": 1650, "floor": 300, "ceiling": 3500},
        "furniture": {"min": 2800, "max": 5200, "floor": 2200, "ceiling": 6500},
        "chair": {"min": 2800, "max": 5200, "floor": 2200, "ceiling": 6500},
        "table": {"min": 3200, "max": 6500, "floor": 2500, "ceiling": 12000},
        "bench": {"min": 2600, "max": 4800, "floor": 2000, "ceiling": 7500},
        "stool": {"min": 1200, "max": 2400, "floor": 850, "ceiling": 4500},
        "decor": {"min": 750, "max": 1650, "floor": 400, "ceiling": 3200},
        "carving": {"min": 850, "max": 1950, "floor": 500, "ceiling": 4000},
        "toy": {"min": 450, "max": 850, "floor": 250, "ceiling": 1800},
    },
    "pottery-ceramics": {
        "default": {"min": 450, "max": 950, "floor": 120, "ceiling": 3200},
        "diya": {"min": 150, "max": 350, "floor": 100, "ceiling": 800},
        "saucer": {"min": 150, "max": 350, "floor": 100, "ceiling": 800},
        "pot": {"min": 350, "max": 750, "floor": 150, "ceiling": 1800},
        "matka": {"min": 350, "max": 750, "floor": 180, "ceiling": 1800},
        "vase": {"min": 550, "max": 1150, "floor": 280, "ceiling": 2800},
        "urn": {"min": 650, "max": 1350, "floor": 350, "ceiling": 3200},
        "planter": {"min": 450, "max": 950, "floor": 220, "ceiling": 2200},
        "sculpture": {"min": 850, "max": 1850, "floor": 450, "ceiling": 4000},
    },
    "handloom-textiles": {
        "default": {"min": 850, "max": 1850, "floor": 450, "ceiling": 9500},
        "cotton_stole": {"min": 650, "max": 1350, "floor": 400, "ceiling": 2400},
        "cotton_saree": {"min": 1100, "max": 2400, "floor": 750, "ceiling": 4500},
        "silk_saree": {"min": 2500, "max": 5600, "floor": 1800, "ceiling": 14000},
        "silk_stole": {"min": 1600, "max": 3200, "floor": 1100, "ceiling": 6000},
        "shawl": {"min": 1400, "max": 3100, "floor": 950, "ceiling": 6500},
        "dupatta": {"min": 750, "max": 1650, "floor": 450, "ceiling": 3200},
        "kantha": {"min": 1800, "max": 3800, "floor": 1200, "ceiling": 8500},
        "fabric": {"min": 550, "max": 1200, "floor": 350, "ceiling": 2500},
    },
    "metal-brass": {
        "default": {"min": 1200, "max": 2900, "floor": 700, "ceiling": 8500},
        "figurine": {"min": 1100, "max": 2400, "floor": 650, "ceiling": 5500},
        "statue": {"min": 1400, "max": 3400, "floor": 900, "ceiling": 9000},
        "dhokra": {"min": 1250, "max": 2950, "floor": 750, "ceiling": 7500},
        "bell_metal": {"min": 1150, "max": 2700, "floor": 700, "ceiling": 6500},
        "vessel": {"min": 950, "max": 2200, "floor": 600, "ceiling": 5000},
        "lamp": {"min": 1050, "max": 2500, "floor": 650, "ceiling": 6000},
    },
    "folk-art": {
        "default": {"min": 850, "max": 2200, "floor": 550, "ceiling": 7500},
        "painting": {"min": 900, "max": 2300, "floor": 600, "ceiling": 7500},
        "madhubani": {"min": 950, "max": 2400, "floor": 650, "ceiling": 7500},
        "warli": {"min": 800, "max": 1950, "floor": 500, "ceiling": 6000},
        "pattachitra": {"min": 1200, "max": 3200, "floor": 800, "ceiling": 9000},
        "scroll": {"min": 1100, "max": 2800, "floor": 750, "ceiling": 8000},
    },
    "jewelry": {
        "default": {"min": 400, "max": 950, "floor": 220, "ceiling": 3800},
        "necklace": {"min": 450, "max": 1150, "floor": 280, "ceiling": 4000},
        "earring": {"min": 300, "max": 650, "floor": 180, "ceiling": 2200},
        "bangle": {"min": 350, "max": 750, "floor": 200, "ceiling": 2500},
        "pendant": {"min": 350, "max": 800, "floor": 200, "ceiling": 2500},
        "filigree": {"min": 750, "max": 1800, "floor": 450, "ceiling": 5000},
    },
    "bamboo-cane": {
        "default": {"min": 350, "max": 850, "floor": 200, "ceiling": 3200},
        "basket": {"min": 350, "max": 800, "floor": 200, "ceiling": 2400},
        "lampshade": {"min": 550, "max": 1250, "floor": 350, "ceiling": 3000},
        "mat": {"min": 400, "max": 900, "floor": 220, "ceiling": 2500},
        "cane_furniture": {"min": 1600, "max": 3800, "floor": 1100, "ceiling": 8500},
    },
    "other": {
        "default": {"min": 500, "max": 1150, "floor": 250, "ceiling": 4500},
    }
}

# =============================================================================
# 2. MULTI-FACTOR WEIGHTS
# =============================================================================

# Material multipliers
MATERIAL_WEIGHTS: Dict[str, float] = {
    # Timber / Wood
    "solid hardwood": 1.35,
    "teak": 1.40,
    "sheesham": 1.35,
    "rosewood": 1.45,
    "seasoned hardwood": 1.35,
    "ivory wood": 1.15,
    "softwood": 1.05,
    "natural wood": 1.20,
    "wood": 1.20,
    
    # Earth / Ceramic
    "alluvial river clay": 1.0,
    "river clay": 1.0,
    "terracotta": 1.05,
    "clay": 1.0,
    "glazed ceramic": 1.20,
    "earthenware": 1.0,
    
    # Textile Fibers
    "mulberry silk": 1.45,
    "pure silk": 1.45,
    "tussar silk": 1.40,
    "cotton": 1.10,
    "handloom cotton": 1.15,
    "khadi": 1.10,
    "wool": 1.25,
    
    # Metal
    "brass": 1.38,
    "brass alloy": 1.38,
    "bell metal": 1.42,
    "bronze": 1.42,
    "copper": 1.35,
    "silver filigree": 1.65,
    
    # Plant / Fiber / Paper
    "bamboo": 1.05,
    "cane": 1.12,
    "jute": 1.05,
    "handmade paper": 1.15,
    "rice paper": 1.15,
    "canvas": 1.20,
    
    # Default
    "natural craft material": 1.0,
    "unverified": 1.0,
}

# Scale multipliers
SCALE_WEIGHTS: Dict[str, float] = {
    "miniature": 0.85,
    "handheld": 0.90,
    "tabletop": 1.00,
    "small": 0.92,
    "medium": 1.15,
    "large": 1.45,
    "full-scale": 1.50,
    "full-scale furniture": 1.55,
    "architectural": 1.75,
}

# Craftsmanship multipliers
CRAFTSMANSHIP_WEIGHTS: Dict[str, float] = {
    "basic": 0.88,
    "moderate": 1.00,
    "detailed": 1.20,
    "highly detailed": 1.38,
    "exceptional": 1.55,
    "masterpiece": 1.70,
}

# Labor intensity multipliers
LABOR_WEIGHTS: Dict[str, float] = {
    "low": 0.92,
    "moderate": 1.00,
    "high": 1.22,
    "very high": 1.40,
}


def round_inr_price(val: float) -> int:
    """Rounds values cleanly to standard Indian marketplace denominations."""
    n = int(round(val))
    if n < 300:
        # Nearest ₹10
        return max(50, round(n / 10.0) * 10)
    elif n < 1000:
        # Nearest ₹50
        return round(n / 50.0) * 50
    elif n < 5000:
        # Nearest ₹100 (or ₹50)
        return round(n / 50.0) * 50
    else:
        # Nearest ₹100
        return round(n / 100.0) * 100


def match_material_weight(material_str: Optional[str]) -> tuple[float, str]:
    """Matches observable material string to a calibrated material multiplier."""
    if not material_str:
        return 1.0, "Natural craft material"
    
    mat_lower = material_str.lower()
    for key, weight in MATERIAL_WEIGHTS.items():
        if key in mat_lower:
            return weight, key.title()
            
    # Generic detections
    if "silk" in mat_lower:
        return 1.40, "Silk"
    if "brass" in mat_lower or "metal" in mat_lower:
        return 1.35, "Metal Alloy"
    if "wood" in mat_lower or "timber" in mat_lower or "teak" in mat_lower:
        return 1.30, "Wood"
    if "clay" in mat_lower or "terracotta" in mat_lower:
        return 1.05, "Terracotta / Clay"
    if "cotton" in mat_lower:
        return 1.12, "Cotton"
    if "bamboo" in mat_lower or "cane" in mat_lower:
        return 1.08, "Bamboo / Cane"
    if "paper" in mat_lower or "canvas" in mat_lower:
        return 1.15, "Paper / Canvas"
        
    return 1.0, "Natural craft material"


import re

FURNITURE_RE = re.compile(r"\b(chair|chairs|armchair|armchairs|dining\s*table|coffee\s*table|wooden\s*table|tables|stool|stools|bench|benches|desk|desks|furniture)\b", re.IGNORECASE)

def match_subtype_baseline(category_slug: str, product_text: str) -> Dict[str, int]:
    """Selects the most specific baseline range for a product subtype within a category."""
    cat_data = CATEGORY_BASELINES.get(category_slug, CATEGORY_BASELINES["other"])
    txt_lower = (product_text or "").lower()
    
    # Priority matching within category using word boundaries
    for subtype_key, baseline in cat_data.items():
        if subtype_key == "default":
            continue
        if re.search(rf"\b{re.escape(subtype_key)}\b", txt_lower):
            return baseline
            
    # Specific cross-category heuristics with exact word boundaries
    if re.search(r"\b(chair|chairs|armchair|armchairs)\b", txt_lower):
        return CATEGORY_BASELINES["woodcraft"]["chair"]
    if re.search(r"\b(table|tables|desk|desks)\b", txt_lower) and not re.search(r"\btabletop\b", txt_lower):
        return CATEGORY_BASELINES["woodcraft"]["table"]
    if re.search(r"\b(bench|benches)\b", txt_lower):
        return CATEGORY_BASELINES["woodcraft"]["bench"]
    if re.search(r"\b(diya|diyas)\b", txt_lower):
        return CATEGORY_BASELINES["pottery-ceramics"]["diya"]
    if re.search(r"\b(saree|sari)\b", txt_lower) and re.search(r"\b(silk|tussar|mulberry)\b", txt_lower):
        return CATEGORY_BASELINES["handloom-textiles"]["silk_saree"]
    if re.search(r"\b(saree|sari)\b", txt_lower):
        return CATEGORY_BASELINES["handloom-textiles"]["cotton_saree"]
    if re.search(r"\b(madhubani|mithila)\b", txt_lower):
        return CATEGORY_BASELINES["folk-art"]["madhubani"]
    if re.search(r"\b(dhokra|dokra)\b", txt_lower):
        return CATEGORY_BASELINES["metal-brass"]["dhokra"]
    if re.search(r"\b(necklace|necklaces|choker|pendant)\b", txt_lower):
        return CATEGORY_BASELINES["jewelry"]["necklace"]
    if re.search(r"\b(basket|baskets)\b", txt_lower):
        return CATEGORY_BASELINES["bamboo-cane"]["basket"]

    return cat_data.get("default", CATEGORY_BASELINES["other"]["default"])


def calculate_artisan_price(
    category_slug: Optional[str] = "other",
    product_name: Optional[str] = None,
    product_type: Optional[str] = None,
    material: Optional[str] = None,
    craftsmanship_level: Optional[str] = "moderate",
    complexity_score: Optional[int] = 50,
    shape_and_scale: Optional[str] = "tabletop",
    labor_intensity: Optional[str] = "moderate",
    finishing_quality: Optional[str] = "natural",
    is_functional: Optional[bool] = None,
    uniqueness: Optional[str] = "standard",
    seller_costs: Optional[Dict[str, Any]] = None,
    user_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Core intelligent calculation engine:
    1. Evaluates seller costs first if provided.
    2. Otherwise applies multi-factor product-specific valuation model.
    3. Enforces category bounds and deterministic rounding.
    4. Generates truthful price_factors, reason, and confidence.
    """
    category_slug = category_slug or "other"
    combined_text = f"{product_name or ''} {product_type or ''} {user_hint or ''}".strip().lower()

    # Detect furniture scale and cross-category craft domains from product text
    if FURNITURE_RE.search(combined_text):
        if not shape_and_scale or "tabletop" in shape_and_scale.lower():
            shape_and_scale = "full-scale furniture"
        if category_slug in ("pottery-ceramics", "other"):
            category_slug = "woodcraft"
    elif re.search(r"\b(saree|sari|shawl|dupatta|stole|handloom|weaving|textile)\b", combined_text):
        if category_slug in ("pottery-ceramics", "other"):
            category_slug = "handloom-textiles"
    elif re.search(r"\b(dhokra|brass|bronze|bell\s*metal|metal\s*craft)\b", combined_text):
        if category_slug in ("pottery-ceramics", "other"):
            category_slug = "metal-brass"
    elif re.search(r"\b(painting|madhubani|warli|pattachitra|canvas|canvas\s*art)\b", combined_text):
        if category_slug in ("pottery-ceramics", "other"):
            category_slug = "folk-art"
    elif re.search(r"\b(jewelry|jewellery|earring|necklace|bangle|pendant|filigree|jhumka)\b", combined_text):
        if category_slug in ("pottery-ceramics", "other"):
            category_slug = "jewelry"
    elif re.search(r"\b(bamboo|cane|basket|wicker|jute)\b", combined_text):
        if category_slug in ("pottery-ceramics", "other"):
            category_slug = "bamboo-cane"
    elif re.search(r"\b(pot|pots|matka|vase|earthen|diya|terracotta|clay|planter)\b", combined_text):
        if category_slug in ("other",):
            category_slug = "pottery-ceramics"

    # =========================================================================
    # STAGE A: SELLER COST PRIORITY
    # =========================================================================
    if seller_costs:
        try:
            mat_cost = float(seller_costs.get("material_cost") or 0.0)
            lab_cost = float(seller_costs.get("labor_cost") or 0.0)
            oth_cost = float(seller_costs.get("other_cost") or 0.0)
            base_total_cost = mat_cost + lab_cost + oth_cost

            if base_total_cost > 0:
                # Margin tailored to craft level
                craft_lvl = (craftsmanship_level or "moderate").lower()
                if "exceptional" in craft_lvl or "highly" in craft_lvl:
                    min_margin, max_margin = 0.50, 0.90
                elif "detailed" in craft_lvl:
                    min_margin, max_margin = 0.40, 0.70
                else:
                    min_margin, max_margin = 0.30, 0.55

                min_price = round_inr_price(base_total_cost * (1.0 + min_margin))
                max_price = round_inr_price(base_total_cost * (1.0 + max_margin))
                max_price = max(max_price, int(round(min_price * 1.20)))

                cost_components = []
                if mat_cost > 0:
                    cost_components.append(f"Material: ₹{int(mat_cost)}")
                if lab_cost > 0:
                    cost_components.append(f"Labor: ₹{int(lab_cost)}")
                if oth_cost > 0:
                    cost_components.append(f"Overhead: ₹{int(oth_cost)}")

                factors = [
                    f"Direct artisan base cost: ₹{int(base_total_cost)}",
                    f"Craftsman margin: {int(min_margin*100)}% – {int(max_margin*100)}%",
                    f"Workmanship tier: {craft_lvl.title()}"
                ]

                reason = (
                    f"Calculated directly from artisan-provided costs ({', '.join(cost_components)}) "
                    f"with a fair {int(min_margin*100)}%–{int(max_margin*100)}% artisan margin."
                )

                return {
                    "price_available": True,
                    "suggested_min_price": min_price,
                    "suggested_max_price": max_price,
                    "price_confidence": 0.95,
                    "price_source": "seller_costs",
                    "price_factors": factors,
                    "price_reason": reason,
                    "ai_rationale": reason,
                }
        except Exception as e:
            logger.warning(f"Error parsing seller costs: {e}. Proceeding to visual model.")

    # =========================================================================
    # STAGE B: PRODUCT-SPECIFIC VISUAL & ATTRIBUTE VALUATION MODEL
    # =========================================================================
    baseline = match_subtype_baseline(category_slug, combined_text)
    base_min = baseline["min"]
    base_max = baseline["max"]
    floor_bound = baseline["floor"]
    ceiling_bound = baseline["ceiling"]

    factors_collected: List[str] = []

    # 1. Material Factor
    mat_weight, mat_label = match_material_weight(material)
    factors_collected.append(f"{mat_label} construction")

    # 2. Craftsmanship Factor
    c_lvl = (craftsmanship_level or "moderate").lower()
    c_weight = CRAFTSMANSHIP_WEIGHTS.get(c_lvl, 1.0)
    factors_collected.append(f"{c_lvl.title()} hand craftsmanship")

    # 3. Complexity Score Factor (0 to 100)
    score = 50
    try:
        score = int(complexity_score if complexity_score is not None else 50)
        score = max(0, min(100, score))
    except Exception:
        score = 50

    if score <= 25:
        comp_weight = 0.90
    elif score <= 45:
        comp_weight = 0.96
    elif score <= 65:
        comp_weight = 1.08
    elif score <= 80:
        comp_weight = 1.20
    else:
        comp_weight = 1.35
    factors_collected.append(f"Visual complexity score ({score}/100)")

    # 4. Scale / Dimension Factor
    s_key = (shape_and_scale or "tabletop").lower()
    scale_weight = 1.0
    for skey, sw in SCALE_WEIGHTS.items():
        if skey in s_key:
            scale_weight = sw
            break
    if scale_weight > 1.2:
        factors_collected.append("Full-scale structural dimensions")
    elif scale_weight < 0.95:
        factors_collected.append("Handheld / compact craft scale")

    # 5. Labor Intensity Factor
    l_key = (labor_intensity or "moderate").lower()
    labor_weight = LABOR_WEIGHTS.get(l_key, 1.0)
    if labor_weight > 1.15:
        factors_collected.append("Substantial manual crafting labor")

    # 6. Functionality Factor
    # Functional seating / furniture / storage has higher load requirements
    func_weight = 1.0
    if is_functional is True or re.search(r"\b(chair|chairs|armchair|stool|stools|bench|benches|dining table|desk|saree|sari|shawl|basket|vessel)\b", combined_text):
        func_weight = 1.12

    # Cumulative Multiplier
    total_multiplier = (
        mat_weight
        * c_weight
        * comp_weight
        * scale_weight
        * labor_weight
        * func_weight
    )

    # Base multiplier is normalized relative to standard baseline of 1.0
    # Apply slightly dampening root to prevent runaway compounding
    damped_multiplier = math.pow(total_multiplier, 0.75)

    calc_min = base_min * damped_multiplier
    calc_max = base_max * damped_multiplier

    # Apply hard category boundaries
    clamped_min = max(floor_bound, min(ceiling_bound * 0.85, calc_min))
    clamped_max = max(clamped_min * 1.18, min(ceiling_bound, calc_max))

    final_min = round_inr_price(clamped_min)
    final_max = round_inr_price(clamped_max)

    # Ensure minimum spread of at least 15%
    if final_max <= final_min:
        final_max = round_inr_price(final_min * 1.25)

    # Calculate confidence based on data completeness
    confidence = 0.85
    if material and "unverified" not in material.lower():
        confidence += 0.04
    if score > 60 or c_lvl in ("detailed", "highly detailed"):
        confidence += 0.03
    if scale_weight != 1.0:
        confidence += 0.02
    confidence = min(0.94, confidence)

    # Human-readable rationale
    reason = (
        f"AI-assisted estimated price range based on {mat_label.lower()}, "
        f"{c_lvl} craftsmanship, complexity rating of {score}/100, and observable artisan labor."
    )

    return {
        "price_available": True,
        "suggested_min_price": final_min,
        "suggested_max_price": final_max,
        "price_confidence": round(confidence, 2),
        "price_source": "local_fallback",
        "price_factors": factors_collected[:4],
        "price_reason": reason,
        "ai_rationale": reason,
    }
