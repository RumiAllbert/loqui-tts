"""Unified TTS generation via MLX Audio."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass

import mlx.core as mx
import numpy as np
import soundfile as sf

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

        if variant == "multilingual" and not reference_audio_path:
            raise ValueError(
                "Multilingual model requires a reference audio for voice cloning. "
                "Please upload a reference audio file."
            )

        ref_path = None
        if reference_audio_path:
            ref_path = str(self._audio_store.reference_path(reference_audio_path))

        start_time = time.time()

        audio_array = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._generate_sync(
                model, variant, text, language, exaggeration, cfg_weight, temperature, ref_path
            ),
        )

        generation_time = time.time() - start_time

        filename = self._audio_store.new_generated_filename()
        output_path = self._audio_store.generated_path(filename)

        audio_np = np.array(audio_array, dtype=np.float32)
        if audio_np.ndim > 1:
            audio_np = audio_np.squeeze()

        await asyncio.get_event_loop().run_in_executor(
            None, lambda: sf.write(str(output_path), audio_np, SAMPLE_RATE)
        )

        duration = len(audio_np) / SAMPLE_RATE

        logger.info(f"Generated {duration:.1f}s audio with {variant} in {generation_time:.1f}s")

        return GenerationResult(
            audio_filename=filename,
            duration_seconds=round(duration, 2),
            generation_time_seconds=round(generation_time, 2),
            sample_rate=SAMPLE_RATE,
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
    ) -> mx.array:
        """Synchronous generation — runs in thread pool."""
        kwargs: dict = {
            "text": text,
            "exaggeration": exaggeration,
            "cfg_weight": cfg_weight,
            "temperature": temperature,
        }

        if variant == "multilingual":
            kwargs["lang_code"] = language or "en"
            if ref_path:
                # Multilingual model expects audio_prompt as mx.array
                from mlx_audio.tts.generate import load_audio
                kwargs["audio_prompt"] = load_audio(ref_path, sample_rate=SAMPLE_RATE)
                kwargs["audio_prompt_sr"] = SAMPLE_RATE
            # Without ref_audio, multilingual will fail if no conds.safetensors
        else:
            if ref_path:
                # Turbo models handle string paths internally via librosa
                kwargs["ref_audio"] = ref_path

        result = None
        for result in model.generate(**kwargs):
            pass

        if result is None:
            raise RuntimeError("Model generated no audio")

        return result.audio
