"""SQLAlchemy ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class GenerationRecord(Base):
    __tablename__ = "generations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    model_variant: Mapped[str] = mapped_column(String(20), nullable=False)
    language: Mapped[str | None] = mapped_column(String(5), nullable=True)
    exaggeration: Mapped[float | None] = mapped_column(Float, nullable=True)
    cfg_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    generation_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    audio_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sample_rate: Mapped[int] = mapped_column(Integer, default=24000)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
