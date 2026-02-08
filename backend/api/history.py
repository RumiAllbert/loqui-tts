"""History endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_session
from backend.dependencies import get_history_service
from backend.schemas.history import HistoryEntryResponse, HistoryListResponse
from backend.utils.exceptions import HistoryNotFoundError

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/", response_model=HistoryListResponse)
async def list_history(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    """List generation history (newest first)."""
    svc = get_history_service()
    records, total = await svc.list(session, limit=limit, offset=offset)
    items = [
        HistoryEntryResponse(
            id=r.id,
            text=r.text,
            model_variant=r.model_variant,
            language=r.language,
            exaggeration=r.exaggeration,
            cfg_weight=r.cfg_weight,
            duration_seconds=r.duration_seconds,
            generation_time_seconds=r.generation_time_seconds,
            audio_url=f"/api/audio/{r.audio_filename}",
            created_at=r.created_at,
        )
        for r in records
    ]
    return HistoryListResponse(items=items, total=total)


@router.delete("/{record_id}")
async def delete_history_entry(
    record_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete a single history entry."""
    svc = get_history_service()
    deleted = await svc.delete_one(session, record_id)
    if not deleted:
        raise HistoryNotFoundError(record_id)
    return {"ok": True}


@router.delete("/")
async def clear_history(session: AsyncSession = Depends(get_session)):
    """Clear all history."""
    svc = get_history_service()
    count = await svc.clear_all(session)
    return {"ok": True, "deleted": count}
