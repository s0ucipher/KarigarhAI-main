from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db, hash_password, verify_password
from backend.auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

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

    conn.commit()
    conn.close()

    # Generate token
    token = create_access_token({"sub": str(user_id), "role": req.role, "email": req.email.lower()})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "role": req.role,
            "language": req.language or "en",
            "phone": req.phone
        }
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
