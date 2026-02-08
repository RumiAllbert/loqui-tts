"""SQLite CRUD for generation history."""

from __future__ import annotations

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import GenerationRecord
from backend.services.audio_store import AudioStore


class HistoryService:
    def __init__(self, audio_store: AudioStore):
        self._audio_store = audio_store

    async def create(self, session: AsyncSession, **kwargs) -> GenerationRecord:
        record = GenerationRecord(**kwargs)
        session.add(record)
        await session.commit()
        await session.refresh(record)
        return record

    async def list(
        self, session: AsyncSession, limit: int = 50, offset: int = 0
    ) -> tuple[list[GenerationRecord], int]:
        total = await session.scalar(select(func.count(GenerationRecord.id)))
        result = await session.execute(
            select(GenerationRecord)
            .order_by(desc(GenerationRecord.created_at))
            .limit(limit)
            .offset(offset)
        )
        records = list(result.scalars().all())
        return records, total or 0

    async def get(self, session: AsyncSession, record_id: str) -> GenerationRecord | None:
        return await session.get(GenerationRecord, record_id)

    async def delete_one(self, session: AsyncSession, record_id: str) -> bool:
        record = await self.get(session, record_id)
        if not record:
            return False
        # Delete audio files
        await self._audio_store.delete_generated(record.audio_filename)
        if record.reference_filename:
            await self._audio_store.delete_reference(record.reference_filename)
        await session.delete(record)
        await session.commit()
        return True

    async def clear_all(self, session: AsyncSession) -> int:
        # Get all records to delete audio files
        result = await session.execute(select(GenerationRecord))
        records = list(result.scalars().all())
        for record in records:
            await self._audio_store.delete_generated(record.audio_filename)
        count = len(records)
        await session.execute(delete(GenerationRecord))
        await session.commit()
        return count
