from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_notifications():
    return {"notifications": []}

@router.get("/{notification_id}")
async def get_notification(notification_id: str):
    return {"notification": {"id": notification_id, "message": "Notification not found"}}

@router.post("/")
async def create_notification():
    return {"message": "Notification created"}

@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    return {"message": "Notification marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    return {"message": "Notification deleted"}

@router.get("/unread-count")
async def get_unread_count():
    return {"unread_count": 0}