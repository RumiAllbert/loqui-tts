"""Dependency injection - singleton service instances."""

from backend.api.ws import WebSocketManager
from backend.services.audio_store import AudioStore
from backend.services.history_service import HistoryService
from backend.services.model_manager import ModelManager
from backend.services.tts_engine import TTSEngine

# Singletons
_ws_manager: WebSocketManager | None = None
_model_manager: ModelManager | None = None
_audio_store: AudioStore | None = None
_tts_engine: TTSEngine | None = None
_history_service: HistoryService | None = None


def init_services():
    """Initialize all singleton services."""
    global _ws_manager, _model_manager, _audio_store, _tts_engine, _history_service

    _ws_manager = WebSocketManager()
    _model_manager = ModelManager()
    _model_manager.set_ws_manager(_ws_manager)
    _audio_store = AudioStore()
    _tts_engine = TTSEngine(_model_manager, _audio_store)
    _history_service = HistoryService(_audio_store)


def get_ws_manager() -> WebSocketManager:
    return _ws_manager


def get_model_manager() -> ModelManager:
    return _model_manager


def get_audio_store() -> AudioStore:
    return _audio_store


def get_tts_engine() -> TTSEngine:
    return _tts_engine


def get_history_service() -> HistoryService:
    return _history_service
