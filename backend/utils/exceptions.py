"""Custom exceptions and FastAPI exception handlers."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class LoquiError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ModelNotLoadedError(LoquiError):
    def __init__(self, variant: str = ""):
        msg = f"Model '{variant}' is not loaded" if variant else "Model is not loaded"
        super().__init__(msg, status_code=400)


class GenerationError(LoquiError):
    def __init__(self, detail: str):
        super().__init__(f"Generation failed: {detail}", status_code=500)


class HistoryNotFoundError(LoquiError):
    def __init__(self, record_id: str):
        super().__init__(f"History entry '{record_id}' not found", status_code=404)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(LoquiError)
    async def loqui_error_handler(request: Request, exc: LoquiError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )
