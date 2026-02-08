"""Model lifecycle management for MLX Audio Chatterbox variants."""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any

import mlx.core as mx

from backend.config import MODEL_REPOS, MODEL_SIZES_BYTES

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


def _hf_cache_dir() -> Path:
    """Get the HuggingFace Hub cache directory."""
    for env in ("HF_HUB_CACHE", "HUGGINGFACE_HUB_CACHE"):
        val = os.environ.get(env)
        if val:
            return Path(val)
    hf_home = os.environ.get("HF_HOME")
    if hf_home:
        return Path(hf_home) / "hub"
    return Path.home() / ".cache" / "huggingface" / "hub"


def _is_model_cached(repo: str) -> bool:
    """Check if a model's files exist in the HuggingFace cache."""
    cache = _hf_cache_dir()
    model_dir = cache / f"models--{repo.replace('/', '--')}"
    snapshots = model_dir / "snapshots"
    if not snapshots.exists():
        return False
    for snapshot in snapshots.iterdir():
        if snapshot.is_dir() and any(snapshot.iterdir()):
            return True
    return False


def _get_cache_size(repo: str) -> int:
    """Get total size of cached (non-symlink) files for a model."""
    cache = _hf_cache_dir()
    model_dir = cache / f"models--{repo.replace('/', '--')}"
    if not model_dir.exists():
        return 0
    total = 0
    try:
        for f in model_dir.rglob("*"):
            if f.is_file() and not f.is_symlink():
                try:
                    total += f.stat().st_size
                except OSError:
                    pass
    except Exception:
        pass
    return total


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

    async def init_cache_states(self):
        """Check HF cache to mark already-downloaded models."""
        loop = asyncio.get_event_loop()
        for variant in self.VARIANTS:
            repo = MODEL_REPOS[variant]
            cached = await loop.run_in_executor(None, _is_model_cached, repo)
            if cached:
                self._states[variant].status = ModelStatus.DOWNLOADED
                self._states[variant].download_progress = 1.0
                logger.info(f"Model {variant} found in cache")

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

    async def _monitor_download(self, variant: str) -> None:
        """Monitor HF cache directory growth and broadcast progress."""
        repo = MODEL_REPOS[variant]
        expected = MODEL_SIZES_BYTES.get(variant, 0)
        if expected == 0:
            return

        while self._states[variant].status == ModelStatus.DOWNLOADING:
            try:
                current = await asyncio.get_event_loop().run_in_executor(
                    None, _get_cache_size, repo
                )
                progress = min(current / expected, 0.97)
                self._states[variant].download_progress = progress
                await self._broadcast("download_progress", {
                    "variant": variant,
                    "progress": round(progress, 2),
                })
            except Exception:
                pass
            await asyncio.sleep(1)

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
            repo = MODEL_REPOS[variant]
            monitor_task = None

            # Check if model is already cached
            is_cached = await asyncio.get_event_loop().run_in_executor(
                None, _is_model_cached, repo
            )

            if is_cached:
                # Already downloaded — go straight to loading
                state.status = ModelStatus.LOADING
                state.download_progress = 1.0
                await self._broadcast("model_status", {
                    "variant": variant, "status": "loading",
                })
            else:
                # Needs downloading
                state.status = ModelStatus.DOWNLOADING
                state.download_progress = 0.0
                await self._broadcast("model_status", {
                    "variant": variant, "status": "downloading",
                })
                monitor_task = asyncio.create_task(self._monitor_download(variant))

            try:
                model = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: self._load_variant(variant)
                )

                # Stop progress monitor
                if monitor_task:
                    monitor_task.cancel()
                    await self._broadcast("download_progress", {
                        "variant": variant, "progress": 1.0,
                    })

                state.model = model
                state.status = ModelStatus.LOADED
                state.download_progress = 1.0
                state.error = None
                await self._broadcast("model_status", {
                    "variant": variant, "status": "loaded",
                })
                logger.info(f"Model {variant} loaded on MLX")
            except Exception as e:
                if monitor_task:
                    monitor_task.cancel()
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
        return model
