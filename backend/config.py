"""Application configuration."""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
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

# Model variants
MODEL_VARIANTS = ["turbo-fp16", "turbo-8bit", "turbo-4bit", "multilingual"]

# HuggingFace repo IDs for each variant
MODEL_REPOS: dict[str, str] = {
    "turbo-fp16": "mlx-community/chatterbox-turbo-fp16",
    "turbo-8bit": "mlx-community/chatterbox-turbo-8bit",
    "turbo-4bit": "mlx-community/chatterbox-turbo-4bit",
    "multilingual": "mlx-community/Chatterbox-TTS-fp16",
}

# Multilingual supported languages (must match MLX chatterbox model)
SUPPORTED_LANGUAGES = {
    "en": "English",
    "ar": "Arabic",
    "da": "Danish",
    "de": "German",
    "el": "Greek",
    "es": "Spanish",
    "fi": "Finnish",
    "fr": "French",
    "he": "Hebrew",
    "hi": "Hindi",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "ms": "Malay",
    "nl": "Dutch",
    "no": "Norwegian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ru": "Russian",
    "sv": "Swedish",
    "sw": "Swahili",
    "tr": "Turkish",
    "zh": "Chinese",
}
