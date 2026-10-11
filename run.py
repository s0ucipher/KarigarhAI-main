import uvicorn
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    is_prod = bool(os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production")
    reload = not is_prod and os.getenv("RELOAD", "true").lower() in ("true", "1")

    print("=" * 60)
    print("   KalaSetu AI - Artisan Marketplace Server Starting")
    print(f"   Listening on: http://{host}:{port}")
    print(f"   Mode: {'Production' if is_prod else 'Development'} | Hot-Reload: {reload}")
    print("=" * 60)

    if reload:
        uvicorn.run(
            "backend.main:app",
            host=host,
            port=port,
            reload=True,
            reload_dirs=[str(BASE_DIR / "backend")]
        )
    else:
        uvicorn.run(
            "backend.main:app",
            host=host,
            port=port,
            reload=False
        )
