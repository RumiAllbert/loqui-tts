"""Unified TTS generation across all Chatterbox variants."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass

import torch
import torchaudio

from backend.config import SAMPLE_RATE
from backend.services.audio_store import AudioStore
from backend.services.model_manager import ModelManager

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    audio_filename: str
    duration_seconds: float
    generation_time_seconds: float
    sample_rate: int


class TTSEngine:
    def __init__(self, model_manager: ModelManager, audio_store: AudioStore):
        self._model_manager = model_manager
        self._audio_store = audio_store

    async def generate(
        self,
        text: str,
        variant: str,
        language: str | None = None,
        exaggeration: float = 0.5,
        cfg_weight: float = 0.5,
        temperature: float = 0.8,
        reference_audio_path: str | None = None,
    ) -> GenerationResult:
        """Generate speech and save to file."""
        model = self._model_manager.get_model(variant)
        if model is None:
            raise RuntimeError(f"Model {variant} is not loaded")

        ref_path = None
        if reference_audio_path:
            ref_path = str(self._audio_store.reference_path(reference_audio_path))

        start_time = time.time()

        wav = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._generate_sync(
                model, variant, text, language, exaggeration, cfg_weight, temperature, ref_path
            ),
        )

        generation_time = time.time() - start_time

        # Get sample rate from model if available, else use default
        sr = getattr(model, 'sr', SAMPLE_RATE)

        filename = self._audio_store.new_generated_filename()
        output_path = self._audio_store.generated_path(filename)

        if wav.dim() == 1:
            wav = wav.unsqueeze(0)

        await asyncio.get_event_loop().run_in_executor(
            None, lambda: torchaudio.save(str(output_path), wav.cpu(), sr)
        )

        duration = wav.shape[-1] / sr

        logger.info(f"Generated {duration:.1f}s audio with {variant} in {generation_time:.1f}s")

        return GenerationResult(
            audio_filename=filename,
            duration_seconds=round(duration, 2),
            generation_time_seconds=round(generation_time, 2),
            sample_rate=sr,
        )

    @staticmethod
    def _generate_sync(
        model,
        variant: str,
        text: str,
        language: str | None,
        exaggeration: float,
        cfg_weight: float,
        temperature: float,
        ref_path: str | None,
    ) -> torch.Tensor:
        """Synchronous generation — runs in thread pool."""
        if variant == "turbo":
            kwargs: dict = {
                "text": text,
                "exaggeration": exaggeration,
                "cfg_weight": cfg_weight,
                "temperature": temperature,
            }
            if ref_path:
                kwargs["audio_prompt_path"] = ref_path
            return model.generate(**kwargs)

        elif variant == "standard":
            kwargs = {
                "text": text,
                "exaggeration": exaggeration,
                "cfg_weight": cfg_weight,
                "temperature": temperature,
            }
            if ref_path:
                kwargs["audio_prompt_path"] = ref_path
            return model.generate(**kwargs)

        elif variant == "multilingual":
            kwargs = {
                "text": text,
                "language_id": language or "en",
                "exaggeration": exaggeration,
                "cfg_weight": cfg_weight,
                "temperature": temperature,
            }
            if ref_path:
                kwargs["audio_prompt_path"] = ref_path
            return model.generate(**kwargs)

        else:
            raise ValueError(f"Unknown variant: {variant}")
