"""Aggregated API router."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.api import audio, history, models, tts
from backend.dependencies import get_ws_manager

api_router = APIRouter(prefix="/api")

api_router.include_router(models.router)
api_router.include_router(tts.router)
api_router.include_router(history.router)
api_router.include_router(audio.router)


@api_router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    manager = get_ws_manager()
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
