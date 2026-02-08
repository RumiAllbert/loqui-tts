"""Application configuration."""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
REF_DIR = ROOT_DIR / "ref"
DATA_DIR = ROOT_DIR / "data"
AUDIO_DIR = DATA_DIR / "audio"
GENERATED_DIR = AUDIO_DIR / "generated"
REFERENCES_DIR = AUDIO_DIR / "references"
DB_PATH = DATA_DIR / "loqui.db"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend-dist"

DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# TTS defaults
DEFAULT_CFG_WEIGHT = 0.5
DEFAULT_EXAGGERATION = 0.5
MAX_TEXT_LENGTH = 5000
SAMPLE_RATE = 24000
QWEN_SAMPLE_RATE = 24000
DEFAULT_REF_AUDIO = "default_ref.wav"

# Model variants
MODEL_VARIANTS = ["turbo-fp16", "turbo-8bit", "turbo-4bit", "qwen-0.6b", "qwen-1.7b"]

# HuggingFace repo IDs for each variant
MODEL_REPOS: dict[str, str] = {
    "turbo-fp16": "mlx-community/chatterbox-turbo-fp16",
    "turbo-8bit": "mlx-community/chatterbox-turbo-8bit",
    "turbo-4bit": "mlx-community/chatterbox-turbo-4bit",
    "qwen-0.6b": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16",
    "qwen-1.7b": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16",
}


def is_qwen_variant(variant: str) -> bool:
    return variant.startswith("qwen")


# Approximate model sizes in bytes (for download progress estimation)
MODEL_SIZES_BYTES: dict[str, int] = {
    "turbo-fp16": 4_000_000_000,
    "turbo-8bit": 2_000_000_000,
    "turbo-4bit": 1_000_000_000,
    "qwen-0.6b": 1_200_000_000,
    "qwen-1.7b": 3_400_000_000,
}


# Qwen3-TTS supported languages (full names as expected by the model)
QWEN_LANGUAGES: dict[str, str] = {
    "en": "english",
    "zh": "chinese",
    "ja": "japanese",
    "ko": "korean",
    "fr": "french",
    "de": "german",
    "es": "spanish",
    "it": "italian",
    "ru": "russian",
    "pt": "portuguese",
}
