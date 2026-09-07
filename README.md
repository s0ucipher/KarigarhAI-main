# KalaSetu AI
### AI-Powered Marketplace for Local Artisans, Craftsmen & Micro-Entrepreneurs

> **Mission**: Bridging the digital divide for rural Indian craftsmen, potters, handloom weavers, and folk artists. Empowering them to sell authentic handmade creations online with zero digital marketing or photography skills.

---

## 🌟 Highlights & Core Features

### 1. 📸 AI-Powered Product Photography Assistant
* **Instant Enhancement**: Automatically balances exposure, boosts natural color vibrance (clays, vegetable dyes, brass), and applies unsharp masking to sharpen phone camera captures.
* **Interactive Before / After Comparison Slider**: Artisans can drag a horizontal slider to compare the raw photo with the AI-enhanced studio version.
* **Studio Grade Metrics**: Visual badges displaying `+24% Lighting`, `+35% Clarity`, and `Marketplace Grade A+`.
* **Realistic Preservation**: Retains the authentic shape, organic texture, and hand-molded characteristics of the craft without artificial hallucination.

### 2. 🧠 AI Product Catalog Generator
* **Automatic Metadata**: Analyzes the craft photo to automatically generate:
  * Product Name & Compelling Marketplace Title
  * Cultural Story & Detailed Description
  * Craft Category mapping (Pottery, Handloom, Woodcraft, Dhokra Metal, Folk Art, etc.)
  * Natural Materials & Traditional Handcraft Technique
  * Search Keywords & Trending Hashtags
* **AI Fair Price Suggestion**: Suggests a recommended fair market price range (in ₹) with transparent rationale based on artisan craftsmanship and material costs.
* **Artisan Sovereignty**: The seller retains full authority to accept, edit, or adjust the price and stock quantity with large, beginner-friendly steppers.
* **Hybrid Vision Engine**: Supports live **Gemini 2.5 Flash** (via Google GenAI SDK with `GEMINI_API_KEY`) and features an **Artisan Knowledge Engine** for offline/zero-config operation.

### 3. 🌐 Multilingual & Voice Assistance
* **Full Localization**: Complete UI in **English**, **हिन्दी (Hindi)**, and **বাংলা (Bengali)** with instant switcher.
* **Audio Spoken Instructions (TTS)**: One-tap voice assistance to read aloud instructions and craft descriptions for artisans with limited literacy.

### 4. 🔨 Beginner-Friendly Seller Studio
* Large tactile touch targets, high contrast, warm earthy palette.
* Key metrics: Total Earnings (₹), Orders to Ship, Total Crafts Listed.
* My Crafts management: Quick price & stock editor, instant sold-out toggle, delete.
* Received Orders: Buyer delivery address, contact phone dialer link (`tel:`), and 1-tap fulfillment progression:
  `Order Placed` ➔ `Accept Order` ➔ `Start Packing` ➔ `Ship Order` ➔ `Mark as Delivered`.

### 5. 🛍️ Buyer Discovery & Shopping Experience
* Direct connection with verified master artisans.
* Curated craft categories, instant live search, and artisan spotlight stories.
* Complete Shopping Cart with persistent storage and free delivery calculations.
* Seamless Checkout: Address book and payment choices (Cash on Delivery, UPI / QR, Cards).
* **Live Step-by-Step Order Tracking**: Visual 5-stage progress timeline for placed orders.

### 6. 🔔 Real-Time Notification System
* Order alerts for sellers ("New Order Received!").
* Low stock warnings for artisans when inventory falls below 3 units.
* Dispatch and tracking alerts for buyers ("Order Accepted", "In Transit", "Delivered").

### 7. 📱 Mobile Simulator & Responsive Design
* Embedded Mobile Frame Simulator: Toggle between an authentic iPhone/Android phone frame or responsive full-screen mode.

---

## 🚀 Quick Start Guide

### 1. Start the Application Server
Run the launcher script using Python 3:
```powershell
python run.py
```
Or with Uvicorn:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Open in Browser
Visit: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🔑 Pre-Configured Demo Accounts

Use the **1-Click Test buttons** on the welcome screen, or log in with these credentials:

| Role | Name | Email | Password | Specialization |
|---|---|---|---|---|
| **Artisan (Seller)** | Ramesh Kumbhakar | `ramesh@kalasetu.ai` | `artisan123` | Terracotta & Pottery (Bishnupur) |
| **Artisan (Seller)** | Meera Devi | `meera@kalasetu.ai` | `artisan123` | Madhubani Folk Art (Bihar) |
| **Buyer (Customer)** | Priya Sharma | `priya@buyer.in` | `artisan123` | Conscious Craft Enthusiast |

*(You can also register brand new Artisan or Buyer accounts directly in the app!)*

---

## 🧪 Running Automated Tests

Run the full test suite covering all APIs, AI services, auth, and order lifecycles:
```powershell
python -m unittest tests/test_app.py
```

---

## 📂 Project Architecture

```
AiPoweredApp/
├── backend/
│   ├── main.py                  # FastAPI app entry point & static file mounts
│   ├── config.py                # Environment configuration & paths
│   ├── database.py              # SQLite schema migrations & seed crafts
│   ├── auth.py                  # PBKDF2 hashing & JWT authorization
│   ├── services/
│   │   ├── image_enhancer.py    # Pillow-based contrast, sharpness & lighting
│   │   └── ai_service.py        # Gemini Vision & Artisan Knowledge Engine
│   └── routers/
│       ├── auth_router.py       # Signup, login, password reset, profile
│       ├── product_router.py    # Product CRUD, filters, recommendations
│       ├── ai_router.py         # Image upload, enhance & catalog generation
│       ├── cart_router.py       # Shopping cart operations
│       ├── order_router.py      # Checkout, order tracking, status progression
│       ├── notification_router.py # Real-time alerts
│       └── seller_router.py     # Dashboard metrics & public artisan bio
├── frontend/
│   ├── index.html               # Mobile shell & simulator frame
│   ├── css/styles.css           # Custom artisan color tokens & animations
│   └── js/
│       ├── i18n.js              # Multilingual dictionary (EN, HI, BN) & TTS
│       ├── api.js               # Centralized API fetch client with JWT
│       ├── app.js               # State router, bottom nav & notifications
│       └── screens/             # Dedicated screen modules
│           ├── auth.js
│           ├── seller_dashboard.js
│           ├── seller_add_product.js   # 5-step AI listing wizard
│           ├── seller_orders.js        # Artisan order fulfillment
│           ├── seller_profile.js
│           ├── buyer_marketplace.js    # Craft discovery
│           ├── buyer_product_details.js
│           ├── buyer_cart_checkout.js
│           ├── buyer_orders.js         # Visual order tracking timeline
│           └── buyer_profile.js
├── uploads/                     # AI-enhanced & uploaded craft photos
├── tests/
│   └── test_app.py              # End-to-end integration test suite
├── run.py                       # Launch script
└── requirements.txt
```

---

## 🛡️ Optional AI Configuration

To enable live Google Gemini 2.5 Flash analysis for new craft photos, simply set your API key in the environment:
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```
If no key is provided, KalaSetu AI automatically switches to its high-precision **Artisan Knowledge Engine** with zero configuration needed.
