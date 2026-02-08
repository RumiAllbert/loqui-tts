"""WebSocket manager for progress events."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._connections.append(ws)
        logger.info(f"WebSocket connected ({len(self._connections)} total)")

    def disconnect(self, ws: WebSocket):
        self._connections.remove(ws)
        logger.info(f"WebSocket disconnected ({len(self._connections)} total)")

    async def broadcast(self, message: dict[str, Any]):
        data = json.dumps(message)
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.remove(ws)
