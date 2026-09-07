import sqlite3
import json
import hashlib
import os
from datetime import datetime
from backend.config import DB_PATH

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = os.urandom(16).hex()
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return pwd_hash, salt

def verify_password(password: str, pwd_hash: str, salt: str) -> bool:
    expected_hash, _ = hash_password(password, salt)
    return expected_hash == pwd_hash

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('seller', 'buyer', 'admin')),
        phone TEXT,
        avatar_url TEXT,
        language TEXT DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seller_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        craft_specialization TEXT NOT NULL,
        location TEXT NOT NULL,
        story_bio TEXT,
        badge TEXT DEFAULT 'Verified Artisan',
        rating REAL DEFAULT 4.9,
        total_sales INTEGER DEFAULT 0,
        earnings REAL DEFAULT 0.0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS buyer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        default_address_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        name_bn TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        material TEXT,
        craft_details TEXT,
        tags TEXT, -- JSON array of tags
        price REAL NOT NULL,
        original_price REAL,
        quantity INTEGER NOT NULL DEFAULT 1,
        is_available INTEGER DEFAULT 1,
        original_image_url TEXT NOT NULL,
        enhanced_image_url TEXT,
        ai_generated_meta TEXT, -- JSON
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        buyer_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'order_placed' CHECK(status IN ('order_placed', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
        delivery_address_json TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        product_name TEXT NOT NULL,
        product_image TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        is_read INTEGER DEFAULT 0,
        related_order_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'read', 'replied', 'closed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    seed_initial_data(conn)
    conn.close()

def seed_initial_data(conn):
    cursor = conn.cursor()
    
    # Check if categories exist
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        categories = [
            ("pottery-ceramics", "Pottery & Terracotta", "मिट्टी के बर्तन और टेराकोटा", "মাটির পাত্র ও পোড়ামাটি", "fa-jar", "Handmade clay items, pots, vessels and decorative earthen crafts"),
            ("handloom-textiles", "Handloom & Textiles", "हथकरघा और वस्त्र", "হস্তচালিত তাঁত ও বস্ত্র", "fa-scroll", "Traditional hand-woven shawls, sarees, kurtas, and tapestries"),
            ("woodcraft", "Woodcraft & Toys", "काष्ठ शिल्प और खिलौने", "কাঠের কাজ ও খেলনা", "fa-tree", "Hand-carved wooden sculptures, boxes, and safe eco toys"),
            ("metal-brass", "Dhokra & Metal Craft", "ढोकरा और धातु शिल्प", "ঢোকরা ও ধাতব শিল্প", "fa-hammer", "Lost-wax brass castings, bell metal artifacts, and copper craft"),
            ("folk-art", "Folk Art & Paintings", "लोक कला और चित्रकला", "লোকশিল্প ও চিত্রকলা", "fa-palette", "Madhubani, Pattachitra, Warli, and tribal paintings on handmade paper"),
            ("jewelry", "Handcrafted Jewelry", "हस्तनिर्मित आभूषण", "হাতে তৈরি গহনা", "fa-gem", "Terracotta, jute, beadwork, and traditional tribal jewelry"),
            ("bamboo-cane", "Bamboo & Cane Craft", "बांस और बेंत शिल्प", "বাঁশ ও বেতের কাজ", "fa-basket-shopping", "Eco-friendly baskets, lamps, mats, and sustainable utility crafts")
        ]
        cursor.executemany("""
            INSERT INTO categories (slug, name_en, name_hi, name_bn, icon, description)
            VALUES (?, ?, ?, ?, ?, ?)
        """, categories)
        conn.commit()

    # Check if sample users exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Default password for all seed users: "artisan123"
        pwd_hash, salt = hash_password("artisan123")

        # 1. Master Artisan Ramesh (Seller)
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, salt, role, phone, avatar_url, language)
            VALUES (?, ?, ?, ?, 'seller', ?, ?, 'hi')
        """, ("Ramesh Kumbhakar", "ramesh@kalasetu.ai", pwd_hash, salt, "+91 98310 12345", "/static/images/avatars/artisan1.png"))
        seller1_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO seller_profiles (user_id, craft_specialization, location, story_bio, badge, rating, total_sales, earnings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (seller1_id, "Terracotta & Earthen Pottery", "Bishnupur, Bankura, West Bengal", 
              "Carrying forward 4 generations of sacred Bankura horse and terracotta vase crafting traditions with naturally sourced river clay.",
              "Master Craftsman", 4.95, 48, 42600.0))

        # 2. Artisan Meera Devi (Seller)
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, salt, role, phone, avatar_url, language)
            VALUES (?, ?, ?, ?, 'seller', ?, ?, 'hi')
        """, ("Meera Devi", "meera@kalasetu.ai", pwd_hash, salt, "+91 98450 67890", "/static/images/avatars/artisan2.png"))
        seller2_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO seller_profiles (user_id, craft_specialization, location, story_bio, badge, rating, total_sales, earnings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (seller2_id, "Mithila Madhubani Folk Art", "Madhubani, Bihar", 
              "Practicing traditional Kohbar and floral Madhubani paintings using natural mineral and vegetable pigments on handmade cotton paper.",
              "State Awardee", 4.9, 32, 28500.0))

        # 3. Sample Buyer (Customer)
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, salt, role, phone, avatar_url, language)
            VALUES (?, ?, ?, ?, 'buyer', ?, ?, 'en')
        """, ("Priya Sharma", "priya@buyer.in", pwd_hash, salt, "+91 98765 43210", "/static/images/avatars/buyer1.png"))
        buyer_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO buyer_profiles (user_id) VALUES (?)
        """, (buyer_id,))

        # Add initial address for sample buyer
        cursor.execute("""
            INSERT INTO addresses (user_id, full_name, phone, street, city, state, pincode, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (buyer_id, "Priya Sharma", "+91 98765 43210", "Flat 402, Green Glen Residency, Outer Ring Road", "Bengaluru", "Karnataka", "560103"))
        addr_id = cursor.lastrowid
        cursor.execute("UPDATE buyer_profiles SET default_address_id = ? WHERE user_id = ?", (addr_id, buyer_id))

        # Seed initial authentic handcrafted products
        products_seed = [
            (
                seller1_id,
                "Handcrafted Terracotta Decorative Vase",
                "Traditional Bishnupur Red Clay Floral Vase",
                "Meticulously sculpted by hand on a wooden potter wheel using all-natural Ganga alluvial clay. Sun-baked and fired in a wood kiln for its deep earthy reddish-ochre finish. Ideal for dry flowers, center tables, and festive decor.",
                1, # Pottery
                "Terracotta Clay, Natural Mineral Wash",
                "Wheel thrown and hand-carved floral relief by 4th generation Bankura artisans.",
                json.dumps(["Terracotta", "Handmade", "Pottery", "Home Decor", "Eco-Friendly", "Artisan"]),
                799.0, 999.0, 15, 1,
                "/static/images/products/terracotta_vase.jpg",
                "/static/images/products/terracotta_vase.jpg",
                json.dumps({"ai_enhanced": True, "lighting": "Studio Warm", "sharpness": "High", "suggested_min": 650, "suggested_max": 950})
            ),
            (
                seller1_id,
                "Traditional Bankura Terracotta Horse Pair",
                "Sacred Folk Bankura Terracotta Horses (Pair of 2)",
                "The world-renowned symbol of Bengal folk craftsmanship. Features tall pointed ears and graceful symmetrical hollow-body design with sacred geometric markings.",
                1, # Pottery
                "Purified River Bed Clay",
                "Hand-molded separate hollow cylinders joined seamlessly before kiln-firing.",
                json.dumps(["Bankura Horse", "Folk Art", "Clay Craft", "Collectible", "Heritage"]),
                1250.0, 1500.0, 8, 1,
                "/static/images/products/bankura_horse.jpg",
                "/static/images/products/bankura_horse.jpg",
                json.dumps({"ai_enhanced": True, "lighting": "Earthy Studio", "sharpness": "High", "suggested_min": 1100, "suggested_max": 1450})
            ),
            (
                seller2_id,
                "Handpainted Madhubani Tree of Life",
                "Original Madhubani Folk Art on Handmade Paper",
                "Celebrates harmony of birds, leaves, and sacred nature motifs in Kachni and Bharni style. Handpainted with bamboo nibs and squirrel-hair brushes using organic vegetable dyes.",
                5, # Folk Art
                "Handmade Rice Paper, Natural Plant Pigments",
                "Authentic Mithila Kohbar style painted by women artisans in rural Bihar.",
                json.dumps(["Madhubani", "Folk Painting", "Wall Decor", "Handmade Paper", "Traditional Art"]),
                1850.0, 2200.0, 5, 1,
                "/static/images/products/madhubani_tree.jpg",
                "/static/images/products/madhubani_tree.jpg",
                json.dumps({"ai_enhanced": True, "lighting": "Art Gallery Neutral", "sharpness": "Maximum", "suggested_min": 1600, "suggested_max": 2400})
            ),
            (
                seller2_id,
                "Dhokra Brass Tribal Musician Figurine",
                "Ancient Lost-Wax Cast Bell Metal Figurine",
                "4000-year-old Harappan lost-wax casting technique (Dhokra). Depicts a tribal dholak musician with rustic patina and ornate wire-work details.",
                4, # Metal & Brass
                "Brass, Bell Metal, Beeswax Core",
                "Individually cast using ancient non-ferrous lost-wax metal smelting in clay molds.",
                json.dumps(["Dhokra", "Brass Craft", "Tribal Art", "Sculpture", "Antique Finish"]),
                1499.0, 1899.0, 6, 1,
                "/static/images/products/dhokra_musician.jpg",
                "/static/images/products/dhokra_musician.jpg",
                json.dumps({"ai_enhanced": True, "lighting": "Warm Golden Studio", "sharpness": "High", "suggested_min": 1300, "suggested_max": 1750})
            ),
            (
                seller1_id,
                "Handwoven Channapatna Lacquer Spinning Tops",
                "Set of 3 Organic Vegetable Lacquer Wooden Toys",
                "Safe, non-toxic traditional wooden spinning tops hand-turned on lathes from Wrightia tinctoria (Ivory wood) and glazed with organic shellac dyes.",
                3, # Woodcraft
                "Aale Mara Ivory Wood, Natural Lac Dye",
                "Turned on hand lathes and friction-polished with talc and screwpine leaves.",
                json.dumps(["Channapatna", "Wooden Toy", "Eco-friendly", "Child Safe", "GI Tagged"]),
                450.0, 550.0, 25, 1,
                "/static/images/products/wooden_top.jpg",
                "/static/images/products/wooden_top.jpg",
                json.dumps({"ai_enhanced": True, "lighting": "Soft Gloss Studio", "sharpness": "Crisp", "suggested_min": 400, "suggested_max": 600})
            )
        ]

        cursor.executemany("""
            INSERT INTO products (
                seller_id, name, title, description, category_id, material, 
                craft_details, tags, price, original_price, quantity, is_available, 
                original_image_url, enhanced_image_url, ai_generated_meta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, products_seed)

        # Seed sample notifications
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES 
            (?, 'Welcome to KalaSetu AI!', 'Your artisan store is verified and ready to accept orders.', 'system', 0),
            (?, 'AI Photography Assistant Ready', 'Upload clear photos of your crafts and let AI enhance lighting and write descriptions automatically.', 'system', 0)
        """, (seller1_id, seller1_id))

        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES 
            (?, 'Welcome to KalaSetu AI!', 'Discover authentic handmade treasures directly from master Indian artisans.', 'system', 0)
        """, (buyer_id,))

        conn.commit()
