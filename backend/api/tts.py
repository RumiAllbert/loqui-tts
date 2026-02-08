"""TTS generation endpoint."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_session
from backend.dependencies import get_audio_store, get_history_service, get_tts_engine
from backend.schemas.tts import GenerateResponse
from backend.utils.exceptions import ModelNotLoadedError

router = APIRouter(prefix="/tts", tags=["tts"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_speech(
    text: str = Form(...),
    variant: str = Form("turbo-4bit"),
    language: str | None = Form(None),
    exaggeration: float = Form(0.5),
    cfg_weight: float = Form(0.5),
    temperature: float = Form(0.8),
    reference_audio: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_session),
):
    """Generate speech from text."""
    engine = get_tts_engine()
    audio_store = get_audio_store()
    history = get_history_service()

    ref_filename = None
    if reference_audio and reference_audio.filename:
        data = await reference_audio.read()
        ref_filename = await audio_store.save_reference(data, reference_audio.filename)

    try:
        result = await engine.generate(
            text=text,
            variant=variant,
            language=language,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight,
            temperature=temperature,
            reference_audio_path=ref_filename,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        if "not loaded" in str(e):
            raise ModelNotLoadedError(variant)
        raise

    record = await history.create(
        session,
        text=text,
        model_variant=variant,
        language=language,
        exaggeration=exaggeration,
        cfg_weight=cfg_weight,
        temperature=temperature,
        duration_seconds=result.duration_seconds,
        generation_time_seconds=result.generation_time_seconds,
        audio_filename=result.audio_filename,
        reference_filename=ref_filename,
        sample_rate=result.sample_rate,
    )

    return GenerateResponse(
        id=record.id,
        audio_url=f"/api/audio/{result.audio_filename}",
        text=text,
        model_variant=variant,
        language=language,
        duration_seconds=result.duration_seconds,
        generation_time_seconds=result.generation_time_seconds,
        sample_rate=result.sample_rate,
    )
