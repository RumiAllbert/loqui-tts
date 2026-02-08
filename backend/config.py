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
MODEL_VARIANTS = ["turbo", "standard", "multilingual"]

# Multilingual supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "pl": "Polish",
    "tr": "Turkish",
    "ru": "Russian",
    "nl": "Dutch",
    "cs": "Czech",
    "ar": "Arabic",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "hi": "Hindi",
    "hu": "Hungarian",
    "fi": "Finnish",
    "vi": "Vietnamese",
    "uk": "Ukrainian",
    "el": "Greek",
    "ms": "Malay",
    "ro": "Romanian",
}
