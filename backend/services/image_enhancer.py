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

# Global cached rembg session for high-speed reuse
_REMBG_SESSION = None


def get_rembg_session():
    """Lazily initializes and caches the lightweight rembg session."""
    global _REMBG_SESSION
    if _REMBG_SESSION is None:
        try:
            import rembg
            # u2netp is the lightweight, fast mobile model (~4.5MB)
            _REMBG_SESSION = rembg.new_session("u2netp")
            logger.info("rembg session initialized successfully with u2netp model.")
        except Exception as e:
            logger.warning(f"Failed to initialize rembg session: {e}. Will use fallback segmentation.")
            _REMBG_SESSION = False
    return _REMBG_SESSION if _REMBG_SESSION is not False else None


def analyze_image(img: Image.Image, mask: Image.Image = None) -> dict:
    """
    Measures quantitative photometric characteristics of an image or isolated subject:
    - mean_luminance (0-255)
    - contrast_stddev (standard deviation of luminance)
    - shadow_clipping (ratio of pixels <= 11)
    - highlight_clipping (ratio of pixels >= 246)
    - sharpness_score (edge variance via high-pass filter)
    - mean_saturation (0.0 - 1.0 in HSV space)
    """
    gray = img.convert("L")
    
    if mask is not None:
        # Evaluate metrics strictly on the foreground craft pixels
        mask_l = mask.convert("L")
        total_pixels = sum(1 for p in mask_l.getdata() if p > 128)
        if total_pixels == 0:
            total_pixels = max(1, img.width * img.height)
            mask_l = None
    else:
        total_pixels = max(1, img.width * img.height)
        mask_l = None

    if mask_l is None:
        hist = gray.histogram()
        mean_lum = sum(i * count for i, count in enumerate(hist)) / total_pixels
        variance = sum(((i - mean_lum) ** 2) * count for i, count in enumerate(hist)) / total_pixels
        std_lum = math.sqrt(variance)
        shadow_ratio = sum(hist[:12]) / total_pixels
        highlight_ratio = sum(hist[246:]) / total_pixels
        
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        sharpness = edge_stat.var[0] if edge_stat.var else 0.0
        
        hsv = img.convert("HSV")
        s_hist = hsv.split()[1].histogram()
        mean_sat = sum(i * count for i, count in enumerate(s_hist)) / (total_pixels * 255.0)
    else:
        gray_data = list(gray.getdata())
        mask_data = list(mask_l.getdata())
        fg_grays = [g for g, m in zip(gray_data, mask_data) if m > 128]
        if not fg_grays:
            fg_grays = gray_data
        
        mean_lum = sum(fg_grays) / len(fg_grays)
        variance = sum((g - mean_lum) ** 2 for g in fg_grays) / len(fg_grays)
        std_lum = math.sqrt(variance)
        shadow_ratio = sum(1 for g in fg_grays if g <= 11) / len(fg_grays)
        highlight_ratio = sum(1 for g in fg_grays if g >= 246) / len(fg_grays)
        
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_data = list(edges.getdata())
        fg_edges = [e for e, m in zip(edge_data, mask_data) if m > 128]
        if fg_edges:
            e_mean = sum(fg_edges) / len(fg_edges)
            sharpness = sum((e - e_mean) ** 2 for e in fg_edges) / len(fg_edges)
        else:
            sharpness = 0.0
            
        hsv = img.convert("HSV")
        sat_data = list(hsv.split()[1].getdata())
        fg_sats = [s for s, m in zip(sat_data, mask_data) if m > 128]
        mean_sat = (sum(fg_sats) / len(fg_sats)) / 255.0 if fg_sats else 0.0

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
    Uses edge-saliency, border color variance, and morphological flood to detect
    the central product and remove outer background.
    """
    width, height = img.size
    rgb_img = img.convert("RGB")
    
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
    
    # Distance from background color
    diff_mask = Image.new("L", (width, height), 0)
    diff_pixels = diff_mask.load()
    rgb_pixels = rgb_img.load()
    
    threshold = 32
    for y in range(height):
        for x in range(width):
            r, g, b = rgb_pixels[x, y]
            dist = math.sqrt((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2)
            if dist > threshold:
                # Foreground confidence scaled by distance
                alpha = min(255, int((dist - threshold) * 4.5))
                diff_pixels[x, y] = alpha
            else:
                diff_pixels[x, y] = 0
                
    # Smooth edges with Gaussian blur to prevent jagged aliasing
    smooth_mask = diff_mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    rgba = rgb_img.convert("RGBA")
    rgba.putalpha(smooth_mask)
    return rgba


def extract_product_subject(img: Image.Image) -> Image.Image:
    """
    Step 1 of Required Workflow:
    - Detects and extracts the primary artisan handicraft / subject.
    - Completely removes the original cluttered background.
    - Preserves the product's actual shape, design, colors, textures, patterns, and important details.
    - Returns an RGBA Image with transparent background.
    """
    session = get_rembg_session()
    if session is not None:
        try:
            import rembg
            # Extract subject cleanly using AI model
            extracted = rembg.remove(
                img,
                session=session,
                alpha_matting=False
            )
            # Ensure edge softness and feathering to preserve fine craft borders
            if extracted.mode == "RGBA":
                r, g, b, a = extracted.split()
                # Verify subject was detected (alpha not all 0 or all 255)
                a_stat = ImageStat.Stat(a)
                if a_stat.mean[0] > 5 and a_stat.mean[0] < 250:
                    # Refine edge feathering gently (radius 0.8px)
                    soft_a = a.filter(ImageFilter.GaussianBlur(0.8))
                    extracted.putalpha(soft_a)
                    return extracted
                elif a_stat.mean[0] >= 250:
                    logger.info("rembg returned full mask, applying fallback segmentation.")
                    return fallback_subject_extraction(img)
                else:
                    logger.warning("rembg produced near-empty mask, falling back.")
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
    - Selects from high-end e-commerce studio solid tones based on the craft's color temperature and luminance.
    """
    if extracted_rgba.mode != "RGBA":
        extracted_rgba = extracted_rgba.convert("RGBA")
        
    r_ch, g_ch, b_ch, a_ch = extracted_rgba.split()
    r_data = list(r_ch.getdata())
    g_data = list(g_ch.getdata())
    b_data = list(b_ch.getdata())
    a_data = list(a_ch.getdata())
    
    # Filter foreground craft pixels only (alpha > 128)
    fg_pixels = [
        (r, g, b) for r, g, b, a in zip(r_data, g_data, b_data, a_data)
        if a > 128
    ]
    
    if not fg_pixels:
        # Default crisp studio neutral if no foreground detected
        return (246, 246, 248)
        
    avg_r = sum(p[0] for p in fg_pixels) / len(fg_pixels)
    avg_g = sum(p[1] for p in fg_pixels) / len(fg_pixels)
    avg_b = sum(p[2] for p in fg_pixels) / len(fg_pixels)
    
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
    #    Needs a soft solid slate neutral so the craft has crisp silhouette contrast:
    if mean_lum > 185 and sat < 0.25:
        # Soft Slate Studio Neutral (Solid)
        return (236, 239, 241)  # #ECEFF1
        
    # 2. Very Dark Crafts (Black metal, dark bronze, dark walnut, deep ironware)
    #    Needs bright studio clean off-white for strong definition:
    if mean_lum < 75:
        # Bright Crisp Studio Off-White (Solid)
        return (248, 249, 250)  # #F8F9FA
        
    # 3. Warm Earthy Crafts (Terracotta clay, teak/rosewood, brass, copper, warm textiles)
    #    Warm tones (Hue 10° - 65° or warm red/brown avg_r > avg_g > avg_b):
    if (10 <= hue <= 65 or (avg_r > avg_g and avg_g >= avg_b and (avg_r - avg_b) > 20)) and sat > 0.15:
        # Alabaster Warm Studio Off-White (Solid)
        return (247, 245, 240)  # #F7F5F0
        
    # 4. Cool Crafts (Indigo handloom, peacock blue pottery, turquoise stone, emerald silk)
    #    Cool tones (Hue 150° - 270°):
    if 150 <= hue <= 270 and sat > 0.15:
        # Pearl Mist Cool Studio White (Solid)
        return (245, 246, 248)  # #F5F6F8

    # 5. Multi-Color / Balanced Crafts (Madhubani painting, multi-hued weaves)
    #    Pure Neutral Studio Gray-White (Solid)
    return (246, 247, 249)  # #F6F7F9


def enhance_product_presentation(extracted_rgba: Image.Image) -> Image.Image:
    """
    Step 3 of Required Workflow:
    - Improves overall image quality, clarity, lighting, sharpness, and visual cleanliness.
    - Keeps the product itself authentic to the uploaded image.
    - Strictly preserves design, material, color, shape, and structure.
    - Operates only on the extracted product subject.
    """
    if extracted_rgba.mode != "RGBA":
        extracted_rgba = extracted_rgba.convert("RGBA")
        
    r, g, b, alpha = extracted_rgba.split()
    rgb_craft = Image.merge("RGB", (r, g, b))
    
    # Analyze photometric characteristics of the craft itself
    stats = analyze_image(rgb_craft, mask=alpha)
    lum = stats["mean_luminance"]
    contrast_std = stats["contrast_stddev"]
    sat = stats["mean_saturation"]
    
    enhanced_rgb = rgb_craft.copy()
    
    # 1. Subtle exposure & midtone gamma lift (lifts dark workshop shadows)
    if lum < 80:
        gamma = 1.0 + min(0.15, (85 - lum) / 350)
    elif lum < 115:
        gamma = 1.0 + min(0.08, (120 - lum) / 550)
    elif lum > 180:
        gamma = 1.0  # Preserve high-key crafts without blowout
    else:
        gamma = 1.02
        
    if abs(gamma - 1.0) > 0.005:
        inv_gamma = 1.0 / gamma
        lut = [int(round(((i / 255.0) ** inv_gamma) * 255.0)) for i in range(256)]
        enhanced_rgb = enhanced_rgb.point(lut * 3)
        
    # 2. Gentle contrast refinement
    if contrast_std < 28 and lum < 200:
        enhanced_rgb = ImageEnhance.Contrast(enhanced_rgb).enhance(1.04)
    elif contrast_std < 42 and lum < 200:
        enhanced_rgb = ImageEnhance.Contrast(enhanced_rgb).enhance(1.02)
        
    # 3. Authentic color preservation (safe slight saturation balance)
    if sat < 0.15:
        enhanced_rgb = ImageEnhance.Color(enhanced_rgb).enhance(1.03)
    elif sat < 0.25:
        enhanced_rgb = ImageEnhance.Color(enhanced_rgb).enhance(1.01)
        
    # 4. Craft detail clarity & sharpness
    # Medium-radius clarity filter for physical depth and material texture
    enhanced_rgb = enhanced_rgb.filter(
        ImageFilter.UnsharpMask(radius=2.0, percent=25, threshold=2)
    )
    # Fine-radius sharpness filter for carvings, weaves, and paintwork
    enhanced_rgb = enhanced_rgb.filter(
        ImageFilter.UnsharpMask(radius=0.8, percent=30, threshold=3)
    )
    
    # Merge enhanced RGB back with the authentic original alpha mask
    er, eg, eb = enhanced_rgb.split()
    return Image.merge("RGBA", (er, eg, eb, alpha))


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
    # Create single solid color canvas
    solid_bg = Image.new("RGB", (width, height), bg_color)
    
    # Extract alpha mask
    alpha = enhanced_rgba.split()[3]
    
    # Paste enhanced product using alpha mask
    solid_bg.paste(enhanced_rgba.convert("RGB"), mask=alpha)
    return solid_bg


def get_dominant_colors(img: Image.Image, mask: Image.Image = None, num_colors: int = 4) -> list[str]:
    """Extracts top dominant hex colors from the isolated product craft."""
    try:
        if mask is not None:
            # Crop to foreground bounding box
            bbox = mask.getbbox()
            if bbox:
                craft_crop = img.crop(bbox)
                small = craft_crop.resize((50, 50))
            else:
                small = img.resize((50, 50))
        else:
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
    Unified Image Enhancement Pipeline:
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

    # 1. Open and normalize EXIF orientation
    with Image.open(img_path) as raw_img:
        try:
            img = ImageOps.exif_transpose(raw_img)
        except Exception:
            img = raw_img.copy()

        # Handle color modes
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")

        # 2. Limit maximum dimension to prevent memory pressure (max 2048px)
        max_dimension = 2048
        width, height = img.size
        if width > max_dimension or height > max_dimension:
            img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            width, height = img.size

        # Baseline analysis of original uploaded photo
        orig_stats = analyze_image(img.convert("RGB"))
        logger.info(
            f"Processing artisan image: {img_path.name} ({width}x{height}) | "
            f"Lum: {orig_stats['mean_luminance']:.1f}, Sharp: {orig_stats['sharpness_score']:.1f}"
        )

        # 3. Detect and extract primary product subject (remove original background)
        isolated_product = extract_product_subject(img)

        # 4. Automatically choose a complementary single solid background color
        bg_rgb = select_complementary_studio_background(isolated_product)
        solid_bg_hex = f"#{bg_rgb[0]:02x}{bg_rgb[1]:02x}{bg_rgb[2]:02x}"
        logger.info(f"Selected complementary solid background for {img_path.name}: {solid_bg_hex}")

        # 5. Improve product presentation (lighting, clarity, sharpness on isolated craft)
        enhanced_product = enhance_product_presentation(isolated_product)

        # 6. Place extracted product on the clean single solid color studio background
        final_studio_img = composite_studio_product(enhanced_product, bg_rgb)

        # 7. Final photometric analysis of enhanced craft subject
        final_stats = analyze_image(final_studio_img, mask=enhanced_product.split()[3])

        # 8. Save final studio photograph matching file format
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
        logger.info(f"Saved studio product photograph to {enhanced_path.name}")

        # 9. Extract dominant craft colors and compute truthful metrics
        dominant_colors = get_dominant_colors(
            final_studio_img,
            mask=enhanced_product.split()[3]
        )
        metrics = compute_truthful_metrics(orig_stats, final_stats, solid_bg_hex)
        cache_buster = int(time.time() * 1000)

        return {
            "original_url": f"/uploads/{img_path.name}",
            "enhanced_url": f"/uploads/{enhanced_filename}?v={cache_buster}",
            "original_path": str(img_path),
            "enhanced_path": str(enhanced_path),
            "status": "enhanced",
            "solid_background_color": solid_bg_hex,
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
