"""FastAPI application factory."""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.router import api_router
from backend.config import DATA_DIR, FRONTEND_DIST_DIR
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

    # Init DB
    await init_db()

    # Init services
    init_services()

    # Auto-load model if LOQUI_AUTOLOAD_MODEL is set
    autoload = os.environ.get("LOQUI_AUTOLOAD_MODEL")
    if autoload:
        mm = get_model_manager()
        if autoload in mm.VARIANTS:
            logging.getLogger(__name__).info(f"Auto-loading {autoload} model...")
            asyncio.create_task(mm.download_and_load(autoload))

    logging.getLogger(__name__).info("Loqui TTS started")
    yield
    logging.getLogger(__name__).info("Loqui TTS shutting down")


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
