import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Determine if running in Vercel serverless or read-only container
is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
if is_serverless or not os.access(str(BASE_DIR), os.W_OK):
    # In Vercel serverless, root is read-only. Database and uploads must reside in /tmp
    TMP_DIR = Path("/tmp")
    DB_PATH = TMP_DIR / "artisan_marketplace.db"
    UPLOAD_DIR = TMP_DIR / "uploads"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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

    # Copy seed upload images to /tmp/uploads so product photos load properly
    seed_uploads_dirs = [
        BASE_DIR / "uploads",
        Path.cwd() / "uploads",
        Path(__file__).resolve().parent.parent / "uploads",
        Path("/var/task/uploads"),
    ]
    import shutil
    for seed_dir in seed_uploads_dirs:
        if seed_dir.exists() and seed_dir.is_dir():
            for f in seed_dir.iterdir():
                if f.is_file():
                    dest = UPLOAD_DIR / f.name
                    if not dest.exists():
                        try:
                            shutil.copy2(f, dest)
                        except Exception:
                            pass
            break
else:
    UPLOAD_DIR = BASE_DIR / "uploads"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH = BASE_DIR / "artisan_marketplace.db"

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
HOST = os.getenv("HOST", "127.0.0.1")

# Firebase Authentication Configuration
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
FIREBASE_AUTH_DOMAIN = os.getenv("FIREBASE_AUTH_DOMAIN", "")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")
FIREBASE_MESSAGING_SENDER_ID = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "")
FIREBASE_APP_ID = os.getenv("FIREBASE_APP_ID", "")
FIREBASE_MEASUREMENT_ID = os.getenv("FIREBASE_MEASUREMENT_ID", "")

