import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import UPLOAD_DIR, BASE_DIR, SEED_UPLOAD_DIRS
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

from fastapi import Request
from fastapi.responses import JSONResponse

# Global exception handler to prevent unformatted 500 server crashes
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    print(f"Unhandled error on {request.method} {request.url.path}: {tb}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "error_type": type(exc).__name__
        }
    )

# Initialize database immediately on module load for serverless environments
try:
    init_db()
except Exception as e:
    print(f"Startup DB init warning: {e}")

@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print(f"Startup event DB init warning: {e}")

# Mount API routers
app.include_router(auth_router.router)
app.include_router(product_router.router)
app.include_router(ai_router.router)
app.include_router(cart_router.router)
app.include_router(order_router.router)
app.include_router(notification_router.router)
app.include_router(seller_router.router)
app.include_router(mobile_router.router)

# Mount Static File Directories with robust serverless discovery
frontend_candidates = [
    BASE_DIR / "frontend",
    BASE_DIR / "public",
    Path.cwd() / "frontend",
    Path.cwd() / "public",
    Path(__file__).resolve().parent.parent / "frontend",
    Path(__file__).resolve().parent.parent / "public",
    Path("/var/task/frontend"),
    Path("/var/task/public"),
]
frontend_dir = BASE_DIR / "frontend"
for cand in frontend_candidates:
    if cand.exists() and cand.is_dir():
        frontend_dir = cand
        break

static_dir = frontend_dir / "static"
css_dir = frontend_dir / "css"
js_dir = frontend_dir / "js"

# In serverless read-only containers, suppress mkdir errors if directories already exist
try:
    static_dir.mkdir(parents=True, exist_ok=True)
    css_dir.mkdir(parents=True, exist_ok=True)
    js_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# Safe static mount helper to ensure Starlette never crashes on non-existent directories in serverless
def mount_safe_static(app_instance: FastAPI, route: str, directory: Path, name: str):
    dir_path = Path(directory)
    if not (dir_path.exists() and dir_path.is_dir()):
        fallback = Path("/tmp") / "static_fallbacks" / name
        fallback.mkdir(parents=True, exist_ok=True)
        dir_path = fallback
    app_instance.mount(route, StaticFiles(directory=str(dir_path)), name=name)

# Custom handler for uploads that checks writable UPLOAD_DIR and bundled SEED_UPLOAD_DIRS
@app.get("/uploads/{filename}")
async def serve_upload_file(filename: str):
    p = UPLOAD_DIR / filename
    if p.is_file():
        return FileResponse(str(p))
    for s_dir in SEED_UPLOAD_DIRS:
        seed_p = s_dir / filename
        if seed_p.is_file():
            return FileResponse(str(seed_p))
    return JSONResponse(status_code=404, content={"detail": "Image not found"})

mount_safe_static(app, "/uploads", UPLOAD_DIR, "uploads")
mount_safe_static(app, "/static", static_dir, "static")
mount_safe_static(app, "/css", css_dir, "css")
mount_safe_static(app, "/js", js_dir, "js")

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

@app.get("/api/index.py")
@app.get("/api/index")
def serve_api_index():
    return health_check()

@app.get("/")
def serve_index():
    for fdir in frontend_candidates:
        index_path = fdir / "index.html"
        if index_path.is_file():
            return FileResponse(str(index_path))
    return JSONResponse(status_code=404, content={"detail": "Index file not found"})

# Catch-all for SPA client routing
@app.get("/{full_path:path}")
def catch_all(full_path: str):
    # Check if file exists in any candidate frontend directory
    for fdir in frontend_candidates:
        requested = fdir / full_path
        if requested.is_file():
            return FileResponse(str(requested))
    # Otherwise return index.html for SPA routing
    for fdir in frontend_candidates:
        fallback_index = fdir / "index.html"
        if fallback_index.is_file():
            return FileResponse(str(fallback_index))
    return JSONResponse(status_code=404, content={"detail": f"Path {full_path} not found"})
