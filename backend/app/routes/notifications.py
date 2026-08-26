from __future__ import annotations

from typing import Any
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import APIError
from ..extensions import db
from ..models.notification import Notification

bp = Blueprint("notifications", __name__)


def serialize_notification(notification: Notification) -> dict[str, Any]:
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "read_status": notification.read_status,
        "related_entity": notification.related_entity,
        "related_entity_id": notification.related_entity_id,
        "recipient_user_id": notification.recipient_user_id,
    }


@bp.get("")
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifications = (
        Notification.query.filter_by(recipient_user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return jsonify({"notifications": [serialize_notification(n) for n in notifications]})


@bp.patch("/<int:notification_id>/read")
@jwt_required()
def mark_read(notification_id: int):
    user_id = int(get_jwt_identity())
    notification = Notification.query.filter_by(
        id=notification_id, recipient_user_id=user_id
    ).first()
    if not notification:
        raise APIError("Notification not found", 404)

    notification.read_status = True
    db.session.commit()
    return jsonify({"status": "success", "notification": serialize_notification(notification)})


@bp.post("/mark-all-read")
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(recipient_user_id=user_id, read_status=False).update(
        {"read_status": True}
    )
    db.session.commit()
    return jsonify({"status": "success"})
