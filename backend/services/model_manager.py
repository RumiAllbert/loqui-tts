"""Model lifecycle management for all 3 Chatterbox variants."""

from __future__ import annotations

import asyncio
import contextlib
import functools
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

import torch

from backend.services.device_detector import get_torch_device

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
    """Manages the 3 Chatterbox model variants. Only one loaded at a time."""

    VARIANTS = ("multilingual", "turbo", "standard")

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
            # Unload current model if different
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
                device = get_torch_device()
                model = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: self._load_variant(variant, device)
                )
                state.model = model
                state.status = ModelStatus.LOADED
                state.download_progress = 1.0
                state.error = None
                await self._broadcast("model_status", {"variant": variant, "status": "loaded"})
                logger.info(f"Model {variant} loaded on {device}")
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
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        state.status = ModelStatus.DOWNLOADED
        await self._broadcast("model_status", {"variant": variant, "status": "downloaded"})
        logger.info(f"Model {variant} unloaded")

    @staticmethod
    @contextlib.contextmanager
    def _patch_torch_load_for_device(device):
        """Patch torch.load to add map_location for non-CUDA devices.

        Workaround for chatterbox multilingual's from_local() which calls
        torch.load without map_location, failing on MPS/CPU when checkpoints
        contain CUDA tensors.
        """
        if str(device) in ("cpu", "mps"):
            original = torch.load
            map_loc = torch.device("cpu")

            @functools.wraps(original)
            def patched(*args, **kwargs):
                if "map_location" not in kwargs:
                    kwargs["map_location"] = map_loc
                return original(*args, **kwargs)

            torch.load = patched
            try:
                yield
            finally:
                torch.load = original
        else:
            yield

    @staticmethod
    def _load_variant(variant: str, device: torch.device):
        """Synchronous model loading (runs in thread pool)."""
        if variant == "turbo":
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            return ChatterboxTurboTTS.from_pretrained(device)
        elif variant == "standard":
            from chatterbox.tts import ChatterboxTTS
            return ChatterboxTTS.from_pretrained(device)
        elif variant == "multilingual":
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS
            with ModelManager._patch_torch_load_for_device(device):
                return ChatterboxMultilingualTTS.from_pretrained(device)
        else:
            raise ValueError(f"Unknown variant: {variant}")
