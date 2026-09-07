from fastapi import APIRouter, Depends, HTTPException
from backend.database import get_db
from backend.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 40
    """, (user_id,))
    rows = cursor.fetchall()

    cursor.execute("""
        SELECT COUNT(*) FROM notifications
        WHERE user_id = ? AND is_read = 0
    """, (user_id,))
    unread_count = cursor.fetchone()[0]

    conn.close()
    return {
        "notifications": [dict(r) for r in rows],
        "unread_count": unread_count
    }

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE notifications
        SET is_read = 1
        WHERE id = ? AND user_id = ?
    """, (notification_id, user_id))
    conn.commit()
    conn.close()

    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

    return {"message": "All notifications marked as read"}
