import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Determine runtime environment
is_vercel = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
is_render = bool(os.getenv("RENDER"))
is_serverless = is_vercel or not os.access(str(BASE_DIR), os.W_OK)

# Custom storage overrides (useful on Render with persistent disk e.g. /var/data)
custom_db_path = os.getenv("SQLITE_DB_PATH") or os.getenv("DATABASE_PATH")
custom_upload_dir = os.getenv("UPLOAD_DIR")

if custom_db_path:
    DB_PATH = Path(custom_db_path)
    if custom_upload_dir:
        UPLOAD_DIR = Path(custom_upload_dir)
    else:
        UPLOAD_DIR = DB_PATH.parent / "uploads"
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
elif is_serverless:
    # In Vercel serverless, root is read-only. Database and uploads must reside in /tmp
    TMP_DIR = Path("/tmp")
    DB_PATH = TMP_DIR / "artisan_marketplace.db"
    UPLOAD_DIR = TMP_DIR / "uploads"
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

    # Copy DB template if not present or empty
    template_candidates = [
        BASE_DIR / "artisan_marketplace.db",
        Path.cwd() / "artisan_marketplace.db",
        Path(__file__).resolve().parent.parent / "artisan_marketplace.db",
        Path("/var/task/artisan_marketplace.db"),
    ]
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        import shutil
        for cand in template_candidates:
            if cand.exists() and cand.is_file() and cand.stat().st_size > 0:
                try:
                    shutil.copy2(cand, DB_PATH)
                    break
                except Exception as e:
                    print(f"Warning: Failed to copy template DB to /tmp: {e}")
else:
    UPLOAD_DIR = Path(custom_upload_dir) if custom_upload_dir else BASE_DIR / "uploads"
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    DB_PATH = BASE_DIR / "artisan_marketplace.db"

seed_candidates = [
    BASE_DIR / "backend" / "seed_assets" / "uploads",
    BASE_DIR / "public" / "uploads",
    BASE_DIR / "frontend" / "uploads",
    BASE_DIR / "uploads",
    Path.cwd() / "backend" / "seed_assets" / "uploads",
    Path.cwd() / "uploads",
    Path(__file__).resolve().parent / "seed_assets" / "uploads",
    Path("/var/task/backend/seed_assets/uploads"),
    Path("/var/task/uploads"),
]
SEED_UPLOAD_DIRS = [cand for cand in seed_candidates if cand.exists() and cand.is_dir()]
if UPLOAD_DIR not in SEED_UPLOAD_DIRS:
    SEED_UPLOAD_DIRS.insert(0, UPLOAD_DIR)

# JWT Configuration with bulletproof fallback against empty environment variables
jwt_secret_env = os.getenv("JWT_SECRET")
JWT_SECRET = jwt_secret_env.strip() if (jwt_secret_env and jwt_secret_env.strip()) else "kalasetu_ai_super_secret_artisan_jwt_key_2026"
JWT_ALGORITHM = "HS256"

jwt_exp_env = os.getenv("JWT_EXPIRATION_HOURS")
try:
    JWT_EXPIRATION_HOURS = int(jwt_exp_env) if (jwt_exp_env and jwt_exp_env.strip()) else 24 * 7
except Exception:
    JWT_EXPIRATION_HOURS = 24 * 7

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
PORT = int(os.getenv("PORT") or 8000)
# Default to 0.0.0.0 for Render, container environments, or if HOST is explicitly set
HOST = os.getenv("HOST", "0.0.0.0" if (is_render or is_serverless) else "127.0.0.1")

# Firebase Authentication Configuration
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
FIREBASE_AUTH_DOMAIN = os.getenv("FIREBASE_AUTH_DOMAIN", "")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")
FIREBASE_MESSAGING_SENDER_ID = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "")
FIREBASE_APP_ID = os.getenv("FIREBASE_APP_ID", "")
FIREBASE_MEASUREMENT_ID = os.getenv("FIREBASE_MEASUREMENT_ID", "")


