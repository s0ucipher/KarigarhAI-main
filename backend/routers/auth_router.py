from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import secrets
from backend.database import get_db, hash_password, verify_password
from backend.auth import create_access_token, get_current_user
from backend.config import (
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class GoogleAuthRequest(BaseModel):
    id_token: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # 'seller' or 'buyer'
    phone: Optional[str] = None
    language: Optional[str] = "en"
    # Seller specific fields
    craft_specialization: Optional[str] = None
    location: Optional[str] = None
    story_bio: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    craft_specialization: Optional[str] = None
    location: Optional[str] = None
    story_bio: Optional[str] = None

@router.post("/register")
def register(req: RegisterRequest):
    if req.role not in ["seller", "buyer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'seller' or 'buyer'")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    pwd_hash, salt = hash_password(req.password)
    default_avatar = "/static/images/avatars/artisan1.png" if req.role == "seller" else "/static/images/avatars/buyer1.png"

    cursor.execute("""
        INSERT INTO users (name, email, password_hash, salt, role, phone, avatar_url, language)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (req.name.strip(), req.email.lower().strip(), pwd_hash, salt, req.role, req.phone, default_avatar, req.language or "en"))
    user_id = cursor.lastrowid

    if req.role == "seller":
        cursor.execute("""
            INSERT INTO seller_profiles (user_id, craft_specialization, location, story_bio, badge)
            VALUES (?, ?, ?, ?, 'New Artisan')
        """, (user_id, req.craft_specialization or "Traditional Crafts", req.location or "India", req.story_bio or "Local handcrafted artisan."))
    else:
        cursor.execute("INSERT INTO buyer_profiles (user_id) VALUES (?)", (user_id,))

    # Welcome notification
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'Welcome to KalaSetu AI!', 'Your account has been successfully created. Welcome aboard!', 'system')
    """, (user_id,))

    user_data = {
        "id": user_id,
        "name": req.name.strip(),
        "email": req.email.lower().strip(),
        "role": req.role,
        "phone": req.phone,
        "avatar_url": default_avatar,
        "language": req.language or "en"
    }

    if req.role == "seller":
        cursor.execute("SELECT * FROM seller_profiles WHERE user_id = ?", (user_id,))
        seller_row = cursor.fetchone()
        if seller_row:
            user_data["seller_profile"] = dict(seller_row)
    else:
        cursor.execute("SELECT * FROM buyer_profiles WHERE user_id = ?", (user_id,))
        buyer_row = cursor.fetchone()
        if buyer_row:
            user_data["buyer_profile"] = dict(buyer_row)

    conn.commit()
    conn.close()

    # Generate token
    token = create_access_token({"sub": str(user_id), "role": req.role, "email": req.email.lower().strip()})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login")
def login(req: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, email, password_hash, salt, role, phone, avatar_url, language
        FROM users WHERE email = ?
    """, (req.email.lower().strip(),))
    row = cursor.fetchone()

    if not row or not verify_password(req.password, row["password_hash"], row["salt"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_data = dict(row)
    del user_data["password_hash"]
    del user_data["salt"]

    if user_data["role"] == "seller":
        cursor.execute("SELECT * FROM seller_profiles WHERE user_id = ?", (user_data["id"],))
        seller_row = cursor.fetchone()
        if seller_row:
            user_data["seller_profile"] = dict(seller_row)
    elif user_data["role"] == "buyer":
        cursor.execute("SELECT * FROM buyer_profiles WHERE user_id = ?", (user_data["id"],))
        buyer_row = cursor.fetchone()
        if buyer_row:
            user_data["buyer_profile"] = dict(buyer_row)

    conn.close()

    token = create_access_token({"sub": str(user_data["id"]), "role": user_data["role"], "email": user_data["email"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    user_id = current_user["id"]

    if req.name is not None:
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (req.name.strip(), user_id))
    if req.phone is not None:
        cursor.execute("UPDATE users SET phone = ? WHERE id = ?", (req.phone.strip(), user_id))
    if req.language is not None:
        cursor.execute("UPDATE users SET language = ? WHERE id = ?", (req.language.strip(), user_id))

    if current_user["role"] == "seller":
        if req.craft_specialization is not None:
            cursor.execute("UPDATE seller_profiles SET craft_specialization = ? WHERE user_id = ?", (req.craft_specialization.strip(), user_id))
        if req.location is not None:
            cursor.execute("UPDATE seller_profiles SET location = ? WHERE user_id = ?", (req.location.strip(), user_id))
        if req.story_bio is not None:
            cursor.execute("UPDATE seller_profiles SET story_bio = ? WHERE user_id = ?", (req.story_bio.strip(), user_id))

    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}

@router.post("/reset-password")
def reset_password(req: PasswordResetRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower().strip(),))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No account registered with this email address")

    pwd_hash, salt = hash_password(req.new_password)
    cursor.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (pwd_hash, salt, row["id"]))
    conn.commit()
    conn.close()

    return {"message": "Password has been successfully updated. Please login with your new password."}

def verify_google_firebase_token(id_token_str: str) -> dict:
    """
    Cryptographically verifies Firebase and Google ID tokens.
    Uses google.oauth2.id_token.verify_firebase_token and verify_oauth2_token,
    with Google tokeninfo endpoint fallback.
    """
    # 1. Try google.oauth2.id_token
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        req = google_requests.Request()
        if FIREBASE_PROJECT_ID:
            try:
                return id_token.verify_firebase_token(id_token_str, req, audience=FIREBASE_PROJECT_ID)
            except Exception:
                pass
        try:
            return id_token.verify_firebase_token(id_token_str, req)
        except Exception:
            pass
        try:
            return id_token.verify_oauth2_token(id_token_str, req)
        except Exception:
            pass
    except Exception:
        pass

    # 2. Fallback: Google tokeninfo service
    try:
        import requests
        res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token_str}", timeout=10)
        if res.status_code == 200:
            data = res.json()
            if "email" in data:
                return data
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired Google / Firebase authentication token."
    )

@router.get("/firebase-config")
def get_firebase_config():
    return {
        "apiKey": FIREBASE_API_KEY,
        "authDomain": FIREBASE_AUTH_DOMAIN,
        "projectId": FIREBASE_PROJECT_ID,
        "storageBucket": FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": FIREBASE_MESSAGING_SENDER_ID,
        "appId": FIREBASE_APP_ID,
        "measurementId": FIREBASE_MEASUREMENT_ID,
        "is_configured": bool(FIREBASE_API_KEY and (FIREBASE_PROJECT_ID or FIREBASE_AUTH_DOMAIN))
    }

@router.post("/google")
def google_auth(req: GoogleAuthRequest):
    if not req.id_token or not req.id_token.strip():
        raise HTTPException(status_code=400, detail="Authentication token is required")

    token_info = verify_google_firebase_token(req.id_token.strip())

    email = (token_info.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google authentication did not provide an email address")

    name = token_info.get("name") or token_info.get("displayName") or email.split("@")[0]
    picture = token_info.get("picture") or token_info.get("avatar_url") or "/static/images/avatars/buyer1.png"

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, email, role, phone, avatar_url, language
        FROM users WHERE email = ?
    """, (email,))
    row = cursor.fetchone()

    if row:
        user_data = dict(row)
        # Update avatar if missing or default
        if picture and (not user_data.get("avatar_url") or "buyer1.png" in user_data.get("avatar_url", "")):
            cursor.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (picture, user_data["id"]))
            conn.commit()
            user_data["avatar_url"] = picture
    else:
        # Create new user for first-time Google sign-in
        dummy_password = secrets.token_urlsafe(32)
        pwd_hash, salt = hash_password(dummy_password)
        role = "buyer"

        cursor.execute("""
            INSERT INTO users (name, email, password_hash, salt, role, phone, avatar_url, language)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'en')
        """, (name, email, pwd_hash, salt, role, None, picture))
        user_id = cursor.lastrowid

        cursor.execute("INSERT INTO buyer_profiles (user_id) VALUES (?)", (user_id,))
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Welcome to KalaSetu AI!', 'Your Google account has been successfully connected. Welcome aboard!', 'system')
        """, (user_id,))
        conn.commit()

        user_data = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "phone": None,
            "avatar_url": picture,
            "language": "en"
        }

    if user_data["role"] == "seller":
        cursor.execute("SELECT * FROM seller_profiles WHERE user_id = ?", (user_data["id"],))
        seller_row = cursor.fetchone()
        if seller_row:
            user_data["seller_profile"] = dict(seller_row)
    elif user_data["role"] == "buyer":
        cursor.execute("SELECT * FROM buyer_profiles WHERE user_id = ?", (user_data["id"],))
        buyer_row = cursor.fetchone()
        if buyer_row:
            user_data["buyer_profile"] = dict(buyer_row)

    conn.close()

    token = create_access_token({"sub": str(user_data["id"]), "role": user_data["role"], "email": user_data["email"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

