"""FastAPI application factory."""

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.router import api_router
from backend.config import DATA_DIR, DEFAULT_REF_AUDIO, FRONTEND_DIST_DIR, REF_DIR, REFERENCES_DIR
from backend.db.database import init_db
from backend.dependencies import init_services, get_model_manager
from backend.utils.exceptions import register_exception_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Ensure data dirs
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "audio" / "generated").mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "audio" / "references").mkdir(parents=True, exist_ok=True)

    # Copy default reference audio if available
    src_ref = REF_DIR / "refaudio.wav"
    dst_ref = REFERENCES_DIR / DEFAULT_REF_AUDIO
    if src_ref.exists() and not dst_ref.exists():
        import shutil
        shutil.copy2(src_ref, dst_ref)
        logging.getLogger(__name__).info("Copied default reference audio")

    # Init DB
    await init_db()

    # Init services
    init_services()

    # Scan HF cache to detect already-downloaded models
    mm = get_model_manager()
    asyncio.create_task(mm.init_cache_states())

    logging.getLogger(__name__).info("Loqui TTS started")
    yield

    # Graceful shutdown: unload any loaded model to free memory
    try:
        mm = get_model_manager()
        loaded = mm.get_loaded_variant()
        if loaded:
            logging.getLogger(__name__).info(f"Unloading {loaded} model...")
            await mm._unload_model(loaded)
    except Exception:
        pass
    logging.getLogger(__name__).info("Loqui TTS shut down cleanly")


app = FastAPI(
    title="Loqui TTS",
    description="Beautiful local TTS powered by MLX Audio",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# API routes
app.include_router(api_router)

# Serve frontend static files (if built)
if FRONTEND_DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST_DIR), html=True), name="frontend")
