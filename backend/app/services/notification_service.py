from __future__ import annotations

from typing import Any
from ..extensions import db
from ..models import User
from ..models.notification import Notification


def create_notification(
    recipient_user_id: int,
    title: str,
    message: str,
    notification_type: str,
    related_entity: str | None = None,
    related_entity_id: str | int | None = None,
) -> Notification:
    """
    Creates and persists a single notification record for a specific user.
    """
    entity_id_str = str(related_entity_id) if related_entity_id is not None else None
    
    notification = Notification(
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity=related_entity,
        related_entity_id=entity_id_str,
        recipient_user_id=recipient_user_id,
        read_status=False,
    )
    db.session.add(notification)
    return notification


def broadcast_notification(
    title: str,
    message: str,
    notification_type: str,
    related_entity: str | None = None,
    related_entity_id: str | int | None = None,
) -> list[Notification]:
    """
    Broadcasts a notification to all active users in the system by creating
    a separate, independent notification record for each active user.
    """
    active_users = User.query.filter_by(is_active=True).all()
    notifications = []
    
    for user in active_users:
        notif = create_notification(
            recipient_user_id=user.id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity=related_entity,
            related_entity_id=related_entity_id,
        )
        notifications.append(notif)
        
    return notifications
