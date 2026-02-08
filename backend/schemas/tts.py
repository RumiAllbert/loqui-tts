"""TTS request/response schemas."""

from pydantic import BaseModel


class GenerateResponse(BaseModel):
    id: str
    audio_url: str
    text: str
    model_variant: str
    language: str | None = None
    duration_seconds: float
    generation_time_seconds: float
    sample_rate: int
