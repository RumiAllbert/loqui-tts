#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
#  Loqui TTS — Setup & Launcher
#  Made with care by Rumi (rumiallbert.com)
# ─────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT/.venv"
DATA="$ROOT/data"
FRONTEND="$ROOT/frontend"
FRONTEND_DIST="$ROOT/frontend-dist"

HOST="${LOQUI_HOST:-127.0.0.1}"
PORT="${LOQUI_PORT:-8000}"
DEV_PORT="${LOQUI_DEV_PORT:-5173}"

# ── Colors & formatting ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log()   { echo -e "${BLUE}│${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1"; }
step()  { echo -e "\n${PURPLE}┌─${BOLD} $1${NC}"; }
done_() { echo -e "${PURPLE}└─${GREEN} Done${NC}\n"; }

banner() {
  echo -e ""
  echo -e "  ${PURPLE}${BOLD}╔═══════════════════════════════════════╗${NC}"
  echo -e "  ${PURPLE}${BOLD}║${NC}   ${CYAN}${BOLD}L o q u i   T T S${NC}              ${PURPLE}${BOLD}║${NC}"
  echo -e "  ${PURPLE}${BOLD}║${NC}   ${DIM}Beautiful local text-to-speech${NC}      ${PURPLE}${BOLD}║${NC}"
  echo -e "  ${PURPLE}${BOLD}╚═══════════════════════════════════════╝${NC}"
  echo -e ""
}

# ── Cleanup on exit ──────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""
SELECTED_MODEL=""

cleanup() {
  echo -e "\n${DIM}Shutting down...${NC}"
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo -e "${DIM}Goodbye!${NC}"
}
trap cleanup EXIT INT TERM

# ── Ensure uv is installed ───────────────────────────────
ensure_uv() {
  if command -v uv &>/dev/null; then
    ok "uv $(uv --version 2>/dev/null | head -1)"
    return
  fi

  step "Installing uv (fast Python package manager)"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"

  if command -v uv &>/dev/null; then
    ok "uv installed"
  else
    err "Failed to install uv. Install manually: https://docs.astral.sh/uv/"
    exit 1
  fi
  done_
}

# ── Python venv + deps ───────────────────────────────────
setup_python() {
  step "Python environment"

  if [ ! -d "$VENV" ]; then
    log "Creating virtual environment..."
    uv venv "$VENV" --python 3.11 2>/dev/null || uv venv "$VENV"
    ok "Virtual environment created"
  else
    ok "Virtual environment exists"
  fi

  log "Installing dependencies (this may take a while on first run)..."
  uv pip install --python "$VENV/bin/python" -e "$ROOT" 2>&1 | while IFS= read -r line; do
    case "$line" in
      *Resolved*|*Prepared*|*Installed*|*Audited*)
        log "${DIM}${line}${NC}" ;;
    esac
  done
  ok "Python dependencies ready"
  done_
}

# ── Data directories ─────────────────────────────────────
setup_data() {
  mkdir -p "$DATA/audio/generated" "$DATA/audio/references"
}

# ── Frontend build (if needed) ───────────────────────────
setup_frontend() {
  if [ -d "$FRONTEND_DIST" ] && [ -f "$FRONTEND_DIST/index.html" ]; then
    ok "Frontend already built"
    return
  fi

  if [ ! -d "$FRONTEND" ]; then
    return
  fi

  if ! command -v node &>/dev/null; then
    warn "Node.js not found — skipping frontend build"
    return
  fi

  step "Building frontend"
  log "Installing npm packages..."
  (cd "$FRONTEND" && npm install --silent 2>&1 | tail -1)
  ok "npm packages ready"

  log "Building React app..."
  (cd "$FRONTEND" && npm run build 2>&1 | tail -3)
  ok "Frontend built"
  done_
}

# ── Select & download model ──────────────────────────────
select_and_download_model() {
  step "Model setup"
  echo -e ""
  echo -e "  ${BOLD}Available models:${NC}"
  echo -e ""
  echo -e "    ${CYAN}1)${NC}  ${BOLD}Turbo${NC}          350M   English       Fastest, paralinguistic tags ${DIM}[laugh]${NC}"
  echo -e "    ${CYAN}2)${NC}  ${BOLD}Multilingual${NC}   500M   23 languages  Zero-shot cloning, global apps"
  echo -e "    ${CYAN}3)${NC}  ${BOLD}Standard${NC}       500M   English       CFG & exaggeration tuning"
  echo -e ""

  local choice
  read -rp "$(echo -e "  Select model to download [${BOLD}1${NC}]: ")" choice
  choice="${choice:-1}"

  case "$choice" in
    1) SELECTED_MODEL="turbo" ;;
    2) SELECTED_MODEL="multilingual" ;;
    3) SELECTED_MODEL="standard" ;;
    *)
      warn "Invalid choice, defaulting to Turbo"
      SELECTED_MODEL="turbo"
      ;;
  esac

  echo -e ""
  log "Downloading ${BOLD}${SELECTED_MODEL}${NC} model weights from HuggingFace..."
  log "${DIM}This is a one-time download. Weights are cached for future launches.${NC}"
  log "${DIM}You may need to log in to HuggingFace (the models are gated).${NC}"
  echo -e ""

  "$VENV/bin/python" -m backend.download_models "$SELECTED_MODEL"
  done_
}

# ── Launch backend ───────────────────────────────────────
start_backend() {
  step "Starting server"
  log "FastAPI on ${CYAN}http://${HOST}:${PORT}${NC}"

  source "$VENV/bin/activate"
  LOQUI_AUTOLOAD_MODEL="$SELECTED_MODEL" python -m uvicorn backend.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --log-level info &
  BACKEND_PID=$!
  ok "Backend started (PID: $BACKEND_PID)"
  done_
}

# ── Launch frontend dev server (optional) ────────────────
start_frontend_dev() {
  if [ "${1:-}" != "--dev" ]; then
    return
  fi

  if [ ! -d "$FRONTEND" ]; then
    warn "No frontend source — can't start dev server"
    return
  fi

  if ! command -v node &>/dev/null; then
    warn "Node.js not found — can't start dev server"
    return
  fi

  step "Starting frontend dev server"
  log "Vite on ${CYAN}http://localhost:${DEV_PORT}${NC}"

  (cd "$FRONTEND" && npm run dev -- --host 2>&1) &
  FRONTEND_PID=$!
  ok "Frontend dev started (PID: $FRONTEND_PID)"
  done_
}

# ── Main ─────────────────────────────────────────────────
main() {
  banner

  ensure_uv
  setup_python
  setup_data
  setup_frontend
  select_and_download_model
  start_backend
  start_frontend_dev "$@"

  echo -e "${GREEN}${BOLD}  Loqui is ready!${NC}"
  echo -e ""
  if [ "${1:-}" = "--dev" ]; then
    echo -e "  ${CYAN}App:${NC}      http://localhost:${DEV_PORT}"
  else
    echo -e "  ${CYAN}App:${NC}      http://${HOST}:${PORT}"
  fi
  echo -e "  ${CYAN}API docs:${NC} http://${HOST}:${PORT}/docs"
  echo -e ""
  echo -e "  ${DIM}The ${BOLD}${SELECTED_MODEL}${NC}${DIM} model is loading into memory...${NC}"
  echo -e "  ${DIM}Press Ctrl+C to stop${NC}"
  echo -e ""

  wait
}

main "$@"
