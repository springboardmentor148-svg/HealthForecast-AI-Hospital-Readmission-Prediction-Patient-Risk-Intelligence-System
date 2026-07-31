from sqlalchemy.orm import Session
from models import User
from security import hash_password


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user):

    hashed_password = hash_password(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

from security import verify_password


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user

from security import verify_password


def authenticate_user(db: Session, email: str, password: str):

    user = get_user_by_email(db, email)

    if user is None:
        return None

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    return user