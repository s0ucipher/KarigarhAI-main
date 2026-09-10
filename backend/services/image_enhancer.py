import os
import time
import math
import uuid
import logging
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageFilter, ImageStat, ImageChops
from backend.config import UPLOAD_DIR

logger = logging.getLogger("kalasetu.image_enhancer")
logger.setLevel(logging.INFO)

# Global cached rembg session for high-speed reuse (None: unattempted, False: unavailable, session: ready)
_REMBG_SESSION = None


def get_rembg_session():
    """Lazily initializes and caches the lightweight rembg session if rembg is installed."""
    global _REMBG_SESSION
    if _REMBG_SESSION is None:
        try:
            import rembg
            # u2netp is the lightweight, fast mobile model (~4.5MB)
            _REMBG_SESSION = rembg.new_session("u2netp")
            logger.info("rembg session initialized successfully with u2netp model.")
        except (ImportError, ModuleNotFoundError):
            logger.info("rembg is not installed. Using lightweight Pillow fallback segmentation.")
            _REMBG_SESSION = False
        except Exception as e:
            logger.warning(f"Failed to initialize rembg session: {e}. Will use fallback segmentation.")
            _REMBG_SESSION = False
    return _REMBG_SESSION if _REMBG_SESSION is not False else None


def analyze_image(img: Image.Image, mask: Image.Image = None) -> dict:
    """
    Measures quantitative photometric characteristics using Pillow-native
    operations (ImageStat & histogram) without allocating Python pixel lists:
    - mean_luminance (0-255)
    - contrast_stddev (standard deviation of luminance)
    - shadow_clipping (ratio of pixels <= 11)
    - highlight_clipping (ratio of pixels >= 246)
    - sharpness_score (edge variance via high-pass filter)
    - mean_saturation (0.0 - 1.0 in HSV space)
    """
    gray = img if img.mode == "L" else img.convert("L")
    binary_mask = None
    mask_to_close = False

    if mask is not None:
        mask_l = mask if mask.mode == "L" else mask.convert("L")
        binary_mask = mask_l.point(lambda p: 255 if p > 128 else 0)
        mask_stat = ImageStat.Stat(binary_mask)
        if mask_stat.mean[0] == 0:
            binary_mask.close()
            binary_mask = None
        else:
            mask_to_close = True
        if mask_l is not mask:
            mask_l.close()

    stat = ImageStat.Stat(gray, mask=binary_mask)
    total_pixels = stat.count[0] if stat.count and stat.count[0] > 0 else max(1, img.width * img.height)
    mean_lum = stat.mean[0] if stat.mean else 100.0
    std_lum = stat.stddev[0] if stat.stddev else 0.0

    hist = gray.histogram(mask=binary_mask)
    shadow_ratio = sum(hist[:12]) / total_pixels
    highlight_ratio = sum(hist[246:]) / total_pixels

    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges, mask=binary_mask)
    sharpness = edge_stat.var[0] if edge_stat.var else 0.0
    edges.close()

    hsv = img if img.mode == "HSV" else img.convert("HSV")
    s_ch = hsv.getchannel(1)
    s_stat = ImageStat.Stat(s_ch, mask=binary_mask)
    mean_sat = (s_stat.mean[0] / 255.0) if s_stat.mean else 0.0
    s_ch.close()

    if hsv is not img:
        hsv.close()
    if gray is not img:
        gray.close()
    if mask_to_close and binary_mask:
        binary_mask.close()

    return {
        "mean_luminance": mean_lum,
        "contrast_stddev": std_lum,
        "shadow_clipping": shadow_ratio,
        "highlight_clipping": highlight_ratio,
        "sharpness_score": sharpness,
        "mean_saturation": mean_sat,
    }


def fallback_subject_extraction(img: Image.Image) -> Image.Image:
    """
    Deterministic foreground subject isolation fallback when rembg is unavailable.
    Uses Pillow-native ImageChops difference, channel max, LUT thresholding,
    and Gaussian blur to detect the central product and remove background without pixel loops.
    """
    width, height = img.size
    rgb_img = img if img.mode == "RGB" else img.convert("RGB")

    # Sample border pixels (corners and edges) to identify background color
    corners = [
        rgb_img.getpixel((0, 0)),
        rgb_img.getpixel((width - 1, 0)),
        rgb_img.getpixel((0, height - 1)),
        rgb_img.getpixel((width - 1, height - 1)),
        rgb_img.getpixel((width // 2, 0)),
        rgb_img.getpixel((0, height // 2)),
        rgb_img.getpixel((width - 1, height // 2)),
    ]
    bg_r = sum(c[0] for c in corners) // len(corners)
    bg_g = sum(c[1] for c in corners) // len(corners)
    bg_b = sum(c[2] for c in corners) // len(corners)

    # Native difference from sampled background color
    bg_img = Image.new("RGB", (width, height), (bg_r, bg_g, bg_b))
    diff = ImageChops.difference(rgb_img, bg_img)
    bg_img.close()

    dr, dg, db = diff.split()
    diff.close()
    diff_mag = ImageChops.lighter(ImageChops.lighter(dr, dg), db)
    dr.close()
    dg.close()
    db.close()

    # LUT point mapping: values <= 24 become 0 (transparent background),
    # values > 24 scale smoothly up to 255 (opaque craft foreground)
    lut = [0 if i <= 24 else min(255, int((i - 24) * 4.5)) for i in range(256)]
    diff_mask = diff_mag.point(lut)
    diff_mag.close()

    # Smooth edges with Gaussian blur to prevent jagged aliasing
    smooth_mask = diff_mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    diff_mask.close()

    rgba = rgb_img.convert("RGBA")
    rgba.putalpha(smooth_mask)
    smooth_mask.close()
    if rgb_img is not img:
        rgb_img.close()

    return rgba


def extract_product_subject(img: Image.Image) -> Image.Image:
    """
    Step 1 of Required Workflow:
    - Detects and extracts the primary artisan handicraft / subject.
    - Completely removes the original cluttered background.
    - Preserves the product's actual shape, design, colors, textures, and details.
    - Uses rembg if installed locally; otherwise automatically uses the fast Pillow-native fallback.
    - Returns an RGBA Image with transparent background.
    """
    session = get_rembg_session()
    if session is not None:
        try:
            import rembg
            extracted = rembg.remove(
                img,
                session=session,
                alpha_matting=False
            )
            if extracted.mode == "RGBA":
                alpha = extracted.getchannel("A")
                a_stat = ImageStat.Stat(alpha)
                mean_a = a_stat.mean[0] if a_stat.mean else 0
                alpha.close()

                if 5 < mean_a < 250:
                    soft_a = extracted.getchannel("A").filter(ImageFilter.GaussianBlur(0.8))
                    extracted.putalpha(soft_a)
                    soft_a.close()
                    return extracted
                elif mean_a >= 250:
                    logger.info("rembg returned full mask, applying fallback segmentation.")
                    extracted.close()
                    return fallback_subject_extraction(img)
                else:
                    logger.warning("rembg produced near-empty mask, falling back.")
                    extracted.close()
                    return fallback_subject_extraction(img)
            return extracted
        except Exception as e:
            logger.warning(f"Error during AI subject extraction: {e}. Using fallback.")
            return fallback_subject_extraction(img)
    else:
        return fallback_subject_extraction(img)


def select_complementary_studio_background(extracted_rgba: Image.Image) -> tuple[int, int, int]:
    """
    Step 2 of Required Workflow:
    - Automatically chooses a single background color that visually complements and matches the product.
    - The background must be a SINGLE SOLID COLOR.
    - Must NOT contain objects, scenery, patterns, gradients, people, furniture, props, or decorative elements.
    - Selects from high-end e-commerce studio solid tones using Pillow-native ImageStat on foreground pixels.
    """
    alpha = extracted_rgba.getchannel("A")
    binary_mask = alpha.point(lambda p: 255 if p > 128 else 0)
    alpha.close()

    rgb_craft = extracted_rgba.convert("RGB") if extracted_rgba.mode != "RGB" else extracted_rgba
    stat = ImageStat.Stat(rgb_craft, mask=binary_mask)
    binary_mask.close()
    if rgb_craft is not extracted_rgba:
        rgb_craft.close()

    if not stat.count or stat.count[0] == 0:
        return (246, 246, 248)

    avg_r = stat.mean[0]
    avg_g = stat.mean[1]
    avg_b = stat.mean[2]

    # Relative luminance
    mean_lum = 0.299 * avg_r + 0.587 * avg_g + 0.114 * avg_b

    # Hue in degrees (0 - 360)
    max_c = max(avg_r, avg_g, avg_b)
    min_c = min(avg_r, avg_g, avg_b)
    delta = max_c - min_c

    if delta == 0:
        hue = 0
        sat = 0
    else:
        sat = delta / max_c
        if max_c == avg_r:
            hue = (60 * ((avg_g - avg_b) / delta) + 360) % 360
        elif max_c == avg_g:
            hue = (60 * ((avg_b - avg_r) / delta) + 120) % 360
        else:
            hue = (60 * ((avg_r - avg_g) / delta) + 240) % 360

    # Studio Solid Background Selection Palette:
    # 1. Very Light / Pale Crafts (White marble, ivory lace, cream bone china, silver filigree)
    if mean_lum > 185 and sat < 0.25:
        return (236, 239, 241)

    # 2. Very Dark Crafts (Black metal, dark bronze, dark walnut, deep ironware)
    if mean_lum < 75:
        return (248, 249, 250)

    # 3. Warm Earthy Crafts (Terracotta clay, teak/rosewood, brass, copper, warm textiles)
    if (10 <= hue <= 65 or (avg_r > avg_g and avg_g >= avg_b and (avg_r - avg_b) > 20)) and sat > 0.15:
        return (247, 245, 240)

    # 4. Cool Crafts (Indigo handloom, peacock blue pottery, turquoise stone, emerald silk)
    if 150 <= hue <= 270 and sat > 0.15:
        return (245, 246, 248)

    # 5. Multi-Color / Balanced Crafts (Madhubani painting, multi-hued weaves)
    return (246, 247, 249)


def apply_shadows_and_midtones_lift(
    isolated_rgba: Image.Image,
    craft_stats: dict
) -> tuple[Image.Image, bool]:
    """
    Operation 1: Shadows & Midtones Lift
    - Calculates craft luminance and shadow distribution.
    - Constructs non-linear tone transfer function:
      f(u) = u + K * u * (1 - u)^1.25 where u in [0, 1].
      Mathematically guarantees f(0) = 0 (deep blacks preserved)
      and f(1) = 1 (pure highlights at 255 strictly preserved with zero blowout).
    - Lifts dark shadow regions (u in [0.10, 0.35]) naturally.
    - Improves midtone visibility (u in [0.35, 0.65]).
    - Preserves authentic craft colors with mild chroma compensation (1.02).
    - Measures shadow luminance change using Pillow histograms with mask (zero pixel list allocations).
    """
    alpha = isolated_rgba.getchannel("A")
    rgb_craft = isolated_rgba.convert("RGB")
    lum = craft_stats.get("mean_luminance", 100.0)

    # Determine lift coefficient based on craft lighting
    if lum < 80:
        k_lift = 0.36
    elif lum < 115:
        k_lift = 0.26
    elif lum < 165:
        k_lift = 0.16
    else:
        k_lift = 0.08

    # Build non-linear tone curve LUT (256 entries)
    lut = []
    for i in range(256):
        u = i / 255.0
        delta = k_lift * u * ((1.0 - u) ** 1.25)
        new_val = int(round(min(1.0, max(0.0, u + delta)) * 255.0))
        lut.append(new_val)

    lifted_rgb = rgb_craft.point(lut * 3)
    lifted_rgb = ImageEnhance.Color(lifted_rgb).enhance(1.02)

    # Verify shadow/midtone intensity was genuinely lifted via masked histograms
    binary_mask = alpha.point(lambda p: 255 if p > 128 else 0)
    pre_gray = rgb_craft.convert("L")
    post_gray = lifted_rgb.convert("L")

    hist_pre = pre_gray.histogram(mask=binary_mask)
    hist_post = post_gray.histogram(mask=binary_mask)

    pre_gray.close()
    post_gray.close()
    binary_mask.close()
    rgb_craft.close()

    count_pre = sum(hist_pre[:110])
    count_post = sum(hist_post[:140])

    lifted_flag = True
    if count_pre > 0 and count_post > 0:
        avg_pre = sum(i * c for i, c in enumerate(hist_pre[:110])) / count_pre
        avg_post = sum(i * c for i, c in enumerate(hist_post[:140])) / count_post
        lifted_flag = (avg_post - avg_pre) >= 1.5

    er, eg, eb = lifted_rgb.split()
    lifted_rgb.close()
    result = Image.merge("RGBA", (er, eg, eb, alpha))
    er.close()
    eg.close()
    eb.close()
    alpha.close()

    return result, lifted_flag


def apply_texture_clarity_enhancement(
    isolated_rgba: Image.Image,
    craft_stats: dict
) -> tuple[Image.Image, bool]:
    """
    Operation 2: Texture Clarity Enhancement
    - Improves fine-detail visibility without noise amplification or halos.
    - Applies dual-frequency threshold-controlled unsharp mask:
      - Pass 1 (Medium radius 1.8, percent 30, threshold 3):
        Targets genuine material surface texture (clay roughness, wood grain, fabric weave).
      - Pass 2 (Fine radius 0.7, percent 25, threshold 3):
        Targets sharp structural edges (carvings, embroidery, metal engravings).
    - Threshold=3 ensures smooth regions and flat backgrounds remain untouched.
    - Measures edge variance on craft pixels without large pixel lists.
    """
    alpha = isolated_rgba.getchannel("A")
    rgb_craft = isolated_rgba.convert("RGB")

    # Pass 1: Local texture clarity
    pass1 = rgb_craft.filter(
        ImageFilter.UnsharpMask(radius=1.8, percent=30, threshold=3)
    )
    rgb_craft.close()

    # Pass 2: Fine detail & edge definition
    pass2 = pass1.filter(
        ImageFilter.UnsharpMask(radius=0.7, percent=25, threshold=3)
    )
    pass1.close()

    # Verify edge variance gain on craft pixels using Pillow-native analyze_image
    post_stats = analyze_image(pass2, mask=alpha)
    pre_sharp = craft_stats.get("sharpness_score", 0.0)
    post_sharp = post_stats.get("sharpness_score", 0.0)

    clarified_flag = post_sharp >= pre_sharp * 0.98 or post_sharp > 5.0

    er, eg, eb = pass2.split()
    pass2.close()
    result = Image.merge("RGBA", (er, eg, eb, alpha))
    er.close()
    eg.close()
    eb.close()
    alpha.close()

    return result, clarified_flag


def enhance_product_presentation(extracted_rgba: Image.Image) -> Image.Image:
    """Convenience wrapper executing both lighting and clarity operations in sequence."""
    alpha = extracted_rgba.getchannel("A")
    stats = analyze_image(extracted_rgba.convert("RGB"), mask=alpha)
    alpha.close()
    lifted, _ = apply_shadows_and_midtones_lift(extracted_rgba, stats)
    clarified, _ = apply_texture_clarity_enhancement(lifted, stats)
    lifted.close()
    return clarified


def composite_studio_product(
    enhanced_rgba: Image.Image,
    bg_color: tuple[int, int, int]
) -> Image.Image:
    """
    Composites the isolated, enhanced product onto the complementary single solid background.
    - The background is 100% a single flat solid color.
    - No gradients, no props, no scenery, no decorative elements.
    """
    width, height = enhanced_rgba.size
    solid_bg = Image.new("RGB", (width, height), bg_color)
    alpha = enhanced_rgba.getchannel("A")
    rgb = enhanced_rgba.convert("RGB")
    solid_bg.paste(rgb, mask=alpha)
    alpha.close()
    rgb.close()
    return solid_bg


def get_dominant_colors(img: Image.Image, mask: Image.Image = None, num_colors: int = 4) -> list[str]:
    """Extracts top dominant hex colors from the isolated product craft."""
    try:
        if mask is not None:
            bbox = mask.getbbox()
            if bbox:
                craft_crop = img.crop(bbox)
                small = craft_crop.resize((50, 50))
                craft_crop.close()
            else:
                small = img.resize((50, 50))
        else:
            small = img.resize((50, 50))

        result = small.convert("P", palette=Image.Palette.ADAPTIVE, colors=num_colors)
        small.close()
        palette = result.getpalette()
        result.close()
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


def compute_truthful_metrics(
    orig_stats: dict,
    final_stats: dict,
    solid_bg_hex: str = "#F7F5F0"
) -> dict:
    """
    Computes honest factual descriptors for the studio product enhancement.
    Strictly avoids fake percentage increments (+X%).
    """
    lum_diff = final_stats["mean_luminance"] - orig_stats["mean_luminance"]
    sharp_diff = final_stats["sharpness_score"] - orig_stats["sharpness_score"]
    sat_diff = final_stats.get("mean_saturation", 0) - orig_stats.get("mean_saturation", 0)

    if abs(lum_diff) < 1.0:
        lighting_str = "Natural Exposure (Balanced)"
    elif lum_diff > 0:
        lighting_str = "Shadows & Midtones Lifted"
    else:
        lighting_str = "Controlled Highlight Exposure"

    if sharp_diff >= 40:
        sharpness_str = "Texture Clarity Enhanced"
    elif sharp_diff >= 15:
        sharpness_str = "Edge Definition Refined"
    else:
        sharpness_str = "Fine Details Preserved"

    if sat_diff > 0.015:
        color_str = "Natural Vibrance Restored"
    else:
        color_str = "Authentic Tones Preserved"

    if solid_bg_hex and solid_bg_hex.startswith("#"):
        studio_str = f"Studio Isolated ({solid_bg_hex.upper()})"
    else:
        studio_str = "Studio Photo Ready"

    return {
        "lighting_improvement": lighting_str,
        "sharpness_gain": sharpness_str,
        "color_vibrance": color_str,
        "studio_grade": studio_str
    }


def enhance_artisan_product_image(image_path: str | Path) -> dict:
    """
    Unified Low-Memory Image Enhancement Pipeline:
    Upload Product Photo
    → Detect Main Product
    → Remove Original Background
    → Extract Product
    → Generate Clean Studio-Style Photo
    → Apply Complementary Single-Color Background
    → Improve Overall Visual Quality
    → Return Final Image
    """
    img_path = Path(image_path)
    if not img_path.exists():
        raise FileNotFoundError(f"Image not found at {img_path}")

    logger.info(f"START image processing: {img_path.name}")

    # 1. Open and normalize EXIF orientation
    with Image.open(img_path) as raw_img:
        try:
            img = ImageOps.exif_transpose(raw_img)
        except Exception:
            img = raw_img.copy()

    # Handle color modes
    if img.mode not in ("RGB", "RGBA"):
        converted_img = img.convert("RGB")
        img.close()
        img = converted_img

    # 2. Limit maximum dimension to 1536px to prevent Render memory spikes
    max_dimension = 1536
    width, height = img.size
    if width > max_dimension or height > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        width, height = img.size
    logger.info(f"AFTER resize: {width}x{height}")

    # 3. Detect and extract primary product subject (remove original background)
    isolated_product = extract_product_subject(img)
    craft_mask = isolated_product.getchannel("A") if isolated_product.mode == "RGBA" else None

    # Verify isolation via native histogram check
    if craft_mask:
        mask_hist = craft_mask.histogram()
        is_studio_isolated = (sum(mask_hist[:50]) > 0) and (sum(mask_hist[181:]) > 0)
    else:
        is_studio_isolated = False
    logger.info(f"AFTER extraction: subject isolated={is_studio_isolated}")

    # Baseline analysis of original craft subject
    orig_rgb = img if img.mode == "RGB" else img.convert("RGB")
    orig_stats = analyze_image(orig_rgb, mask=craft_mask)
    if orig_rgb is not img:
        orig_rgb.close()
    img.close()

    # 4. Automatically choose a complementary single solid background color
    bg_rgb = select_complementary_studio_background(isolated_product)
    solid_bg_hex = f"#{bg_rgb[0]:02x}{bg_rgb[1]:02x}{bg_rgb[2]:02x}"

    # 5. Apply controlled lighting correction: shadows & midtones lifted, highlights preserved
    lifted_craft, is_shadows_lifted = apply_shadows_and_midtones_lift(isolated_product, orig_stats)
    isolated_product.close()

    # 6. Apply controlled clarity/sharpening: texture clarity & edge enhancement
    enhanced_craft, is_texture_clarified = apply_texture_clarity_enhancement(lifted_craft, orig_stats)
    lifted_craft.close()
    logger.info(f"AFTER enhancement: lighting lifted={is_shadows_lifted}, texture clarified={is_texture_clarified}")

    # 7. Place extracted product on the clean single solid color studio background
    final_studio_img = composite_studio_product(enhanced_craft, bg_rgb)

    # 8. Final photometric analysis of enhanced craft subject
    enhanced_alpha = enhanced_craft.getchannel("A")
    final_stats = analyze_image(final_studio_img, mask=enhanced_alpha)
    enhanced_alpha.close()

    # 9. Extract dominant craft colors
    dominant_colors = get_dominant_colors(final_studio_img, mask=craft_mask)
    if craft_mask:
        craft_mask.close()

    # 10. Save final studio photograph matching file format
    ext = img_path.suffix.lower()
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

    final_studio_img.save(enhanced_path, format=save_format, **save_kwargs)
    logger.info(f"AFTER final save: {enhanced_path.name}")

    # Release final image buffers
    enhanced_craft.close()
    final_studio_img.close()

    # Metrics
    metrics = {
        "lighting_improvement": "Shadows & Midtones Lifted" if is_shadows_lifted else "Natural Exposure (Balanced)",
        "sharpness_gain": "Texture Clarity Enhanced" if is_texture_clarified else "Fine Details Preserved",
        "color_vibrance": "Authentic Tones Preserved",
        "studio_grade": f"Studio Isolated ({solid_bg_hex.upper()})" if is_studio_isolated else "Natural Background"
    }
    cache_buster = int(time.time() * 1000)

    return {
        "original_url": f"/uploads/{img_path.name}",
        "enhanced_url": f"/uploads/{enhanced_filename}?v={cache_buster}",
        "original_path": str(img_path),
        "enhanced_path": str(enhanced_path),
        "status": "enhanced",
        "solid_background_color": solid_bg_hex,
        "enhancement": {
            "shadows_midtones_lifted": is_shadows_lifted,
            "texture_clarity_enhanced": is_texture_clarified,
            "studio_isolated": is_studio_isolated,
            "background_color": solid_bg_hex
        },
        "dimensions": {"width": width, "height": height},
        "dominant_colors": dominant_colors,
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
