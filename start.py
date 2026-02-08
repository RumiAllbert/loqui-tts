#!/usr/bin/env python3
"""Loqui TTS - Single-command launcher.

Usage: python start.py [--host HOST] [--port PORT]
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
DATA = ROOT / "data"


def ensure_venv():
    """Create virtual environment if it doesn't exist."""
    if VENV.exists():
        return
    print("📦 Creating virtual environment...")
    subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])
    print("✅ Virtual environment created")


def venv_python() -> str:
    """Return path to the venv Python executable."""
    if sys.platform == "win32":
        return str(VENV / "Scripts" / "python.exe")
    return str(VENV / "bin" / "python")


def ensure_deps():
    """Install dependencies if needed."""
    python = venv_python()
    # Quick check: try importing fastapi
    result = subprocess.run(
        [python, "-c", "import fastapi; import chatterbox"],
        capture_output=True,
    )
    if result.returncode == 0:
        return
    print("📥 Installing dependencies (this may take a few minutes on first run)...")
    subprocess.check_call(
        [python, "-m", "pip", "install", "-e", str(ROOT), "--quiet"],
    )
    print("✅ Dependencies installed")


def ensure_data_dirs():
    """Create runtime data directories."""
    (DATA / "audio" / "generated").mkdir(parents=True, exist_ok=True)
    (DATA / "audio" / "references").mkdir(parents=True, exist_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Loqui TTS Launcher")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    args = parser.parse_args()

    print("\n🗣️  Loqui TTS - Made with ♥️ by Rumi\n")

    ensure_venv()
    ensure_deps()
    ensure_data_dirs()

    python = venv_python()

    print(f"\n🚀 Starting Loqui on http://{args.host}:{args.port}\n")

    os.execv(
        python,
        [
            python, "-m", "uvicorn",
            "backend.main:app",
            "--host", args.host,
            "--port", str(args.port),
            "--reload",
        ],
    )


if __name__ == "__main__":
    main()
