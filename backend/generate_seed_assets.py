import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "frontend" / "static"
IMG_DIR = STATIC_DIR / "images"
AVATAR_DIR = IMG_DIR / "avatars"
PROD_DIR = IMG_DIR / "products"

AVATAR_DIR.mkdir(parents=True, exist_ok=True)
PROD_DIR.mkdir(parents=True, exist_ok=True)

def create_avatar(filename, name_initials, bg_color, accent_color):
    size = (300, 300)
    img = Image.new("RGB", size, color=bg_color)
    draw = ImageDraw.Draw(img)

    # Outer decorative ring
    draw.ellipse([20, 20, 280, 280], outline=accent_color, width=6)
    draw.ellipse([30, 30, 270, 270], fill=accent_color)
    draw.ellipse([45, 45, 255, 255], fill=bg_color)

    # Initials
    # Since default font is small, draw bold geometric letter representation
    draw.ellipse([80, 80, 220, 220], fill=accent_color)
    
    # Save
    img.save(AVATAR_DIR / filename, quality=95)

def create_craft_image(filename, title, subtitle, bg_gradient_start, bg_gradient_end, craft_shape_type, accent_color):
    width, height = 800, 800
    img = Image.new("RGB", (width, height), color=bg_gradient_start)
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(height):
        factor = y / height
        r = int(bg_gradient_start[0] * (1 - factor) + bg_gradient_end[0] * factor)
        g = int(bg_gradient_start[1] * (1 - factor) + bg_gradient_end[1] * factor)
        b = int(bg_gradient_start[2] * (1 - factor) + bg_gradient_end[2] * factor)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Soft studio backdrop spotlight
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.ellipse([150, 150, 650, 650], fill=(255, 255, 255, 30))
    ov_draw.ellipse([250, 250, 550, 550], fill=(255, 255, 255, 45))
    overlay = overlay.filter(ImageFilter.GaussianBlur(40))
    img.paste(overlay, (0, 0), overlay)

    draw = ImageDraw.Draw(img)

    # Draw Craft Artwork Representation
    if craft_shape_type == "vase":
        # Terracotta pot silhouette
        # Neck
        draw.rectangle([340, 240, 460, 280], fill=accent_color, outline=(140, 50, 20), width=4)
        draw.ellipse([320, 225, 480, 255], fill=(200, 80, 40), outline=(140, 50, 20), width=4)
        # Body
        draw.ellipse([260, 270, 540, 560], fill=accent_color, outline=(130, 40, 15), width=5)
        # Decorative etched rings
        draw.arc([290, 360, 510, 440], start=0, end=180, fill=(245, 200, 140), width=6)
        draw.arc([280, 410, 520, 490], start=0, end=180, fill=(245, 200, 140), width=6)
        # Pedestal base
        draw.rectangle([330, 540, 470, 575], fill=(160, 60, 25), outline=(130, 40, 15), width=4)

    elif craft_shape_type == "horse":
        # Bankura horse folk form
        # Tall stylized ears
        draw.polygon([(360, 180), (380, 260), (350, 260)], fill=accent_color)
        draw.polygon([(440, 180), (450, 260), (420, 260)], fill=accent_color)
        # Head & Arching Neck
        draw.polygon([(360, 250), (440, 250), (460, 380), (340, 380)], fill=accent_color)
        # Torso & Legs
        draw.rectangle([310, 380, 490, 500], fill=accent_color)
        draw.rectangle([320, 500, 360, 630], fill=accent_color)
        draw.rectangle([440, 500, 480, 630], fill=accent_color)
        # Folk rings
        draw.ellipse([375, 410, 425, 460], outline=(255, 220, 160), width=5)

    elif craft_shape_type == "folk_tree":
        # Madhubani Tree of Life
        # Trunk
        draw.rectangle([380, 360, 420, 580], fill=(100, 40, 20))
        # Sunburst canopy circles
        draw.ellipse([250, 200, 550, 500], outline=accent_color, width=5)
        draw.ellipse([290, 240, 510, 460], outline=(220, 60, 40), width=4)
        draw.ellipse([330, 280, 470, 420], fill=accent_color)
        # Birds & Lotus motifs
        draw.polygon([(260, 330), (220, 310), (240, 360)], fill=(30, 130, 70))
        draw.polygon([(540, 330), (580, 310), (560, 360)], fill=(30, 130, 70))

    elif craft_shape_type == "dhokra":
        # Antique brass bell metal tribal figurine
        draw.ellipse([370, 230, 430, 290], fill=accent_color, outline=(90, 70, 20), width=4)
        # Spiral tribal headdress
        draw.arc([350, 200, 450, 260], start=180, end=360, fill=(230, 180, 50), width=6)
        # Slender torso
        draw.rectangle([385, 290, 415, 420], fill=accent_color)
        # Arms holding rustic tribal dholak drum
        draw.ellipse([340, 370, 460, 430], fill=(160, 120, 40), outline=(80, 60, 20), width=4)
        # Legs
        draw.polygon([(385, 420), (360, 590), (380, 590)], fill=accent_color)
        draw.polygon([(415, 420), (440, 590), (420, 590)], fill=accent_color)

    elif craft_shape_type == "wood_top":
        # Channapatna spinning tops
        # Top 1 - Yellow & Red
        draw.ellipse([270, 350, 530, 470], fill=(240, 180, 20), outline=(180, 120, 10), width=4)
        draw.polygon([(270, 410), (530, 410), (400, 580)], fill=(210, 40, 30))
        # Spindle
        draw.rectangle([390, 240, 410, 350], fill=(230, 210, 170), outline=(120, 80, 30), width=3)
        draw.polygon([(390, 580), (410, 580), (400, 610)], fill=(80, 80, 80))

    # Badge overlay in top right
    draw.rectangle([540, 40, 760, 95], fill=(255, 255, 255, 230), outline=(220, 160, 100), width=2)

    # Frame border
    draw.rectangle([20, 20, width-20, height-20], outline=(230, 220, 210), width=3)

    img.save(PROD_DIR / filename, quality=94)

def generate_all():
    create_avatar("artisan1.png", "RK", (245, 235, 225), (185, 75, 40))
    create_avatar("artisan2.png", "MD", (250, 240, 230), (195, 55, 65))
    create_avatar("buyer1.png", "PS", (235, 245, 240), (40, 130, 95))

    create_craft_image("terracotta_vase.jpg", "Terracotta Vase", "Bishnupur Clay", 
                       (250, 242, 235), (230, 215, 200), "vase", (195, 78, 38))
    
    create_craft_image("bankura_horse.jpg", "Bankura Horse", "Bengal Folk Craft", 
                       (248, 238, 228), (225, 205, 190), "horse", (178, 68, 32))

    create_craft_image("madhubani_tree.jpg", "Tree of Life", "Mithila Folk Painting", 
                       (252, 248, 238), (235, 225, 205), "folk_tree", (205, 140, 30))

    create_craft_image("dhokra_musician.jpg", "Dhokra Musician", "Ancient Lost-Wax Brass", 
                       (245, 242, 232), (220, 215, 195), "dhokra", (185, 145, 45))

    create_craft_image("wooden_top.jpg", "Channapatna Tops", "Natural Lacquer Toy", 
                       (250, 245, 238), (230, 220, 210), "wood_top", (225, 70, 40))

    print("Generated all seed craft images and avatars successfully!")

if __name__ == "__main__":
    generate_all()
