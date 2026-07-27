"""Authentication endpoints: register, login, logout, refresh, me, password management."""
from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from schemas.user import UserResponse
from services.auth_service import AuthService
from utils.helpers import get_client_ip

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new user (doctor, hospital administrator, researcher, or system administrator)."""
    service = AuthService(db)
    user = service.register(payload, get_client_ip(request), str(request.url.path))
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate with email/password and receive an access + refresh token pair."""
    service = AuthService(db)
    access_token, refresh_token = service.login(
        payload.email, payload.password, get_client_ip(request), str(request.url.path)
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_oauth2_form(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2-compatible token endpoint (used by Swagger UI's 'Authorize' button)."""
    service = AuthService(db)
    access_token, refresh_token = service.login(
        form_data.username, form_data.password, get_client_ip(request), str(request.url.path)
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    service = AuthService(db)
    access_token = service.refresh(payload.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log out the current session (client should discard its tokens)."""
    service = AuthService(db)
    service.logout(current_user, get_client_ip(request), str(request.url.path))
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password (requires the old password)."""
    service = AuthService(db)
    service.change_password(
        current_user, payload.old_password, payload.new_password,
        get_client_ip(request), str(request.url.path),
    )
    return MessageResponse(message="Password changed successfully")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset token. Always returns a generic success message
    to avoid leaking which emails are registered. In production, the token
    would be emailed rather than logged.
    """
    service = AuthService(db)
    service.create_password_reset_token(payload.email)
    return MessageResponse(message="If that email exists, a password reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset a password using a valid reset token."""
    service = AuthService(db)
    service.reset_password(payload.token, payload.new_password)
    return MessageResponse(message="Password reset successfully")
