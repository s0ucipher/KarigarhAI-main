import os
import json
import re
import logging
from pathlib import Path
from backend.config import GEMINI_API_KEY
from backend.services.pricing_engine import calculate_artisan_price, round_inr_price

logger = logging.getLogger("kalasetu.ai_service")
logger.setLevel(logging.INFO)


def generate_product_catalog(
    image_path: str,
    user_language: str = "en",
    hint: str = None,
    client_filename: str = None,
    seller_costs: dict = None
) -> dict:
    """
    Generates structured marketplace listing details:
    - Product Name & Title
    - Evocative Story-driven Description
    - Category
    - Material & Technique
    - Traditional Craft Details
    - Relevant Tags & Search Keywords
    - Fair Price Suggestion (Min & Max in INR)
    Uses Gemini Vision API as primary, otherwise high-fidelity artisan knowledge engine.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or GEMINI_API_KEY
    if api_key:
        try:
            return call_gemini_vision(image_path, api_key, user_language, hint, seller_costs)
        except Exception as e:
            logger.warning(f"Gemini Vision call failed: {e}. Falling back to Artisan Knowledge Engine.")
            return generate_offline_craft_listing(image_path, user_language, hint, client_filename, seller_costs)
    else:
        return generate_offline_craft_listing(image_path, user_language, hint, client_filename, seller_costs)


def call_gemini_vision(
    image_path: str,
    api_key: str,
    language: str = "en",
    hint: str = None,
    seller_costs: dict = None
) -> dict:
    """
    Calls Google Gemini Vision with strict instructions:
    1. Deep Visual Decomposition: object identification, observed materials, craft style, shape/scale, craftsmanship level, complexity score (0-100), labor intensity.
    2. Zero hallucination: strictly base descriptions on observable facts.
    3. Multi-factor product-specific pricing: scale, material value, craftsmanship complexity, and labor.
    4. Structured JSON output via response_mime_type="application/json".
    """
    from google import genai
    from google.genai import types
    from PIL import Image

    client = genai.Client(api_key=api_key)

    with Image.open(image_path) as raw_img:
        img = raw_img.convert("RGB")

    lang_prompt = {
        "en": "Write title, description, material, and craft details in English.",
        "hi": "Write title, description, material, and craft details in clear, authentic Hindi (Devanagari script).",
        "bn": "Write title, description, material, and craft details in authentic, beautiful Bengali."
    }.get(language, "Write in English.")

    prompt = f"""
    You are an expert artisan curator and e-commerce specialist for KalaSetu AI, an ethical marketplace empowering traditional Indian craftsmen, potters, weavers, and woodworkers.

    Analyze the CURRENT uploaded product photograph carefully.
    {f"Artisan note or craft hint: {hint}" if hint else ""}
    {lang_prompt}

    MANDATORY DEEP VISUAL PRODUCT UNDERSTANDING & PRICING RULES:
    1. VISUAL OBJECT & CRAFT RECOGNITION:
       Inspect the photograph to identify what actual physical object is visible:
       - What is the object? (e.g., wooden chair, bench, dining table, terracotta vase, clay diya, dhokra brass figurine, handloom saree, silk stole, bamboo basket, folk art painting, beaded necklace).
       - What physical materials are observable? (e.g., solid seasoned hardwood, natural river clay, brass alloy, woven cotton/silk yarn, bamboo strips).
       - If material cannot be confirmed from the image, state "Natural craft material (Unverified)". DO NOT invent botanical fibers, rare timber species, or metal purities without clear visual evidence.
       - What construction or assembly method is visible? (e.g., mortise-and-tenon joinery, wheel throwing and kiln firing, lost-wax furnace casting, pit-loom weaving, freehand line painting).
    2. CRAFTSMANSHIP & COMPLEXITY EVALUATION:
       - Evaluate craftsmanship level: "basic", "moderate", "detailed", or "highly detailed".
       - Assign an internal complexity score from 0 to 100 based on observable carving, joinery, weaving density, shaping symmetry, and surface detail.
       - Estimate labor intensity: "low", "moderate", "high", or "very high".
    3. STRICT ANTI-HALLUCINATION:
       - Base ALL descriptions strictly on visible evidence in THIS current photo.
       - If the image shows a wooden chair, describe the WOODEN CHAIR. DO NOT invent folk paintings, rice paper, pigments, turmeric, indigo, or Kachni/Bharni.
       - If the image shows pottery, describe the POTTERY.
       - If the image shows a textile, describe the TEXTILE.
       - DO NOT invent awards, GI certifications, tribal affiliations, or centuries-old artisan lineage.
    4. ACCURATE CATEGORY:
       Select the exact matching category_slug from:
       - 'pottery-ceramics': Clay pottery, terracotta, earthenware, vases, diyas, planters
       - 'woodcraft': Wooden furniture (chairs, tables, stools), carved decor, Channapatna toys, wooden boxes
       - 'handloom-textiles': Sarees, shawls, stoles, dupattas, fabrics, embroidery
       - 'metal-brass': Dhokra lost-wax casting, brass statues, bell metal, copper vessels
       - 'folk-art': Traditional paintings on paper/canvas (Madhubani, Warli, Pattachitra)
       - 'jewelry': Handcrafted necklaces, earrings, bangles, pendants
       - 'bamboo-cane': Baskets, mats, lampshades, cane furniture
    5. MULTI-FACTOR REALISTIC PRICING:
       Estimate a realistic, fair artisan market price range in Indian Rupees (INR) for THIS SPECIFIC PRODUCT based on its type, scale, material, and craftsmanship complexity:
       - Small clay diya / simple pottery: ₹150 – ₹400
       - Decorative terracotta vase / urn: ₹450 – ₹950
       - Small wooden toy / handheld decor: ₹350 – ₹800
       - Large wooden furniture (chair, table, bench): ₹2,800 – ₹6,500
       - Handloom cotton textile: ₹650 – ₹1,500
       - Pure silk embroidered saree / stole: ₹2,200 – ₹5,500
       - Lost-wax cast brass sculpture: ₹1,200 – ₹3,200
       - Handpainted folk art painting: ₹800 – ₹2,400
       - Bamboo / cane basketry: ₹300 – ₹800
       If the image is completely blurry, corrupt, or does not contain an identifiable product, set "price_available": false and "suggested_min_price": null, "suggested_max_price": null.

    Return a valid JSON object ONLY with these exact keys:
    {{
        "visual_analysis": {{
            "product_type": "Short description of the physical object",
            "primary_material": "Primary observable material",
            "secondary_materials": "Secondary observable materials or finish",
            "craft_style": "Recognized craft tradition or technique style",
            "construction_method": "Observable assembly or making method",
            "shape_and_scale": "Observable physical scale (e.g. Full-scale furniture, Tabletop decor, Wearable)",
            "craftsmanship_level": "basic | moderate | detailed | highly detailed",
            "complexity_score": 70,
            "labor_intensity": "low | moderate | high | very high"
        }},
        "name": "Short, clear product name (e.g., Handcrafted Wooden Dining Chair)",
        "title": "Compelling marketplace title (e.g., Artisanal Hand-Carved Solid Wood Armchair)",
        "description": "Engaging, authentic description describing this exact product, its construction, materials, and domestic appeal",
        "category_slug": "exact matching slug from above list",
        "category_name": "Display name of category",
        "material": "Observed natural materials (e.g., Solid Hardwood, River Clay, Brass Alloy)",
        "craft_details": "Observed artisan technique details (e.g. Hand-carved and assembled using joinery)",
        "tags": ["Handmade", "Woodcraft", "Furniture"],
        "search_keywords": ["wooden chair", "handmade furniture", "artisan woodcraft"],
        "price_available": true,
        "suggested_min_price": 2800,
        "suggested_max_price": 4800,
        "price_confidence": 0.92,
        "price_factors": [
            "Full-scale furniture dimensions",
            "Solid seasoned timber construction",
            "Multi-joint carpentry craftsmanship"
        ],
        "ai_rationale": "Clear 1-sentence note for the craftsman explaining why this price range is recommended for this item based on scale, material, and labor.",
        "confidence": 0.95
    }}
    """

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.2
    )

    models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[img, prompt],
                config=config
            )
            text = response.text.strip()
            # Clean json if wrapped in markdown fences
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n?", "", text)
                text = re.sub(r"\n?```$", "", text)

            data = json.loads(text)
            vis = data.get("visual_analysis", {})
            data["complexity_score"] = int(data.get("complexity_score") or vis.get("complexity_score", 50))
            data["craftsmanship_level"] = str(data.get("craftsmanship_level") or vis.get("craftsmanship_level", "detailed"))
            data["price_factors"] = data.get("price_factors", [])
            data["engine"] = f"Gemini Vision ({model_name})"

            price_avail = data.get("price_available", True)
            min_p = data.get("suggested_min_price")
            max_p = data.get("suggested_max_price")
            cat_slug = data.get("category_slug", "other")

            is_valid_gemini_price = (
                price_avail
                and min_p is not None
                and max_p is not None
                and isinstance(min_p, (int, float))
                and isinstance(max_p, (int, float))
                and min_p > 0
                and max_p >= min_p
            )

            if is_valid_gemini_price:
                # LEVEL 1: Use Gemini's validated price recommendation
                data["price_available"] = True
                data["suggested_min_price"] = int(round(min_p))
                data["suggested_max_price"] = int(round(max(max_p, min_p * 1.15)))
                data["price_confidence"] = float(data.get("price_confidence") or 0.92)
                data["price_source"] = "gemini"
                data["price_reason"] = data.get("ai_rationale") or "Gemini AI curator price recommendation based on observable craft characteristics."
            else:
                # LEVEL 2: Gemini product decomposition succeeded, but price field failed!
                # Do NOT discard the rich product analysis! Calculate deterministic price via LocalPriceEngine.
                logger.info(f"Gemini pricing unavailable or invalid ({min_p}-{max_p}). Activating Level 2 local pricing engine.")
                calc_res = calculate_artisan_price(
                    category_slug=cat_slug,
                    product_name=data.get("name") or data.get("title"),
                    product_type=vis.get("product_type"),
                    material=data.get("material") or vis.get("primary_material"),
                    craftsmanship_level=data.get("craftsmanship_level"),
                    complexity_score=data.get("complexity_score"),
                    shape_and_scale=vis.get("shape_and_scale"),
                    labor_intensity=vis.get("labor_intensity"),
                    seller_costs=seller_costs,
                    user_hint=hint,
                )
                data["price_available"] = True
                data["suggested_min_price"] = calc_res["suggested_min_price"]
                data["suggested_max_price"] = calc_res["suggested_max_price"]
                data["price_confidence"] = calc_res["price_confidence"]
                data["price_source"] = calc_res.get("price_source", "local_fallback")
                data["price_factors"] = calc_res["price_factors"]
                data["price_reason"] = calc_res["price_reason"]
                data["ai_rationale"] = calc_res["ai_rationale"]

            return data
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
            last_error = e

    raise last_error or RuntimeError("All Gemini Vision models failed")


def detect_visual_craft_domain(image_path: str) -> Optional[str]:
    """
    Analyzes physical image characteristics (dominant palette, saturation, edge density)
    to classify craft domain when text tokens are absent.
    """
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            from backend.services.image_enhancer import analyze_image, get_dominant_colors
            stats = analyze_image(img)
            # Solid blank, extreme blowout or zero-variance images are indeterminate
            if stats["contrast_stddev"] < 4.0 or (stats["highlight_clipping"] > 0.98 and stats["shadow_clipping"] > 0.98):
                return None
            
            w, h = img.size
            aspect_ratio = h / max(1, w)
            colors = get_dominant_colors(img, num_colors=6)

            for hex_c in colors:
                hex_str = hex_c.lstrip('#')
                if len(hex_str) == 6:
                    r = int(hex_str[0:2], 16)
                    g = int(hex_str[2:4], 16)
                    b = int(hex_str[4:6], 16)
                    
                    # Metal: Brass / Bell metal / Bronze / Gold
                    if (r > 150 and g > 110 and b < 95 and (r - b) > 40) or (r > 130 and g > 120 and b < 80):
                        return "metal"
                    
                    # Terracotta / Clay / Earthenware pottery
                    if (r > 130 and g < 125 and b < 105 and (r - g) > 20) or (115 < r < 215 and 55 < g < 130 and 25 < b < 100):
                        if aspect_ratio < 0.85:
                            return "pottery_diya"
                        elif aspect_ratio > 1.25:
                            return "pottery"
                        return "pottery_pot"
                    
                    # Wood / Furniture / Carvings (warm timber, walnut, teak, sheesham)
                    if (70 < r < 195 and 35 < g < 140 and 15 < b < 95 and r >= g):
                        if aspect_ratio > 1.15:
                            return "wood_furniture"
                        return "woodcraft"
                        
                    # Bamboo / Cane (tan, straw, beige, natural reed)
                    if (160 < r < 240 and 130 < g < 220 and 70 < b < 170 and abs(r - g) < 50 and r > b + 25):
                        return "bamboo"
                        
                    # Handloom / Textiles (saturated colorful weaves: reds, blues, greens, magentas, violets)
                    if (r > 150 and b > 80 and g < 120) or (b > 130 and g > 90 and r < 100) or (g > 130 and r < 115 and b < 115):
                        return "handloom"
            
            # Additional texture and metric heuristics
            if stats["sharpness_score"] > 350 and stats["mean_luminance"] > 160:
                return "folk_art"
            if stats["mean_saturation"] > 0.45 and stats["contrast_stddev"] > 40:
                return "handloom"
                
            # If colors are natural warm/earthy
            if colors:
                avg_r = sum(int(c[1:3], 16) for c in colors[:3]) / max(1, min(3, len(colors)))
                avg_g = sum(int(c[3:5], 16) for c in colors[:3]) / max(1, min(3, len(colors)))
                avg_b = sum(int(c[5:7], 16) for c in colors[:3]) / max(1, min(3, len(colors)))
                if avg_r > avg_b + 20 and avg_r > avg_g:
                    if aspect_ratio < 0.85:
                        return "pottery_diya"
                    elif aspect_ratio > 1.25:
                        return "pottery"
                    return "pottery_pot"
                elif avg_r > 75 and avg_g > 40 and avg_b < 100 and avg_r > avg_b + 15:
                    return "woodcraft"
    except Exception as e:
        logger.debug(f"detect_visual_craft_domain error: {e}")
    return None


def generate_offline_craft_listing(
    image_path: str,
    language: str = "en",
    hint: str = None,
    client_filename: str = None,
    seller_costs: dict = None
) -> dict:
    """
    Intelligent Artisan Knowledge Engine (Offline Fallback):
    - Uses strict regex word boundaries on user hint and client filename.
    - ELIMINATES substring bugs (e.g. 'art' matching 'artisan').
    - Analyzes visual image palette & texture if file exists on disk.
    - Computes product-specific dynamic pricing via LocalPriceEngine.
    - Prioritizes seller costs whenever provided.
    - Enforces indeterminate state (Level 4) only when no craft can be identified.
    """
    # Clean search text: combine explicit hint and clean original filename
    tokens = []
    if hint:
        tokens.append(hint.lower())
    if client_filename:
        # Ignore generic camera filenames
        fn_clean = re.sub(r"^(img|image|photo|whatsapp_image|screenshot)[_\-\d]+", "", client_filename.lower())
        fn_clean = re.sub(r"\.[a-z0-9]+$", "", fn_clean).replace("_", " ").replace("-", " ")
        if len(fn_clean.strip()) > 2:
            tokens.append(fn_clean.strip())

    # Also inspect path stem without 'artisan_' prefix
    stem = Path(image_path).stem
    clean_stem = re.sub(r"^artisan_[a-f0-9]+", "", stem).replace("_", " ").replace("-", " ").strip()
    if clean_stem:
        tokens.append(clean_stem.lower())

    search_text = " ".join(tokens)

    # Word-boundary domain matching with specific craft precedence
    if re.search(r"\b(chair|chairs|table|tables|stool|stools|bench|benches|furniture|armchair|armchairs|desk|desks)\b", search_text):
        domain = "wood_furniture"
    elif re.search(r"\b(jewelry|jewellery|earring|earrings|necklace|necklaces|bangle|bangles|pendant|pendants|bracelet|bracelets|filigree|jhumka|jhumkas|ornament|ornaments)\b", search_text):
        domain = "jewelry"
    elif re.search(r"\b(painting|paintings|folk\s*art|madhubani|canvas|pattachitra|warli|mithila|scroll|scrolls)\b", search_text):
        domain = "folk_art"
    elif re.search(r"\b(brass|metal|metals|dhokra|bronze|copper|bell\s*metal|statue|statues|idol|idols|figurine|figurines|sculpture|sculptures)\b", search_text):
        domain = "metal"
    elif re.search(r"\b(diya|diyas|lamp|lamps|deepak|deepam|candle|oil\s*lamp)\b", search_text):
        domain = "pottery_diya"
    elif re.search(r"\b(matka|matkas|handi|handis|cooking\s*pot|clay\s*pot)\b", search_text):
        domain = "pottery_pot"
    elif re.search(r"\b(pot|pots|vase|vases|terracotta|clay|earthen|planter|planters|ceramic|ceramics|pottery|bankura|horse)\b", search_text):
        domain = "pottery"
    elif re.search(r"\b(saree|sarees|sari|saris|shawl|shawls|cloth|textile|textiles|handloom|handlooms|silk|cotton|kantha|dupatta|dupattas|stole|stoles|weave|weaving|wrap|wraps)\b", search_text):
        domain = "handloom"
    elif re.search(r"\b(bamboo|cane|basket|baskets|jute|mat|mats|wicker)\b", search_text):
        domain = "bamboo"
    elif re.search(r"\b(toy|toys|channapatna)\b", search_text):
        domain = "wood_toy"
    elif re.search(r"\b(wood|wooden|timber|teak|sheesham|carv\w*|box|boxes)\b", search_text):
        domain = "woodcraft"
    else:
        # LEVEL 3: If no text token recognized, attempt visual inspection of photo
        v_domain = detect_visual_craft_domain(image_path) if image_path else None
        domain = v_domain if v_domain else "unknown"

    catalogs = {
        "wood_furniture": {
            "category_slug": "woodcraft",
            "category_name": "Woodcraft & Toys",
            "visual_analysis": {
                "product_type": "Handcrafted Solid Wood Chair / Furniture",
                "primary_material": "Seasoned Hardwood (Solid Timber)",
                "secondary_materials": "Natural Clear Wood Polish",
                "craft_style": "Traditional Mortise-and-Tenon Carpentry",
                "construction_method": "Hand-shaped joinery with flush sanded seams",
                "shape_and_scale": "Full-scale functional seating furniture",
                "craftsmanship_level": "detailed",
                "complexity_score": 75,
                "labor_intensity": "high"
            },
            "price_factors": [
                "Full-scale functional furniture dimensions",
                "Solid seasoned hardwood material mass",
                "Traditional mortise-and-tenon hand joinery",
                "Substantial labor hours in construction and finishing"
            ],
            "price_available": True,
            "price_confidence": 0.88,
            "complexity_score": 75,
            "craftsmanship_level": "detailed",
            "en": {
                "name": "Handcrafted Solid Wood Chair / Furniture Piece",
                "title": "Artisanal Hand-Carved Natural Wooden Furniture",
                "description": "Handcrafted by master wood artisans using seasoned solid wood. Features sturdy joinery, smooth hand-finished edges, and organic wood grain patterns. Built for enduring domestic utility and timeless warmth.",
                "material": "Natural Seasoned Hardwood, Protective Polish",
                "craft_details": "Hand-shaped and assembled using traditional mortise-and-tenon joinery and natural protective finish.",
                "ai_rationale": "Estimated for a full-scale solid wood furniture piece with sturdy hand joinery, reflecting material timber mass, structural durability, and high labor time."
            },
            "hi": {
                "name": "हस्तनिर्मित ठोस लकड़ी की कुर्सी / फर्नीचर",
                "title": "कारीगर द्वारा हाथ से तराशी गई प्राकृतिक लकड़ी की कुर्सी",
                "description": "कुशल बढ़ई कारीगरों द्वारा शुद्ध प्राकृतिक लकड़ी से निर्मित। मजबूत जोड़, चिकने किनारे और मनमोहक प्राकृतिक लकड़ी के रेशे। घर की सुंदरता और उपयोगिता के लिए उत्तम।",
                "material": "प्राकृतिक ठोस लकड़ी, प्राकृतिक पॉलिश",
                "craft_details": "पारंपरिक जोड़ तकनीक और हाथ से की गई घिसाई व पॉलिश।",
                "ai_rationale": "मजबूत जोड़ और ठोस लकड़ी के कारण यह उचित कारीगर मूल्य है।"
            },
            "bn": {
                "name": "হাতে তৈরি কাঠের চেয়ার / আসবাবপত্র",
                "title": "দক্ষ কারিগরের হাতে খোদাই করা প্রাকৃতিক কাঠের চেয়ার",
                "description": "খাঁটি কাঠের ওপর নিপুণ হাতে তৈরি সুদৃশ্য ও দীর্ঘস্থায়ী আসবাব। প্রাকৃতিক কাঠের রেশম ফিনিশ এবং নির্ভরযোগ্য স্থায়িত্ব।",
                "material": "প্রাকৃতিক শক্ত কাঠ, প্রাকৃতিক পালিশ",
                "craft_details": "ঐতিহ্যবাহী কাঠের খাঁজ ও জয়েন্ট পদ্ধতিতে হাতে তৈরি।",
                "ai_rationale": "খাঁটি কাঠ ও নিখুঁত জোড়ের আসবাবের জন্য উপযুক্ত মূল্য।"
            },
            "tags": ["Woodcraft", "HandmadeFurniture", "SolidWood", "ArtisanChair", "HomeDecor"],
            "search_keywords": ["wooden chair", "handmade furniture", "solid wood chair", "artisan woodwork"],
            "suggested_min_price": 2800,
            "suggested_max_price": 5200
        },
        "woodcraft": {
            "category_slug": "woodcraft",
            "category_name": "Woodcraft & Toys",
            "visual_analysis": {
                "product_type": "Handcrafted Carved Wooden Decor Piece",
                "primary_material": "Solid Natural Hardwood",
                "secondary_materials": "Protective Mineral Wax",
                "craft_style": "Traditional Chisel Relief Carving",
                "construction_method": "Hand-chiseled single timber block",
                "shape_and_scale": "Tabletop decorative accent",
                "craftsmanship_level": "detailed",
                "complexity_score": 62,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Fine hand chisel relief detailing",
                "Solid seasoned timber stock",
                "Tabletop display scale",
                "Artisan hand-rubbed wax finish"
            ],
            "price_available": True,
            "price_confidence": 0.85,
            "complexity_score": 62,
            "craftsmanship_level": "detailed",
            "en": {
                "name": "Handcrafted Carved Wooden Decor Piece",
                "title": "Artisanal Hand-Carved Natural Wood Decorative Item",
                "description": "Carved with traditional chisel tools from seasoned wood. Highlights authentic wood grains, smooth hand-polished finish, and cultural craftsmanship.",
                "material": "Seasoned Hardwood, Natural Polish",
                "craft_details": "Hand-carved with chisels and finished with natural oil.",
                "ai_rationale": "Estimated for a hand-carved solid wood decorative accent based on chisel detail density and material quality."
            },
            "hi": {
                "name": "हस्तनिर्मित नक्काशीदार लकड़ी की सजावटी वस्तु",
                "title": "कारीगरों द्वारा हाथ से तराशी गई सुंदर लकड़ी की कलाकृति",
                "description": "पारंपरिक छेनी और हथौड़े से लकड़ी पर उकेरी गई सुंदर कलाकृति। घर की सजावट और उपहार के लिए आदर्श।",
                "material": "प्राकृतिक लकड़ी",
                "craft_details": "हाथ से नक्काशी और प्राकृतिक तेल पॉलिश।",
                "ai_rationale": "बारीक नक्काशी और प्राकृतिक लकड़ी के आधार पर अनुशंसित मूल्य।"
            },
            "bn": {
                "name": "হাতে খোদাই করা কাঠের শিল্পকর্ম",
                "title": "ঐতিহ্যবাহী কাঠের সুন্দর হস্তশিল্প নিদর্শন",
                "description": "বাটালি দিয়ে নিখুঁত হাতে খোদাই করা প্রাকৃতিক কাঠের শিল্পকর্ম।",
                "material": "প্রাকৃতিক কাঠ",
                "craft_details": "হাতে খোদাই ও পলিশ করা।",
                "ai_rationale": "সূক্ষ্ম খোদাই ও কাঠের মানের ওপর ভিত্তি করে মূল্য।"
            },
            "tags": ["Woodcraft", "Handcarved", "WoodenDecor", "Artisan"],
            "search_keywords": ["wood carving", "wooden decor", "handcrafted wood"],
            "suggested_min_price": 750,
            "suggested_max_price": 1650
        },
        "wood_toy": {
            "category_slug": "woodcraft",
            "category_name": "Woodcraft & Toys",
            "visual_analysis": {
                "product_type": "Channapatna Hand-Turned Lacquered Toy",
                "primary_material": "Ivory Wood (Wrightia Tinctoria)",
                "secondary_materials": "Organic Shellac & Vegetable Dyes",
                "craft_style": "Traditional Lathe Turning & Friction Glazing",
                "construction_method": "Turned on manual lathe and leaf-burnished",
                "shape_and_scale": "Handheld play / collectible craft",
                "craftsmanship_level": "moderate",
                "complexity_score": 45,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Traditional lathe woodcraft",
                "Child-safe organic vegetable dyes",
                "Handheld scale craft",
                "High-friction leaf-burnished lacquer"
            ],
            "price_available": True,
            "price_confidence": 0.86,
            "complexity_score": 45,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Channapatna Hand-Turned Lacquered Wooden Toy",
                "title": "Natural Organic Lacquer Glazed Wooden Craft Toy",
                "description": "Hand-turned on traditional wooden lathes from Wrightia tinctoria ivory wood and colored with safe vegetable dyes and natural shellac.",
                "material": "Ivory Wood, Vegetable Dyes, Natural Lac",
                "craft_details": "Turned on lathe and high-friction glazed with natural leaves.",
                "ai_rationale": "Estimated for a child-safe hand-turned wooden toy with organic vegetable lacquer glazing."
            },
            "hi": {
                "name": "चन्नापटना हस्तनिर्मित लकड़ी का खिलौना",
                "title": "प्राकृतिक लाख रंगों से सजा पारंपरिक लकड़ी का खिलौना",
                "description": "सुरक्षित और प्राकृतिक लकड़ी से हाथ की खराद पर बना वनस्पति रंगों से सुसज्जित खिलौना।",
                "material": "आइवरी वुड, वनस्पति रंग",
                "craft_details": "हाथ की खराद पर तराशा गया।",
                "ai_rationale": "प्राकृतिक रंगों और सुरक्षित लकड़ी के खिलौनों के लिए अनुशंसित मूल्य।"
            },
            "bn": {
                "name": "চান্নাপাটনা কাঠের ঐতিহ্যবাহী খেলনা",
                "title": "প্রাকৃতিক রঙে রঞ্জিত কাঠের নিরাপদ খেলনা",
                "description": "প্রাকৃতিক কাঠে তৈরি এবং উদ্ভিজ্জ রঙে পালিশ করা পরিবেশবান্ধব খেলনা।",
                "material": "প্রাকৃতিক কাঠ, ভেষজ রঙ",
                "craft_details": "লেদ মেশিনে হাতে তৈরি।",
                "ai_rationale": "নিরাপদ ভেষজ রঙে পালিশ করা কাঠের খেলনার জন্য ন্যায্য দাম।"
            },
            "tags": ["WoodenToy", "EcoFriendly", "SafeForKids", "Channapatna"],
            "search_keywords": ["wooden toy", "organic toy", "channapatna craft"],
            "suggested_min_price": 450,
            "suggested_max_price": 750
        },
        "pottery_diya": {
            "category_slug": "pottery-ceramics",
            "category_name": "Pottery & Terracotta",
            "visual_analysis": {
                "product_type": "Handcrafted Terracotta Oil Lamp / Diya",
                "primary_material": "Natural River Clay",
                "secondary_materials": "Natural Mineral Slip",
                "craft_style": "Traditional Hand Molding & Potter Wheel",
                "construction_method": "Hand-molded and open-kiln fired",
                "shape_and_scale": "Handheld festive oil lamp",
                "craftsmanship_level": "moderate",
                "complexity_score": 38,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Locally harvested alluvial river clay",
                "Hand-shaped traditional oil reservoir spout",
                "Wood kiln open-fire terracotta hue",
                "Festive illumination and spiritual utility"
            ],
            "price_available": True,
            "price_confidence": 0.88,
            "complexity_score": 38,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Handcrafted Terracotta Festive Oil Lamp (Diya)",
                "title": "Set of Festive Handcrafted Terracotta Oil Lamps",
                "description": "Lovingly hand-shaped by village potters using pure alluvial river clay. Fired in traditional open-air kilns to produce an authentic earthy terracotta finish for festive illumination and warmth.",
                "material": "Natural River Clay, Mineral Slip",
                "craft_details": "Hand-shaped on manual wheel and wood-kiln fired.",
                "ai_rationale": "Estimated for authentic handcrafted terracotta oil lamps based on natural clay firing and traditional potter molding."
            },
            "hi": {
                "name": "हस्तनिर्मित टेराकोटा मिट्टी का दीया",
                "title": "कुम्हार द्वारा हाथ से गढ़ा पारंपरिक मिट्टी का दीया",
                "description": "पवित्र नदी की चिकनी मिट्टी से कुम्हारों द्वारा निर्मित प्रामाणिक दीया। पारंपरिक भट्टी में पकाया गया, जो उत्सवों और दैनिक पूजा के लिए आदर्श है।",
                "material": "प्राकृतिक नदी की मिट्टी",
                "craft_details": "हाथ से गढ़ा एवं भट्टी में पकाया गया।",
                "ai_rationale": "प्राकृतिक मिट्टी और पारंपरिक कुम्हार कला पर आधारित उचित मूल्य।"
            },
            "bn": {
                "name": "হাতে তৈরি পোড়ামাটির প্রদীপ (দিয়া)",
                "title": "ঐতিহ্যবাহী কুমোরের তৈরি পোড়ামাটির মাটির প্রদীপ",
                "description": "খাঁটি পলিমাটি দিয়ে কুমোরদের হাতে তৈরি পরিবেশবান্ধব মাটির প্রদীপ। কাঠের চুল্লিতে পোড়ানো নিখুঁত কারুকাজ যা পূজা ও উৎসবের জন্য আদর্শ।",
                "material": "প্রাকৃতিক পলিমাটি",
                "craft_details": "হাতে গড়া ও চুল্লিতে পোড়ানো।",
                "ai_rationale": "খাঁটি মাটির তৈরি কারিগরি প্রদীপের ন্যায্য মূল্য।"
            },
            "tags": ["Terracotta", "HandmadeDiya", "Pottery", "FestiveDecor"],
            "search_keywords": ["terracotta diya", "clay lamp", "oil lamp", "handmade pottery"],
            "suggested_min_price": 150,
            "suggested_max_price": 380
        },
        "pottery_pot": {
            "category_slug": "pottery-ceramics",
            "category_name": "Pottery & Terracotta",
            "visual_analysis": {
                "product_type": "Traditional Earthen Clay Pot / Matka",
                "primary_material": "Alluvial River Clay",
                "secondary_materials": "Natural Ochre Slip",
                "craft_style": "Wheel Throwing & Paddle Beating",
                "construction_method": "Hand-thrown and paddle-shaped",
                "shape_and_scale": "Domestic storage / cooling vessel",
                "craftsmanship_level": "moderate",
                "complexity_score": 45,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Natural porous river clay for natural water cooling",
                "Manual wheel-thrown spherical symmetry",
                "Wood kiln low-fire craftsmanship",
                "Traditional domestic utility"
            ],
            "price_available": True,
            "price_confidence": 0.86,
            "complexity_score": 45,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Handmade Earthen Clay Matka / Pot",
                "title": "Traditional Hand-Thrown Earthen Terracotta Pot",
                "description": "Skillfully thrown on a manual potter's wheel using natural porous river clay. Naturally breathable and wood-kiln fired, perfect for authentic domestic storage and rustic decor.",
                "material": "Natural Alluvial River Clay",
                "craft_details": "Hand-thrown and paddle-beaten on traditional wheel.",
                "ai_rationale": "Estimated for an earthen clay matka vessel based on clay quality, wheel shaping, and kiln firing."
            },
            "hi": {
                "name": "हस्तनिर्मित मिट्टी का मटका / हांडी",
                "title": "पारंपरिक कुम्हार के चाक पर बना मिट्टी का मटका",
                "description": "प्राकृतिक छिद्रयुक्त चिकनी मिट्टी से बना प्रामाणिक मटका। जल को स्वाभाविक रूप से शीतल रखता है।",
                "material": "प्राकृतिक चिकनी मिट्टी",
                "craft_details": "चाक पर गढ़ा और हाथ से थापा गया।",
                "ai_rationale": "चाक पर बने पारंपरिक मिट्टी के घड़े के लिए उचित मूल्य।"
            },
            "bn": {
                "name": "হাতে তৈরি মাটির কলসি / হাঁড়ি",
                "title": "ঐতিহ্যবাহী চাকে তৈরি পোড়ামাটির কলসি",
                "description": "প্রাকৃতিক মাটির তৈরি ঐতিহ্যবাহী কলসি। জল ঠান্ডা ও স্বাস্থ্যকর রাখতে প্রাচীন হস্তশিল্প নিদর্শন।",
                "material": "প্রাকৃতিক পলিমাটি",
                "craft_details": "চাকে তৈরি ও পিটিয়ে গোল করা।",
                "ai_rationale": "ঐতিহ্যবাহী মাটির কলসির জন্য উপযুক্ত বাজার দর।"
            },
            "tags": ["ClayPot", "Matka", "HandmadePottery", "Earthenware"],
            "search_keywords": ["clay pot", "matka", "terracotta handi", "handmade pottery"],
            "suggested_min_price": 250,
            "suggested_max_price": 600
        },
        "pottery": {
            "category_slug": "pottery-ceramics",
            "category_name": "Pottery & Terracotta",
            "visual_analysis": {
                "product_type": "Earthen Terracotta Table Vase / Vessel",
                "primary_material": "Alluvial River Clay",
                "secondary_materials": "Natural Ochre Slip Pigment",
                "craft_style": "Potter Wheel Throwing & Wood Kiln Firing",
                "construction_method": "Hand-thrown on manual potter's wheel",
                "shape_and_scale": "Medium tabletop decorative vessel",
                "craftsmanship_level": "moderate",
                "complexity_score": 42,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Locally harvested alluvial river clay",
                "Hand-thrown symmetric wheel craftsmanship",
                "Traditional wood-kiln open firing",
                "Tabletop domestic display scale"
            ],
            "price_available": True,
            "price_confidence": 0.87,
            "complexity_score": 42,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Handmade Terracotta Decorative Floral Vase",
                "title": "Artisanal Hand-Thrown Terracotta Table Vase",
                "description": "Exquisitely shaped on a traditional manual potter's wheel using pure alluvial river clay. Fired in an open-air wood kiln, giving it authentic earthy hues and natural textures.",
                "material": "Natural River Clay, Ochre Pigment",
                "craft_details": "Hand-thrown on potter wheel and wood-kiln fired.",
                "ai_rationale": "Estimated for a hand-thrown terracotta table vase based on wheel symmetry, natural clay material, and kiln firing."
            },
            "hi": {
                "name": "हस्तनिर्मित टेराकोटा मिट्टी का फूलदान",
                "title": "कुम्हार के चाक पर बना हस्तनिर्मित मिट्टी का सुंदर फूलदान",
                "description": "शुद्ध प्राकृतिक चिकनी मिट्टी से कुम्हार के चाक पर गढ़ा गया फूलदान। प्राकृतिक भट्टी में पकाया गया।",
                "material": "प्राकृतिक नदी की मिट्टी, गेरू",
                "craft_details": "पारंपरिक चाक पर हस्तनिर्मित एवं भट्टी में पकाया गया।",
                "ai_rationale": "चाक पर हस्तनिर्मित मिट्टी के फूलदान के लिए संतुलित मूल्य।"
            },
            "bn": {
                "name": "হাতে তৈরি পোড়ামাটির সুদৃশ্য ফুলদানি",
                "title": "ঐতিহ্যবাহী কুমোরের চাকে তৈরি পোড়ামাটির অপূর্ব ফুলদানি",
                "description": "পলিমাটি দিয়ে চাকে তৈরি ও কাঠের চুল্লিতে পোড়ানো নিখুঁত টেরাকোটা ফুলদানি।",
                "material": "প্রাকৃতিক পলিমাটি",
                "craft_details": "চাকে তৈরি ও খোলামাঠে পোড়ানো।",
                "ai_rationale": "চাকে তৈরি পোড়ামাটির অপূর্ব ফুলদানির ন্যায্য দাম।"
            },
            "tags": ["Terracotta", "Handmade", "Pottery", "HomeDecor"],
            "search_keywords": ["terracotta vase", "clay pot", "handmade pottery"],
            "suggested_min_price": 450,
            "suggested_max_price": 850
        },
        "metal": {
            "category_slug": "metal-brass",
            "category_name": "Dhokra & Metal Craft",
            "visual_analysis": {
                "product_type": "Dhokra Lost-Wax Cast Brass Tribal Sculpture",
                "primary_material": "Cast Non-Ferrous Brass / Bell Metal",
                "secondary_materials": "Beeswax Channel Matrix & Clay Mold Core",
                "craft_style": "Dhokra Lost-Wax Hollow Casting",
                "construction_method": "Clay core wrapping with beeswax threads and furnace casting",
                "shape_and_scale": "Figurative metal craft sculpture",
                "craftsmanship_level": "detailed",
                "complexity_score": 80,
                "labor_intensity": "high"
            },
            "price_factors": [
                "Ancestral lost-wax casting technique",
                "Non-ferrous brass alloy raw material weight",
                "Intricate manual wax-wire coil detailing",
                "High furnace fuel and multi-day foundry labor"
            ],
            "price_available": True,
            "price_confidence": 0.90,
            "complexity_score": 80,
            "craftsmanship_level": "detailed",
            "en": {
                "name": "Handcrafted Dhokra Brass Tribal Art Sculpture",
                "title": "Ancient Lost-Wax Cast Bell Metal Figurine",
                "description": "Handcrafted using the ancient Dhokra lost-wax casting technique. Every piece is hand-cast in non-ferrous brass with an antique rustic patina.",
                "material": "Brass Alloy, Beeswax, Clay Mold",
                "craft_details": "Ancestral lost-wax hollow-casting process.",
                "ai_rationale": "Estimated for an ancient lost-wax cast brass sculpture reflecting metal alloy weight, manual wax coil modeling, and multi-stage foundry labor."
            },
            "hi": {
                "name": "हस्तनिर्मित ढोकरा पीतल जनजातीय मूर्ति",
                "title": "प्राचीन लॉस्ट-वैक्स पद्धति से निर्मित ढोकरा पीतल कलाकृति",
                "description": "हजारों वर्ष पुरानी ढोकरा धातु ढलाई तकनीक से बनी अद्वितीय कलाकृति।",
                "material": "पीतल और कांस्य मिश्र धातु",
                "craft_details": "मोम के सांचे में पारंपरिक भट्टी में ढलाई।",
                "ai_rationale": "ढोकरा धातु ढलाई और बारीक मोम धागों के श्रम पर आधारित मूल्य।"
            },
            "bn": {
                "name": "হাতে তৈরি ঢোকরা পিতলের আদিবাসী ভাস্কর্য",
                "title": "লস্ট-ওয়াক্স পদ্ধতিতে তৈরি ঢোকরা ব্রাস শিল্পকর্ম",
                "description": "লস্ট-ওয়াক্স মোম ঢালাই পদ্ধতিতে তৈরি পিতল ও কাঁসার অপূর্ব কারুকাজ।",
                "material": "পিতল, কাঁসা",
                "craft_details": "মোমের ছাঁচে তৈরি ও কাদা মাটির খোলে খাঁটি ধাতুর মিশ্রণে ঢালাই।",
                "ai_rationale": "পিতলের ধাতু ও জটিল মোম ঢালাইয়ের শ্রমের উপযুক্ত মূল্য।"
            },
            "tags": ["Dhokra", "BrassCraft", "LostWax", "TribalArt"],
            "search_keywords": ["dhokra brass", "tribal sculpture", "metal decor"],
            "suggested_min_price": 1200,
            "suggested_max_price": 2800
        },
        "handloom": {
            "category_slug": "handloom-textiles",
            "category_name": "Handloom & Textiles",
            "visual_analysis": {
                "product_type": "Handwoven Artisan Textile Saree / Stole",
                "primary_material": "Natural Woven Yarns (Cotton / Mulberry Silk)",
                "secondary_materials": "Zari / Metallic Thread Accents",
                "craft_style": "Traditional Pit-Loom / Shuttle Handloom Weaving",
                "construction_method": "Interlaced warp and weft with supplementary weft patterning",
                "shape_and_scale": "Full-length wearable textile drape",
                "craftsmanship_level": "detailed",
                "complexity_score": 72,
                "labor_intensity": "high"
            },
            "price_factors": [
                "Hand-interlaced natural fiber threads",
                "Supplementary weft border and motif patterning",
                "Multi-day continuous shuttle loom weaving",
                "Heirloom wearable drape scale"
            ],
            "price_available": True,
            "price_confidence": 0.88,
            "complexity_score": 72,
            "craftsmanship_level": "detailed",
            "en": {
                "name": "Handcrafted Traditional Handloom Textile Stole",
                "title": "Artisanal Handwoven Natural Fiber Wrap",
                "description": "Hand-embroidered and woven by rural artisans on traditional looms. Made with breathable natural fibers and traditional motifs.",
                "material": "Natural Handloom Cotton / Silk",
                "craft_details": "Intricate hand-loom weaving and needle embroidery.",
                "ai_rationale": "Estimated for a handwoven traditional textile based on natural yarn density, intricate border weaving, and multi-day weaver labor."
            },
            "hi": {
                "name": "हस्तनिर्मित पारंपरिक हथकरघा स्टोल",
                "title": "पारंपरिक हथकरघे पर बुना हुआ सुंदर दुपट्टा",
                "description": "ग्रामीण बुनकरों द्वारा पारंपरिक खड्डी पर बुना गया सूती/रेशमी स्टोल।",
                "material": "हथकरघा सूती / सिल्क धागा",
                "craft_details": "पारंपरिक हथकरघा बुनाई।",
                "ai_rationale": "हथकरघा बुनाई और प्राकृतिक धागों के आधार पर अनुशंसित मूल्य।"
            },
            "bn": {
                "name": "হাতে বোনা তাঁতের সুদৃশ্য ওড়না",
                "title": "ঐতিহ্যবাহী হস্তচালিত তাঁতে বোনা প্রাকৃতিক স্টোল",
                "description": "বাংলার দক্ষ তাঁতিদের হাতে বোনা আরামদায়ক ও টেকসই তাঁতের কাজ।",
                "material": "খাঁটি তাঁতের সুতো",
                "craft_details": "হস্তচালিত তাঁতে নিখুঁত বুনন।",
                "ai_rationale": "খাঁটি তাঁতের সুতো ও নিপুণ বুননের উপযুক্ত বাজার দর।"
            },
            "tags": ["Handloom", "Textile", "ArtisanWeave"],
            "search_keywords": ["handloom stole", "cotton scarf", "artisan textile"],
            "suggested_min_price": 950,
            "suggested_max_price": 1950
        },
        "bamboo": {
            "category_slug": "bamboo-cane",
            "category_name": "Bamboo & Cane Craft",
            "visual_analysis": {
                "product_type": "Handcrafted Bamboo & Cane Woven Basketry",
                "primary_material": "Natural Matured Bamboo Slats & Cane",
                "secondary_materials": "Natural Plant Binding Fiber",
                "craft_style": "Traditional Basketry Splint Weaving",
                "construction_method": "Hand-split bamboo splints woven in twill pattern",
                "shape_and_scale": "Utility storage and domestic vessel",
                "craftsmanship_level": "moderate",
                "complexity_score": 40,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Sustainable mature bamboo timber",
                "Hand-split uniform slat weaving",
                "Lightweight structural utility and flexibility",
                "Artisan hand plaited rim"
            ],
            "price_available": True,
            "price_confidence": 0.83,
            "complexity_score": 40,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Handcrafted Bamboo & Cane Woven Basket",
                "title": "Natural Organic Handwoven Bamboo Storage Basket",
                "description": "Handwoven from untreated, sustainable mature bamboo strips. Eco-friendly, lightweight, and sturdy for household utility and decor.",
                "material": "Natural Seasoned Bamboo & Cane",
                "craft_details": "Hand-split bamboo splints woven in traditional twill patterns.",
                "ai_rationale": "Estimated for a handwoven sustainable bamboo utility craft based on slat uniformity and artisan plaiting."
            },
            "hi": {
                "name": "हस्तनिर्मित बांस की डलिया / टोकरी",
                "title": "प्राकृतिक बांस से बनी हस्तनिर्मित सुंदर टोकरी",
                "description": "मजबूत और पर्यावरण-अनुकूल बांस की पट्टियों से हाथ द्वारा बुनी गई टोकरी।",
                "material": "प्राकृतिक बांस",
                "craft_details": "हाथ से छीलकर पारंपरिक बुनाई।",
                "ai_rationale": "पर्यावरण अनुकूल बांस शिल्प के लिए निष्पक्ष मूल्य।"
            },
            "bn": {
                "name": "হাতে বোনা বাঁশের ঝুড়ি",
                "title": "প্রাকৃতিক পাকা বাঁশে তৈরি হস্তশিল্পের ঝুড়ি",
                "description": "পরিবেশবান্ধব ও টেকসই বাঁশের চটা দিয়ে হাতে বোনা নিত্যব্যবহার্য ঝুড়ি।",
                "material": "প্রাকৃতিক বাঁশ ও বেত",
                "craft_details": "হাতে কাটা বাঁশের ছিলকা দিয়ে বুনন।",
                "ai_rationale": "টেকসই পাকা বাঁশের হস্তশিল্পের উপযুক্ত দাম।"
            },
            "tags": ["BambooCraft", "EcoFriendly", "Handwoven"],
            "search_keywords": ["bamboo basket", "cane craft", "eco decor"],
            "suggested_min_price": 350,
            "suggested_max_price": 750
        },
        "jewelry": {
            "category_slug": "jewelry",
            "category_name": "Handcrafted Jewelry",
            "visual_analysis": {
                "product_type": "Handcrafted Artisan Beaded Necklace / Ornament",
                "primary_material": "Terracotta Beads & Brass Accents",
                "secondary_materials": "Braided Cotton Thread Cord",
                "craft_style": "Handmade Clay Bead Modeling & Stringing",
                "construction_method": "Hand-rolled fired terracotta beads hand-threaded on cord",
                "shape_and_scale": "Personal wearable accessory",
                "craftsmanship_level": "moderate",
                "complexity_score": 48,
                "labor_intensity": "moderate"
            },
            "price_factors": [
                "Hand-molded and fired terracotta beads",
                "Non-ferrous metal spacer accents",
                "Adjustable braided thread assembly",
                "Wearable personal artisan adornment"
            ],
            "price_available": True,
            "price_confidence": 0.85,
            "complexity_score": 48,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Handcrafted Artisan Beaded Necklace Piece",
                "title": "Artisanal Traditional Handcrafted Jewelry Accessory",
                "description": "Individually handcrafted by master jewelers using terracotta beads, metal accents, and natural cord.",
                "material": "Terracotta Beads, Metal Accents, Thread",
                "craft_details": "Hand-molded beads hand-strung on adjustable braided cord.",
                "ai_rationale": "Estimated for handcrafted artisan jewelry based on individual clay bead molding, metal detailing, and threadwork."
            },
            "hi": {
                "name": "हस्तनिर्मित पारंपरिक आभूषण",
                "title": "कारीगरों द्वारा हाथ से तैयार सुंदर आभूषण",
                "description": "पारंपरिक मोतियों और धातु से बना हस्तनिर्मित आभूषण।",
                "material": "टेराकोटा मोती, धातु",
                "craft_details": "हाथ से पिरोया हुआ।",
                "ai_rationale": "मिट्टी के मोतियों और बारीक कारीगरी पर आधारित मूल्य।"
            },
            "bn": {
                "name": "হাতে তৈরি ঐতিহ্যবাহী গহনা",
                "title": "কারিগরি নৈপুণ্যে তৈরি সুদৃশ্য অলঙ্কার",
                "description": "মাটির পুঁতি ও মেটালের অপূর্ব সংমিশ্রণে হাতে তৈরি গহনা।",
                "material": "টেরাকোটা পুঁতি, সুতো",
                "craft_details": "হাতে গাঁথা ও ডিজাইন করা।",
                "ai_rationale": "হাতে গড়া টেরাকোটা পুঁতি ও মেটালের অলঙ্কারের জন্য সঠিক দর।"
            },
            "tags": ["HandmadeJewelry", "ArtisanBeads", "TribalJewelry"],
            "search_keywords": ["handmade necklace", "terracotta jewelry", "artisan jewelry"],
            "suggested_min_price": 400,
            "suggested_max_price": 950
        },
        "folk_art": {
            "category_slug": "folk-art",
            "category_name": "Folk Art & Paintings",
            "visual_analysis": {
                "product_type": "Handpainted Traditional Folk Art Painting",
                "primary_material": "Handmade Acid-Free Paper / Cotton Canvas",
                "secondary_materials": "Natural Mineral and Plant Pigments",
                "craft_style": "Traditional Freehand Folk Art Motifs",
                "construction_method": "Freehand bamboo nib line-drawing and brush tinting",
                "shape_and_scale": "Flat framable artwork surface",
                "craftsmanship_level": "detailed",
                "complexity_score": 75,
                "labor_intensity": "high"
            },
            "price_factors": [
                "Handmade archival paper base",
                "Intricate freehand geometric line work",
                "Traditional cultural motif composition",
                "High manual drawing and color filling hours"
            ],
            "price_available": True,
            "price_confidence": 0.89,
            "complexity_score": 75,
            "craftsmanship_level": "detailed",
            "en": {
                "name": "Handpainted Traditional Folk Art Painting",
                "title": "Authentic Hand-Drawn Traditional Folk Art on Paper",
                "description": "Handpainted by traditional folk artists using natural pigments and fine brushes. Depicts cultural heritage motifs and nature.",
                "material": "Handmade Paper / Canvas, Natural Pigments",
                "craft_details": "Intricate freehand line-work executed with traditional brush techniques.",
                "ai_rationale": "Estimated for an authentic hand-drawn folk art painting reflecting paper craftsmanship, fine line detail, and artist painting time."
            },
            "hi": {
                "name": "हस्तनिर्मित पारंपरिक लोक कला पेंटिंग",
                "title": "हाथ से बने कागज पर बनाई गई सुंदर लोक कला पेंटिंग",
                "description": "पारंपरिक रंगों और बारीक ब्रश से हाथ से चित्रित कलाकृति।",
                "material": "हाथ से बना कागज, प्राकृतिक रंग",
                "craft_details": "बारीक हाथ की नक्काशी व रेखांकन।",
                "ai_rationale": "बारीक रेखांकन और पारंपरिक हस्तनिर्मित कला के आधार पर मूल्य।"
            },
            "bn": {
                "name": "হাতে আঁকা ঐতিহ্যবাহী লোকশিল্প চিত্রকর্ম",
                "title": "দেশীয় কাগজে প্রাকৃতিক রঙে আঁকা লোকশিল্প",
                "description": "নিপুণ হাতে তুলির ছোঁয়ায় আঁকা ঐতিহ্যবাহী ভারতীয় লোকশিল্প।",
                "material": "হাতে তৈরি কাগজ, প্রাকৃতিক রঙ",
                "craft_details": "সম্পূর্ণ হাত দিয়ে সূক্ষ্ম রেখাঙ্কনে তৈরি।",
                "ai_rationale": "হাতে আঁকা সূক্ষ্ম রেখাচিত্র ও লোকশিল্পের উপযুক্ত দাম।"
            },
            "tags": ["FolkArt", "Handpainted", "WallArt"],
            "search_keywords": ["folk painting", "handmade wall art", "traditional art"],
            "suggested_min_price": 900,
            "suggested_max_price": 2200
        },
        "unknown": {
            "category_slug": "pottery-ceramics",
            "category_name": "Handmade Crafts",
            "visual_analysis": {
                "product_type": "Handcrafted Artisan Product",
                "primary_material": "Natural craft material (Unverified)",
                "secondary_materials": "Unverified",
                "craft_style": "Artisan Handcrafting",
                "construction_method": "Handcrafted",
                "shape_and_scale": "Scale not confidently determined from image",
                "craftsmanship_level": "moderate",
                "complexity_score": 30,
                "labor_intensity": "unknown"
            },
            "price_factors": [],
            "price_available": False,
            "price_confidence": 0.0,
            "complexity_score": 30,
            "craftsmanship_level": "moderate",
            "en": {
                "name": "Handcrafted Artisan Product",
                "title": "Authentic Handcrafted Artisan Item",
                "description": "Authentic handcrafted creation lovingly made by local artisans. Review and customize this title and description with details of your unique craft.",
                "material": "Natural artisan materials",
                "craft_details": "Traditional handcrafting by master artisan.",
                "ai_rationale": "AI price recommendation unavailable for this photograph. Please set your selling price directly based on your materials and labor."
            },
            "hi": {
                "name": "हस्तनिर्मित कारीगर उत्पाद",
                "title": "प्रामाणिक हस्तनिर्मित कलाकृति",
                "description": "स्थानीय कारीगरों द्वारा प्रेमपूर्वक बनाई गई प्रामाणिक हस्तनिर्मित कृति। कृपया अपने शिल्प के अनुसार विवरण की जांच करें।",
                "material": "प्राकृतिक सामग्री",
                "craft_details": "पारंपरिक कारीगरी तकनीक।",
                "ai_rationale": "इस तस्वीर के लिए AI मूल्य अनुमान उपलब्ध नहीं है। कृपया अपनी सामग्री और श्रम के आधार पर अपना विक्रय मूल्य सीधे दर्ज करें।"
            },
            "bn": {
                "name": "হাতে তৈরি ঐতিহ্যবাহী শিল্পকর্ম",
                "title": "প্রামাণিক হস্তনির্মিত অনন্য নিদর্শন",
                "description": "স্থানীয় শিল্পীদের দ্বারা তৈরি প্রামাণিক হস্তশিল্প। আপনার পছন্দমতো পণ্যের বিবরণ পরিবর্তন করে নিতে পারেন।",
                "material": "প্রাকৃতিক কাঁচামাল",
                "craft_details": "ঐতিহ্যবাহী হস্তশিল্প পদ্ধতি।",
                "ai_rationale": "এই ছবির জন্য এআই মূল্য নির্ধারণ সম্ভব নয়। অনুগ্রহ করে আপনার উপাদান ও শ্রমের ভিত্তিতে আপনার বিক্রয় মূল্য সরাসরি নির্ধারণ করুন।"
            },
            "tags": ["Handmade", "Traditional", "ArtisanCraft"],
            "search_keywords": ["handmade craft", "artisan product"],
            "suggested_min_price": None,
            "suggested_max_price": None
        }
    }

    craft = catalogs.get(domain, catalogs["unknown"])
    lang_content = craft.get(language, craft["en"])
    va = craft.get("visual_analysis", {})

    has_seller_costs = bool(
        seller_costs
        and (
            float(seller_costs.get("material_cost") or 0)
            + float(seller_costs.get("labor_cost") or 0)
            + float(seller_costs.get("other_cost") or 0)
        ) > 0
    )

    if domain != "unknown" or has_seller_costs:
        # LEVEL 3: Deterministic local pricing calculation based on domain and visual attributes
        pricing = calculate_artisan_price(
            category_slug=craft["category_slug"],
            product_name=lang_content["name"],
            product_type=va.get("product_type"),
            material=lang_content["material"],
            craftsmanship_level=craft.get("craftsmanship_level", "detailed"),
            complexity_score=craft.get("complexity_score", 50),
            shape_and_scale=va.get("shape_and_scale", "tabletop"),
            labor_intensity=va.get("labor_intensity", "moderate"),
            seller_costs=seller_costs,
            user_hint=hint
        )
        has_price = True
        suggested_min = pricing["suggested_min_price"]
        suggested_max = pricing["suggested_max_price"]
        price_conf = pricing["price_confidence"]
        price_src = pricing["price_source"]
        price_factors = pricing["price_factors"]
        price_reason = pricing["price_reason"]
        ai_rationale = pricing["ai_rationale"]
    else:
        # LEVEL 4: Indeterminate state (no valid craft identifiable, blank/corrupt image)
        has_price = False
        suggested_min = None
        suggested_max = None
        price_conf = 0.0
        price_src = "none"
        price_factors = []
        price_reason = lang_content["ai_rationale"]
        ai_rationale = lang_content["ai_rationale"]

    # Adapt title, name, and description if artisan provided a specific hint
    final_name = lang_content["name"]
    final_title = lang_content["title"]
    final_description = lang_content["description"]
    
    if hint and len(hint.strip()) >= 3:
        clean_hint = hint.strip()
        clean_hint_title = " ".join(w.capitalize() for w in clean_hint.split())
        if len(clean_hint.split()) >= 2:
            final_title = clean_hint_title
            final_name = clean_hint_title
        elif not any(w.lower() in final_title.lower() for w in clean_hint.split()):
            final_title = f"{clean_hint_title} - {lang_content['title']}"

    return {
        "name": final_name,
        "title": final_title,
        "description": final_description,
        "category_slug": craft["category_slug"],
        "category_name": craft["category_name"],
        "material": lang_content["material"],
        "craft_details": lang_content["craft_details"],
        "tags": craft["tags"],
        "search_keywords": craft["search_keywords"],
        "price_available": has_price,
        "suggested_min_price": suggested_min,
        "suggested_max_price": suggested_max,
        "price_confidence": price_conf,
        "price_source": price_src,
        "price_factors": price_factors,
        "price_reason": price_reason,
        "ai_rationale": ai_rationale,
        "complexity_score": craft.get("complexity_score", 50),
        "craftsmanship_level": craft.get("craftsmanship_level", "detailed"),
        "labor_intensity": va.get("labor_intensity", "moderate"),
        "visual_analysis": va,
        "confidence": 0.85 if domain != "unknown" else 0.0,
        "engine": f"Artisan AI Knowledge Engine (Domain: {domain})"
    }

