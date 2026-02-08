"""Audio file serving endpoint."""

from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.dependencies import get_audio_store

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("/{filename}")
async def serve_audio(filename: str):
    """Serve a generated WAV file."""
    store = get_audio_store()
    path = store.generated_path(filename)
    if not path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/wav", filename=filename)
