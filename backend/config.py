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
    template_db = BASE_DIR / "artisan_marketplace.db"
    if template_db.exists() and not DB_PATH.exists():
        import shutil
        try:
            shutil.copy2(template_db, DB_PATH)
        except Exception as e:
            print(f"Warning: Failed to copy template DB to /tmp: {e}")
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

