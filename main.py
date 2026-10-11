import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    is_prod = bool(os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production")
    reload = not is_prod and os.getenv("RELOAD", "true").lower() in ("true", "1")
    if reload:
        uvicorn.run("main:app", host=host, port=port, reload=True, reload_dirs=[str(ROOT_DIR / "backend")])
    else:
        uvicorn.run("main:app", host=host, port=port, reload=False)
