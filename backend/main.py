import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import UPLOAD_DIR, BASE_DIR
from backend.database import init_db
from backend.routers import (
    auth_router,
    product_router,
    ai_router,
    cart_router,
    order_router,
    notification_router,
    seller_router,
    mobile_router
)

app = FastAPI(
    title="KalaSetu AI - Artisan Marketplace",
    description="AI-powered digital commerce assistant for Indian artisans: photo/voice to catalogue, translation, fair-price guidance, direct buyer connection.",
    version="1.0.0"
)

# Enable CORS for cross-device mobile testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Mount API routers
app.include_router(auth_router.router)
app.include_router(product_router.router)
app.include_router(ai_router.router)
app.include_router(cart_router.router)
app.include_router(order_router.router)
app.include_router(notification_router.router)
app.include_router(seller_router.router)
app.include_router(mobile_router.router)

# Mount Static File Directories
frontend_dir = BASE_DIR / "frontend"
static_dir = frontend_dir / "static"
css_dir = frontend_dir / "css"
js_dir = frontend_dir / "js"

static_dir.mkdir(parents=True, exist_ok=True)
css_dir.mkdir(parents=True, exist_ok=True)
js_dir.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "KalaSetu AI Marketplace",
        "version": "1.0.0",
        "features": {
            "ai_image_enhancement": True,
            "ai_product_catalog": True,
            "multilingual": ["en", "hi", "bn"],
            "roles": ["seller", "buyer"]
        }
    }

@app.get("/")
def serve_index():
    index_path = frontend_dir / "index.html"
    return FileResponse(str(index_path))

# Catch-all for SPA client routing
@app.get("/{full_path:path}")
def catch_all(full_path: str):
    # If file exists in frontend, serve it
    requested = frontend_dir / full_path
    if requested.is_file():
        return FileResponse(str(requested))
    # Otherwise return index.html for SPA routing
    return FileResponse(str(frontend_dir / "index.html"))
