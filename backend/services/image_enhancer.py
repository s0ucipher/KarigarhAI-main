import os
import time
import math
import uuid
import logging
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageFilter, ImageStat
from backend.config import UPLOAD_DIR

logger = logging.getLogger("kalasetu.image_enhancer")
logger.setLevel(logging.INFO)


def analyze_image(img: Image.Image) -> dict:
    """
    Measures quantitative photometric characteristics of an image:
    - mean_luminance (0-255)
    - contrast_stddev (standard deviation of luminance)
    - shadow_clipping (ratio of pixels <= 11)
    - highlight_clipping (ratio of pixels >= 246)
    - sharpness_score (edge variance via high-pass filter)
    - mean_saturation (0.0 - 1.0 in HSV space)
    """
    total_pixels = max(1, img.width * img.height)
    
    # Luminance channel
    gray = img.convert("L")
    hist = gray.histogram()
    mean_lum = sum(i * count for i, count in enumerate(hist)) / total_pixels
    variance = sum(((i - mean_lum) ** 2) * count for i, count in enumerate(hist)) / total_pixels
    std_lum = math.sqrt(variance)
    
    shadow_ratio = sum(hist[:12]) / total_pixels
    highlight_ratio = sum(hist[246:]) / total_pixels
    
    # Sharpness via Laplacian/Edges
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges)
    sharpness = edge_stat.var[0] if edge_stat.var else 0.0
    
    # Saturation via HSV
    hsv = img.convert("HSV")
    s_hist = hsv.split()[1].histogram()
    mean_sat = sum(i * count for i, count in enumerate(s_hist)) / (total_pixels * 255.0)
    
    return {
        "mean_luminance": mean_lum,
        "contrast_stddev": std_lum,
        "shadow_clipping": shadow_ratio,
        "highlight_clipping": highlight_ratio,
        "sharpness_score": sharpness,
        "mean_saturation": mean_sat,
    }


def select_enhancement_parameters(stats: dict) -> dict:
    """
    Chooses controlled, data-driven enhancement parameters bounded to prevent:
    - Overexposure or white blowout
    - Excessive contrast or shadow clipping
    - Unnatural saturation / neon color shifts
    - Harsh edge halos or oversharpened noise
    """
    lum = stats["mean_luminance"]
    hi = stats["highlight_clipping"]
    contrast_std = stats["contrast_stddev"]
    sat = stats["mean_saturation"]
    sharp = stats["sharpness_score"]
    
    # 1. Exposure / Gamma Curve (Lifts shadows & midtones while preserving 255 highlights)
    if lum < 75:
        # Dark workshop photo -> mild gamma lift
        gamma = 1.0 + min(0.18, (80 - lum) / 300)
    elif lum < 110:
        # Slightly dim photo -> subtle gamma lift
        gamma = 1.0 + min(0.08, (110 - lum) / 500)
    elif lum > 175 or hi > 0.02:
        # Bright photo or high highlights -> DO NOT increase exposure
        gamma = 1.0
    else:
        gamma = 1.02
    gamma = max(0.98, min(1.20, gamma))
    
    # 2. Contrast Tuning
    if lum > 210:
        # High-key bright photo: strictly preserve contrast to avoid blowout
        contrast = 1.0
    elif contrast_std < 25:
        contrast = 1.05
    elif contrast_std < 40:
        contrast = 1.03
    elif contrast_std > 65:
        contrast = 1.0  # Already strong contrast
    else:
        contrast = 1.02
    contrast = max(0.98, min(1.08, contrast))
    
    # 3. Saturation / Color Vibrance (Preserve authenticity of clays, silks, wood, brass)
    if sat < 0.12:
        color = 1.05
    elif sat < 0.22:
        color = 1.02
    else:
        color = 1.0  # Already vibrant craft
    color = max(1.0, min(1.08, color))
    
    # 4. Controlled Dual-Frequency Clarity & Sharpness Definition
    if sharp > 650:
        # Already sharp craft details (fine paintings, carved wood)
        clarity = {"radius": 1.8, "percent": 20, "threshold": 2}
        sharpness = {"radius": 0.8, "percent": 25, "threshold": 3}
    elif sharp >= 300:
        # Normal sharpness
        clarity = {"radius": 2.2, "percent": 28, "threshold": 2}
        sharpness = {"radius": 0.9, "percent": 35, "threshold": 3}
    else:
        # Slightly soft photo
        clarity = {"radius": 2.5, "percent": 35, "threshold": 2}
        sharpness = {"radius": 1.0, "percent": 45, "threshold": 3}
        
    return {
        "gamma": gamma,
        "contrast": contrast,
        "color": color,
        "clarity": clarity,
        "sharpness": sharpness
    }


def apply_enhancement(img: Image.Image, params: dict) -> Image.Image:
    """Applies the photographic correction stages to a working image copy."""
    res = img.copy()
    
    # 1. Gamma exposure correction via LUT (zero highlight clipping mathematically guaranteed)
    if abs(params.get("gamma", 1.0) - 1.0) > 0.005:
        inv_gamma = 1.0 / params["gamma"]
        lut = [int(round(((i / 255.0) ** inv_gamma) * 255.0)) for i in range(256)]
        res = res.point(lut * 3)
        
    # 2. Gentle contrast
    if abs(params.get("contrast", 1.0) - 1.0) > 0.005:
        res = ImageEnhance.Contrast(res).enhance(params["contrast"])
        
    # 3. Controlled color
    if abs(params.get("color", 1.0) - 1.0) > 0.005:
        res = ImageEnhance.Color(res).enhance(params["color"])
        
    # 4. Local texture clarity (medium radius unsharp mask for physical craft depth)
    cl = params.get("clarity", {})
    if cl.get("percent", 0) > 0:
        res = res.filter(
            ImageFilter.UnsharpMask(
                radius=cl.get("radius", 2.2),
                percent=cl.get("percent", 28),
                threshold=cl.get("threshold", 2)
            )
        )

    # 5. Fine edge definition (fine radius unsharp mask for carvings, weaves, paintwork)
    sh = params.get("sharpness", {})
    if sh.get("percent", 0) > 0:
        res = res.filter(
            ImageFilter.UnsharpMask(
                radius=sh.get("radius", 0.9),
                percent=sh.get("percent", 35),
                threshold=sh.get("threshold", 3)
            )
        )
        
    return res


def validate_enhancement(orig_stats: dict, cand_stats: dict) -> tuple[bool, str]:
    """
    Rigorous quality gate to prevent degraded outputs:
    - Never allow white blowout (highlight clipping jump)
    - Never allow blurry output (sharpness drop)
    - Never allow extreme luminance explosion
    """
    cand_hi = cand_stats["highlight_clipping"]
    orig_hi = orig_stats["highlight_clipping"]
    
    # 1. White blowout / overexposure check
    if cand_hi - orig_hi > 0.035:
        return False, f"Highlight blowout: clipping increased from {orig_hi*100:.1f}% to {cand_hi*100:.1f}%"
        
    if cand_hi > 0.15 and orig_hi < 0.05:
        return False, f"Abnormal amount of near-white pixels: {cand_hi*100:.1f}%"
        
    if cand_stats["mean_luminance"] > 238 and (cand_stats["mean_luminance"] - orig_stats["mean_luminance"] > 12):
        return False, f"Overexposure detected: mean luminance reached {cand_stats['mean_luminance']:.1f}"
        
    # 2. Blurry output check
    if cand_stats["sharpness_score"] < orig_stats["sharpness_score"] * 0.94:
        return False, f"Sharpness degraded: from {orig_stats['sharpness_score']:.1f} to {cand_stats['sharpness_score']:.1f}"
        
    return True, "Quality validation passed"


def compute_truthful_metrics(orig_stats: dict, enh_stats: dict, status: str) -> dict:
    """
    Computes truthful photographic quality descriptions directly from before/after image statistics.
    Strictly removes all fabricated percentage numbers (+X%) and uses honest factual descriptors.
    """
    lum_diff = enh_stats["mean_luminance"] - orig_stats["mean_luminance"]
    sharp_orig = max(1.0, orig_stats["sharpness_score"])
    sharp_enh = enh_stats["sharpness_score"]
    sharp_diff = sharp_enh - sharp_orig
    sat_diff = enh_stats["mean_saturation"] - orig_stats["mean_saturation"]
    
    # 1. Lighting state
    if status == "original_preserved" or abs(lum_diff) < 0.8:
        lighting_str = "Natural Exposure (Balanced)"
    elif lum_diff > 0:
        lighting_str = "Shadows & Midtones Lifted"
    else:
        lighting_str = "Controlled Highlight Exposure"
        
    # 2. Detail / Texture state
    if status == "original_preserved" or sharp_diff < 5:
        sharpness_str = "Fine Detail Preserved"
    elif sharp_diff >= 40:
        sharpness_str = "Texture Clarity Enhanced"
    else:
        sharpness_str = "Edge Definition Refined"
        
    # 3. Color state
    if sat_diff > 0.015:
        color_str = "Natural Vibrance Restored"
    else:
        color_str = "Authentic Tones Preserved"
        
    # 4. Status summary
    if status == "enhanced":
        studio_str = "Photo Optimized (Clarity & Tone)"
    elif status == "conservatively_enhanced":
        studio_str = "Subtly Optimized"
    else:
        studio_str = "Original Preserved (Optimal Quality)"
        
    return {
        "lighting_improvement": lighting_str,
        "sharpness_gain": sharpness_str,
        "color_vibrance": color_str,
        "studio_grade": studio_str
    }


def get_dominant_colors(img: Image.Image, num_colors: int = 4) -> list[str]:
    """Extracts top dominant hex colors from image safely."""
    try:
        small = img.resize((50, 50))
        result = small.convert("P", palette=Image.Palette.ADAPTIVE, colors=num_colors)
        palette = result.getpalette()
        if not palette:
            return ["#8d5b4c", "#d4a373", "#e6ccb2", "#fefae0"]
        hex_colors = []
        for i in range(num_colors):
            if (i * 3 + 2) < len(palette):
                r = palette[i * 3]
                g = palette[i * 3 + 1]
                b = palette[i * 3 + 2]
                hex_colors.append(f"#{r:02x}{g:02x}{b:02x}")
        return hex_colors or ["#8d5b4c", "#d4a373", "#e6ccb2", "#fefae0"]
    except Exception as e:
        logger.warning(f"Error extracting dominant colors: {e}")
        return ["#8d5b4c", "#d4a373", "#e6ccb2", "#fefae0"]


def enhance_artisan_product_image(image_path: str | Path) -> dict:
    """
    Reworked, reliable, multi-stage image enhancement pipeline for artisan crafts:
    1. Validates and opens image safely.
    2. Normalizes orientation from EXIF.
    3. Handles color spaces and transparency cleanly.
    4. Limits max resolution to prevent memory spikes (max 2048px).
    5. Analyzes photometric characteristics (luminance, contrast, clipping, sharpness, saturation).
    6. Multi-Pass Execution:
       - Attempt 1: Data-driven adaptive enhancement.
       - Attempt 2: Conservative enhancement retry if validation fails.
       - Attempt 3: Sacred original preservation fallback if validation fails.
    7. Formats and saves output safely matching input file format.
    8. Calculates truthful, un-fabricated metrics.
    """
    img_path = Path(image_path)
    if not img_path.exists():
        raise FileNotFoundError(f"Image not found at {img_path}")

    # Step 1 & 2: Open and normalize EXIF orientation
    with Image.open(img_path) as raw_img:
        try:
            img = ImageOps.exif_transpose(raw_img)
        except Exception:
            img = raw_img.copy()

        # Step 3: Handle mode and alpha
        ext = img_path.suffix.lower()
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            # If target format is JPEG, composite over clean white background
            if ext in (".jpg", ".jpeg"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                alpha = img.convert("RGBA").split()[3]
                bg.paste(img.convert("RGB"), mask=alpha)
                img = bg
            else:
                img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Step 4: Dimension bounds
        max_dimension = 2048
        width, height = img.size
        if width > max_dimension or height > max_dimension:
            img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            width, height = img.size

        # Create working RGB copy for analysis & enhancement
        working_img = img.convert("RGB") if img.mode != "RGB" else img.copy()

        # Step 5: Initial Image Analysis
        orig_stats = analyze_image(working_img)
        logger.info(
            f"Image received: {img_path.name} ({width}x{height}) | "
            f"Lum: {orig_stats['mean_luminance']:.1f}, "
            f"Std: {orig_stats['contrast_stddev']:.1f}, "
            f"HiClip: {orig_stats['highlight_clipping']*100:.1f}%, "
            f"Sharp: {orig_stats['sharpness_score']:.1f}"
        )

        final_image = None
        final_stats = None
        enhancement_status = "enhanced"

        # Step 6: Multi-Pass Attempt 1 - Adaptive Enhancement
        params_pass1 = select_enhancement_parameters(orig_stats)
        cand1 = apply_enhancement(working_img, params_pass1)
        cand1_stats = analyze_image(cand1)
        valid1, reason1 = validate_enhancement(orig_stats, cand1_stats)

        if valid1:
            final_image = cand1
            final_stats = cand1_stats
            enhancement_status = "enhanced"
            logger.info(f"Pass 1 enhancement succeeded for {img_path.name}")
        else:
            logger.warning(f"Pass 1 validation failed for {img_path.name}: {reason1}. Triggering Pass 2 (Conservative retry).")
            
            # Step 7: Multi-Pass Attempt 2 - Conservative Enhancement
            params_pass2 = {
                "gamma": 1.02 if orig_stats["mean_luminance"] < 85 else 1.0,
                "contrast": 1.02 if (orig_stats["contrast_stddev"] < 35 and orig_stats["mean_luminance"] < 200) else 1.0,
                "color": 1.0,
                "clarity": {"radius": 1.5, "percent": 15, "threshold": 2},
                "sharpness": {"radius": 0.8, "percent": 20, "threshold": 3}
            }
            cand2 = apply_enhancement(working_img, params_pass2)
            cand2_stats = analyze_image(cand2)
            valid2, reason2 = validate_enhancement(orig_stats, cand2_stats)

            if valid2:
                final_image = cand2
                final_stats = cand2_stats
                enhancement_status = "conservatively_enhanced"
                logger.info(f"Pass 2 conservative enhancement succeeded for {img_path.name}")
            else:
                # Step 8: Multi-Pass Attempt 3 - Sacred Original Preservation Fallback
                logger.warning(f"Pass 2 validation failed for {img_path.name}: {reason2}. Falling back to original.")
                final_image = working_img.copy()
                final_stats = orig_stats
                enhancement_status = "original_preserved"

        # Step 9: Save Enhanced Image matching file format
        enhanced_filename = f"enhanced_{img_path.name}"
        enhanced_path = UPLOAD_DIR / enhanced_filename

        save_kwargs = {}
        if ext == ".png":
            save_format = "PNG"
            save_kwargs["optimize"] = True
        elif ext == ".webp":
            save_format = "WEBP"
            save_kwargs["quality"] = 92
        else:
            save_format = "JPEG"
            save_kwargs["quality"] = 92
            save_kwargs["optimize"] = True

        final_image.save(enhanced_path, format=save_format, **save_kwargs)

        # Step 10: Colors & Truthful Metrics
        colors = get_dominant_colors(final_image)
        metrics = compute_truthful_metrics(orig_stats, final_stats, enhancement_status)

        # Add cache-busting timestamp parameter to enhanced_url
        cache_buster = int(time.time() * 1000)

        return {
            "original_url": f"/uploads/{img_path.name}",
            "enhanced_url": f"/uploads/{enhanced_filename}?v={cache_buster}",
            "original_path": str(img_path),
            "enhanced_path": str(enhanced_path),
            "status": enhancement_status,
            "dimensions": {"width": width, "height": height},
            "dominant_colors": colors,
            "metrics": metrics,
            "analysis": {
                "original": {
                    "mean_luminance": round(orig_stats["mean_luminance"], 2),
                    "contrast_stddev": round(orig_stats["contrast_stddev"], 2),
                    "highlight_clipping_pct": round(orig_stats["highlight_clipping"] * 100, 2),
                    "sharpness_score": round(orig_stats["sharpness_score"], 2),
                    "mean_saturation": round(orig_stats["mean_saturation"], 3),
                },
                "enhanced": {
                    "mean_luminance": round(final_stats["mean_luminance"], 2),
                    "contrast_stddev": round(final_stats["contrast_stddev"], 2),
                    "highlight_clipping_pct": round(final_stats["highlight_clipping"] * 100, 2),
                    "sharpness_score": round(final_stats["sharpness_score"], 2),
                    "mean_saturation": round(final_stats["mean_saturation"], 3),
                }
            }
        }

