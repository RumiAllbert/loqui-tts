# Loqui TTS

Beautiful local text-to-speech powered by [Chatterbox](https://github.com/resemble-ai/chatterbox).

![Loqui](https://img.shields.io/badge/Made%20with%20%E2%99%A5%EF%B8%8F-by%20Rumi-violet)

## Quick Start

```bash
./setup.sh
```

That's it. The script will:
1. Install [uv](https://docs.astral.sh/uv/) if needed
2. Create a Python virtual environment
3. Install all dependencies
4. Start the server

Open **http://localhost:8000** in your browser.

## Features

- **3 Model Variants** — Turbo (fast), Standard (creative control), Multilingual (23 languages)
- **Voice Cloning** — Drop a reference audio file to clone any voice
- **Glassmorphism UI** — Beautiful dark theme with animated gradient orbs
- **Generation History** — All generations saved with playback
- **Waveform Visualization** — wavesurfer.js powered audio player
- **Auto Device Detection** — CUDA > MPS > CPU

## Frontend Development

For working on the frontend:

```bash
./setup.sh --dev
```

This starts both the backend (port 8000) and Vite dev server (port 5173) with hot reload.

To rebuild the static frontend:

```bash
cd frontend && npm run build
```

## API

Interactive API docs at **http://localhost:8000/docs** when running.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/models/` | List model statuses |
| `GET` | `/api/models/device` | Device info |
| `POST` | `/api/models/{variant}/download` | Download model |
| `POST` | `/api/models/{variant}/load` | Load model |
| `POST` | `/api/tts/generate` | Generate speech |
| `GET` | `/api/audio/{filename}` | Serve audio file |
| `GET` | `/api/history/` | List history |
| `DELETE` | `/api/history/{id}` | Delete entry |
| `DELETE` | `/api/history/` | Clear history |
| `WS` | `/api/ws` | Progress events |

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy + aiosqlite
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 3
- **State:** Zustand
- **TTS:** chatterbox-tts (Turbo, Standard, Multilingual)
- **Audio:** wavesurfer.js

---

Made with ♥️ by [Rumi](https://rumiallbert.com)
