"""Unified TTS generation via MLX Audio."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass

import mlx.core as mx
import numpy as np
import soundfile as sf

from backend.config import DEFAULT_REF_AUDIO, QWEN_LANGUAGES, QWEN_SAMPLE_RATE, SAMPLE_RATE, is_qwen_variant
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
        speed: float = 1.0,
        reference_audio_path: str | None = None,
        ref_text: str | None = None,
    ) -> GenerationResult:
        """Generate speech and save to file."""
        model = self._model_manager.get_model(variant)
        if model is None:
            raise RuntimeError(f"Model {variant} is not loaded")

        ref_path = None
        if reference_audio_path:
            ref_path = str(self._audio_store.reference_path(reference_audio_path))
        elif is_qwen_variant(variant):
            # Use default reference audio for Qwen variants
            default_ref = self._audio_store.reference_path(DEFAULT_REF_AUDIO)
            if default_ref.exists():
                ref_path = str(default_ref)

        sample_rate = QWEN_SAMPLE_RATE if is_qwen_variant(variant) else SAMPLE_RATE

        start_time = time.time()

        audio_array = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._generate_sync(
                model, variant, text, language, exaggeration, cfg_weight,
                temperature, speed, ref_path, ref_text,
            ),
        )

        generation_time = time.time() - start_time

        filename = self._audio_store.new_generated_filename()
        output_path = self._audio_store.generated_path(filename)

        audio_np = np.array(audio_array, dtype=np.float32)
        if audio_np.ndim > 1:
            audio_np = audio_np.squeeze()

        await asyncio.get_event_loop().run_in_executor(
            None, lambda: sf.write(str(output_path), audio_np, sample_rate)
        )

        duration = len(audio_np) / sample_rate

        logger.info(f"Generated {duration:.1f}s audio with {variant} in {generation_time:.1f}s")

        return GenerationResult(
            audio_filename=filename,
            duration_seconds=round(duration, 2),
            generation_time_seconds=round(generation_time, 2),
            sample_rate=sample_rate,
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
        speed: float,
        ref_path: str | None,
        ref_text: str | None,
    ) -> mx.array:
        """Synchronous generation — runs in thread pool."""
        if is_qwen_variant(variant):
            # Qwen3-TTS generation path
            lang_code = QWEN_LANGUAGES.get(language or "en", "english")
            kwargs: dict = {
                "text": text,
                "lang_code": lang_code,
                "temperature": temperature,
                "speed": speed,
            }
            if ref_path:
                kwargs["ref_audio"] = ref_path
            if ref_text:
                kwargs["ref_text"] = ref_text
        else:
            # Chatterbox turbo generation path
            kwargs = {
                "text": text,
                "temperature": temperature,
            }
            if ref_path:
                kwargs["ref_audio"] = ref_path

        result = None
        for result in model.generate(**kwargs):
            pass

        if result is None:
            raise RuntimeError("Model generated no audio")

        return result.audio
