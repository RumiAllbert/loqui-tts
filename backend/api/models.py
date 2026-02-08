"""Model management endpoints."""

from fastapi import APIRouter, BackgroundTasks

from backend.dependencies import get_model_manager
from backend.schemas.models import DeviceInfoResponse, ModelStatusResponse
from backend.services.device_detector import detect_device

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=list[ModelStatusResponse])
async def list_models():
    """List all model variant statuses."""
    mm = get_model_manager()
    return mm.get_all_statuses()


@router.get("/device", response_model=DeviceInfoResponse)
async def get_device():
    """Get current device info."""
    return detect_device()


@router.post("/{variant}/load", response_model=ModelStatusResponse)
async def load_model(variant: str, background_tasks: BackgroundTasks):
    """Download (if needed) and load a model variant."""
    mm = get_model_manager()
    if variant not in mm.VARIANTS:
        from backend.utils.exceptions import LoquiError
        raise LoquiError(f"Unknown variant: {variant}", status_code=404)
    background_tasks.add_task(mm.download_and_load, variant)
    return mm.get_status(variant)
