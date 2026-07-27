"""
Centralised, application-wide exception types and FastAPI exception
handlers. Routers/services raise these typed exceptions instead of
returning ad-hoc HTTPException calls scattered across the codebase;
`register_exception_handlers` wires them to consistent JSON responses
and ensures internal details are never leaked to clients.
"""
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from core.logging import error_logger


class AppException(Exception):
    """Base class for all custom application exceptions."""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class BadRequestException(AppException):
    def __init__(self, message: str = "Invalid request"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class PredictionServiceException(AppException):
    def __init__(self, message: str = "Prediction service failed"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE)


def _error_response(status_code: int, message: str, details=None) -> JSONResponse:
    body = {"success": False, "message": message}
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status_code, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach centralised handlers so every error returns a consistent shape."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return _error_response(exc.status_code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Validation error",
            details=exc.errors(),
        )

    @app.exception_handler(SQLAlchemyError)
    async def db_exception_handler(request: Request, exc: SQLAlchemyError):
        error_logger.error("Database error on %s: %s", request.url.path, exc, exc_info=True)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "A database error occurred. Please try again later.",
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        error_logger.error("Unhandled error on %s: %s", request.url.path, exc, exc_info=True)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please try again later.",
        )
