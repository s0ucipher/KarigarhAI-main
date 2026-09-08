import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS
from backend.database import get_db

security = HTTPBearer(auto_error=False)

def get_signing_secret() -> str:
    secret = JWT_SECRET.strip() if (JWT_SECRET and str(JWT_SECRET).strip()) else "kalasetu_ai_super_secret_artisan_jwt_key_2026"
    return secret

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        hours = JWT_EXPIRATION_HOURS if isinstance(JWT_EXPIRATION_HOURS, (int, float)) and JWT_EXPIRATION_HOURS > 0 else 168
        expire = datetime.now(timezone.utc) + timedelta(hours=hours)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    secret = get_signing_secret()
    token = jwt.encode(to_encode, secret, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return str(token)

def decode_access_token(token: str) -> dict:
    secret = get_signing_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please log in again."
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.language, u.created_at
        FROM users u WHERE u.id = ?
    """, (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    user_dict = dict(user)
    
    # If seller, attach seller profile
    if user_dict["role"] == "seller":
        cursor.execute("SELECT * FROM seller_profiles WHERE user_id = ?", (user_id,))
        seller = cursor.fetchone()
        if seller:
            user_dict["seller_profile"] = dict(seller)
    elif user_dict["role"] == "buyer":
        cursor.execute("SELECT * FROM buyer_profiles WHERE user_id = ?", (user_id,))
        buyer = cursor.fetchone()
        if buyer:
            user_dict["buyer_profile"] = dict(buyer)

    conn.close()
    return user_dict

def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    if not credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None

def require_seller(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This action requires an artisan seller account."
        )
    return current_user

def require_buyer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This action requires a buyer account."
        )
    return current_user
