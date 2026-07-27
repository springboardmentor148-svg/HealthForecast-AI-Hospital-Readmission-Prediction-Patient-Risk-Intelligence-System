"""Reusable validation helpers used by schemas and services."""
import re

from utils.constants import UserRole

_PHONE_RE = re.compile(r"^\+?[0-9\-\s()]{7,20}$")


def is_valid_role(role: str) -> bool:
    return role in {r.value for r in UserRole}


def is_valid_phone(phone: str) -> bool:
    return bool(_PHONE_RE.match(phone))


def is_strong_password(password: str) -> bool:
    """At least 8 chars, one letter and one digit."""
    if len(password) < 8:
        return False
    has_letter = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_letter and has_digit


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
