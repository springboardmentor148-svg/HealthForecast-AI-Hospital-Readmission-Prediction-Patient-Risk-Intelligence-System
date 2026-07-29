from __future__ import annotations

import logging

from flask import jsonify
from werkzeug.exceptions import HTTPException


class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400, payload: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}


def _error_response(code: int, message: str, payload: dict | None = None):
    body = {"error": {"code": code, "message": message}}
    if payload:
        body["error"].update(payload)
    return jsonify(body), code


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        return _error_response(error.status_code, error.message, error.payload)

    @app.errorhandler(400)
    def handle_bad_request(error):
        message = getattr(error, "description", None) or "Bad Request"
        return _error_response(400, message)

    @app.errorhandler(404)
    def handle_not_found(error):
        message = getattr(error, "description", None) or "Not Found"
        return _error_response(404, message)

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        return _error_response(error.code or 500, error.description or error.name)

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        app.logger.error("Unhandled server error", exc_info=True)
        return _error_response(500, "Internal Server Error")

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):
        app.logger.error("Unexpected exception", exc_info=True)
        return _error_response(500, "Internal Server Error")
