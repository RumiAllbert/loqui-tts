"""Model lifecycle management for MLX Audio Chatterbox variants."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

import mlx.core as mx

from backend.config import MODEL_REPOS

logger = logging.getLogger(__name__)


class ModelStatus(str, Enum):
    NOT_DOWNLOADED = "not_downloaded"
    DOWNLOADING = "downloading"
    DOWNLOADED = "downloaded"
    LOADING = "loading"
    LOADED = "loaded"
    UNLOADING = "unloading"
    ERROR = "error"


@dataclass
class ModelState:
    status: ModelStatus = ModelStatus.NOT_DOWNLOADED
    model: Any = None
    error: str | None = None
    download_progress: float = 0.0


class ModelManager:
    """Manages MLX Audio model variants. Only one loaded at a time."""

    VARIANTS = tuple(MODEL_REPOS.keys())

    def __init__(self):
        self._states: dict[str, ModelState] = {
            v: ModelState() for v in self.VARIANTS
        }
        self._lock = asyncio.Lock()
        self._ws_manager = None

    def set_ws_manager(self, ws_manager):
        self._ws_manager = ws_manager

    def get_status(self, variant: str) -> dict:
        state = self._states[variant]
        return {
            "variant": variant,
            "status": state.status.value,
            "error": state.error,
            "download_progress": state.download_progress,
        }

    def get_all_statuses(self) -> list[dict]:
        return [self.get_status(v) for v in self.VARIANTS]

    def get_loaded_variant(self) -> str | None:
        for v, state in self._states.items():
            if state.status == ModelStatus.LOADED:
                return v
        return None

    def get_model(self, variant: str):
        state = self._states[variant]
        if state.status != ModelStatus.LOADED:
            return None
        return state.model

    async def _broadcast(self, event: str, data: dict):
        if self._ws_manager:
            await self._ws_manager.broadcast({"event": event, **data})

    async def download_and_load(self, variant: str) -> None:
        """Download (if needed) and load a model variant."""
        if variant not in self.VARIANTS:
            raise ValueError(f"Unknown variant: {variant}")

        async with self._lock:
            current = self.get_loaded_variant()
            if current == variant and self._states[variant].status == ModelStatus.LOADED:
                return
            if current and current != variant:
                await self._unload_model(current)

            state = self._states[variant]
            state.status = ModelStatus.DOWNLOADING
            state.download_progress = 0.0
            await self._broadcast("model_status", {"variant": variant, "status": "downloading"})

            try:
                model = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: self._load_variant(variant)
                )
                state.model = model
                state.status = ModelStatus.LOADED
                state.download_progress = 1.0
                state.error = None
                await self._broadcast("model_status", {"variant": variant, "status": "loaded"})
                logger.info(f"Model {variant} loaded on MLX")
            except Exception as e:
                state.status = ModelStatus.ERROR
                state.error = str(e)
                await self._broadcast("model_status", {
                    "variant": variant, "status": "error", "error": str(e),
                })
                logger.error(f"Failed to load model {variant}: {e}")
                raise

    async def _unload_model(self, variant: str) -> None:
        """Unload a model and free memory."""
        state = self._states[variant]
        state.status = ModelStatus.UNLOADING

        if state.model is not None:
            del state.model
            state.model = None
            mx.metal.clear_cache()

        state.status = ModelStatus.DOWNLOADED
        await self._broadcast("model_status", {"variant": variant, "status": "downloaded"})
        logger.info(f"Model {variant} unloaded")

    @staticmethod
    def _load_variant(variant: str):
        """Synchronous model loading (runs in thread pool)."""
        from mlx_audio.tts.generate import load_model

        repo = MODEL_REPOS[variant]
        logger.info(f"Loading {variant} from {repo}...")
        model = load_model(repo, lazy=False)

        # The multilingual HF repo config.json is missing "multilingual": true,
        # so post_load_hook skips MTLTokenizer init. Patch it here.
        if variant == "multilingual" and getattr(model, "mtl_tokenizer", None) is None:
            from pathlib import Path
            from huggingface_hub import snapshot_download
            from mlx_audio.tts.models.chatterbox.tokenizer import MTLTokenizer

            model_path = Path(snapshot_download(repo, local_files_only=True))
            tokenizer_path = model_path / "tokenizer.json"
            if tokenizer_path.exists():
                model.mtl_tokenizer = MTLTokenizer(tokenizer_path)
                logger.info("Loaded multilingual tokenizer (MTLTokenizer)")

        return model
