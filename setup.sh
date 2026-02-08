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

# ── Waveform animation ───────────────────────────────────
#    Block chars:  " " ▁ ▂ ▃ ▄ ▅ ▆ ▇ █  (heights 0–8)
#    Colors:       purple→cyan→purple gradient (256-color)

_BLOCKS=(" " "▁" "▂" "▃" "▄" "▅" "▆" "▇" "█")

# Speech-like waveform: three peaks with silences (40 bars)
_WAVE=(0 1 3 5 7 8 7 5 3 1 0 0 1 2 5 7 8 8 7 5 2 1 0 0 1 3 5 7 8 7 5 3 1 0 0 0 1 2 1 0)
_WAVE_LEN=40

# Symmetric gradient: deep purple → purple → blue → light blue → cyan (center) → back
_COLORS=(
  "38;5;141" "38;5;141" "38;5;141" "38;5;135" "38;5;135"
  "38;5;135" "38;5;135" "38;5;135" "38;5;99"  "38;5;99"
  "38;5;99"  "38;5;99"  "38;5;99"  "38;5;75"  "38;5;75"
  "38;5;75"  "38;5;75"  "38;5;51"  "38;5;51"  "38;5;51"
  "38;5;51"  "38;5;51"  "38;5;51"  "38;5;51"  "38;5;75"
  "38;5;75"  "38;5;75"  "38;5;75"  "38;5;99"  "38;5;99"
  "38;5;99"  "38;5;99"  "38;5;99"  "38;5;135" "38;5;135"
  "38;5;135" "38;5;135" "38;5;135" "38;5;141" "38;5;141"
)

_render_wave() {
  local pct=$1
  local line=""
  for ((i=0; i<_WAVE_LEN; i++)); do
    local h=$(( _WAVE[i] * pct / 100 ))
    line+="\033[${_COLORS[$i]}m${_BLOCKS[$h]}"
  done
  printf '\r          %b\033[0m' "$line"
}

show_intro() {
  tput civis 2>/dev/null || true
  printf '\n\n\n'

  # Phase 1: Waveform grows from silence to full height
  for pct in 12 25 40 55 70 85 100; do
    _render_wave "$pct"
    sleep 0.06
  done

  # Phase 2: Shimmer — bars vibrate slightly like live audio
  for f in 1 2 3; do
    local line=""
    for ((i=0; i<_WAVE_LEN; i++)); do
      local h=${_WAVE[$i]}
      if [ "$h" -gt 0 ]; then
        local v=$(( RANDOM % 3 - 1 ))
        h=$(( h + v ))
        h=$(( h < 1 ? 1 : h > 8 ? 8 : h ))
      fi
      line+="\033[${_COLORS[$i]}m${_BLOCKS[$h]}"
    done
    printf '\r          %b\033[0m' "$line"
    sleep 0.08
  done

  # Phase 3: Settle on final waveform
  _render_wave 100

  # Phase 4: Reveal text line by line
  printf '\n\n'
  sleep 0.12
  printf '                     \033[1;36mL O Q U I   T T S\033[0m\n'
  sleep 0.10
  printf '                \033[2m─────────────────────────────\033[0m\n'
  sleep 0.08
  printf '               \033[2mBeautiful local text-to-speech\033[0m\n'
  sleep 0.06
  printf '            \033[2m   ♪  Powered by MLX on Apple Silicon\033[0m\n'
  printf '\n'

  tput cnorm 2>/dev/null || true
}

show_goodbye() {
  tput civis 2>/dev/null || true
  printf '\n'

  # Fade out: full → silence
  for pct in 100 80 55 30 10 0; do
    _render_wave "$pct"
    sleep 0.06
  done

  printf '\r%60s\r' ""
  printf '\n'
  printf '            \033[2m   ♪  Thanks for using Loqui TTS\033[0m\n'
  printf '                    \033[2mUntil next time...\033[0m\n\n'

  tput cnorm 2>/dev/null || true
}

# ── Cleanup on exit ──────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo -e ""
  echo -e "${PURPLE}┌─${BOLD} Shutting down${NC}"
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log "Stopping frontend dev server..."
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log "Stopping backend (unloading model, freeing memory)..."
    kill -INT "$BACKEND_PID" 2>/dev/null || true
    for i in $(seq 1 10); do
      kill -0 "$BACKEND_PID" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$BACKEND_PID" 2>/dev/null && kill -9 "$BACKEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo -e "${PURPLE}└─${GREEN} Clean shutdown complete${NC}"
  show_goodbye
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
  uv pip install --python "$VENV/bin/python" --prerelease=allow -e "$ROOT" 2>&1 | while IFS= read -r line; do
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

# ── Launch backend ───────────────────────────────────────
start_backend() {
  step "Starting server"
  log "FastAPI on ${CYAN}http://${HOST}:${PORT}${NC}"

  source "$VENV/bin/activate"
  python -m uvicorn backend.main:app \
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
  show_intro

  ensure_uv
  setup_python
  setup_data
  setup_frontend
  start_backend
  start_frontend_dev "$@"

  # Wait for server to be ready, then open browser
  local app_url
  if [ "${1:-}" = "--dev" ]; then
    app_url="http://localhost:${DEV_PORT}"
  else
    app_url="http://${HOST}:${PORT}"
  fi

  (
    for i in $(seq 1 30); do
      if curl -s "http://${HOST}:${PORT}/api/models/" >/dev/null 2>&1; then
        open "$app_url"
        break
      fi
      sleep 0.5
    done
  ) &

  echo -e ""
  printf '  \033[38;5;135m▁▂▃\033[38;5;99m▅▇\033[38;5;51m█\033[38;5;99m▇▅\033[38;5;135m▃▂▁\033[0m'
  printf '  \033[1;32mLoqui is ready!\033[0m  '
  printf '\033[38;5;135m▁▂▃\033[38;5;99m▅▇\033[38;5;51m█\033[38;5;99m▇▅\033[38;5;135m▃▂▁\033[0m\n'
  echo -e ""
  echo -e "  ${CYAN}App:${NC}      ${app_url}"
  echo -e "  ${CYAN}API docs:${NC} http://${HOST}:${PORT}/docs"
  echo -e ""
  echo -e "  ${DIM}Select a model from the UI to get started${NC}"
  echo -e "  ${DIM}Press Ctrl+C to stop${NC}"
  echo -e ""

  wait
}

main "$@"
