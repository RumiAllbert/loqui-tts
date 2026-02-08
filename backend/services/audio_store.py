"""File I/O for WAV files and reference audio clips."""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

import aiofiles

from backend.config import GENERATED_DIR, REFERENCES_DIR


class AudioStore:
    def __init__(self):
        GENERATED_DIR.mkdir(parents=True, exist_ok=True)
        REFERENCES_DIR.mkdir(parents=True, exist_ok=True)

    def generated_path(self, filename: str) -> Path:
        return GENERATED_DIR / filename

    def reference_path(self, filename: str) -> Path:
        return REFERENCES_DIR / filename

    def new_generated_filename(self) -> str:
        return f"{uuid.uuid4().hex}.wav"

    async def save_reference(self, data: bytes, original_name: str) -> str:
        """Save uploaded reference audio, return stored filename."""
        ext = Path(original_name).suffix or ".wav"
        filename = f"ref_{uuid.uuid4().hex}{ext}"
        path = REFERENCES_DIR / filename
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return filename

    async def delete_generated(self, filename: str) -> None:
        path = GENERATED_DIR / filename
        if path.exists():
            path.unlink()

    async def delete_reference(self, filename: str) -> None:
        path = REFERENCES_DIR / filename
        if path.exists():
            path.unlink()
