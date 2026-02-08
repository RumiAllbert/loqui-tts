"""History entry schemas."""

from datetime import datetime

from pydantic import BaseModel


class HistoryEntryResponse(BaseModel):
    id: str
    text: str
    model_variant: str
    language: str | None = None
    exaggeration: float | None = None
    cfg_weight: float | None = None
    duration_seconds: float
    generation_time_seconds: float
    audio_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    items: list[HistoryEntryResponse]
    total: int
