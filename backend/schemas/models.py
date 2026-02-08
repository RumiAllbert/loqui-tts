"""Model status schemas."""

from pydantic import BaseModel


class ModelStatusResponse(BaseModel):
    variant: str
    status: str
    error: str | None = None
    download_progress: float = 0.0


class DeviceInfoResponse(BaseModel):
    device: str
    name: str
    label: str
