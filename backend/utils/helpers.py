"""Small, reusable helper functions shared across services/routers."""
import math
import uuid
from typing import Any, Optional

from fastapi import Request


def get_client_ip(request: Request) -> str:
    """Best-effort extraction of the caller's IP, honouring reverse proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def paginate_meta(total: int, page: int, page_size: int) -> dict:
    total_pages = math.ceil(total / page_size) if page_size else 0
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def to_uuid(value: str) -> Optional[uuid.UUID]:
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def bucket_age(age: int) -> str:
    """Bucket a numeric age into a 10-year band, e.g. '40-49'."""
    lower = (age // 10) * 10
    upper = lower + 9
    return f"{lower}-{upper}"


def safe_get(obj: Any, attr: str, default=None):
    return getattr(obj, attr, default) if obj is not None else default
