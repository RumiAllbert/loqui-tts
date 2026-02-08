#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
#  Loqui TTS — Quick Start
#  Run ./setup.sh first if this is your first time
# ─────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT/.venv"

HOST="${LOQUI_HOST:-127.0.0.1}"
PORT="${LOQUI_PORT:-8000}"

# ── Colors & formatting ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log() { echo -e "${BLUE}│${NC} $1"; }

# ── Waveform animation ───────────────────────────────────
_BLOCKS=(" " "▁" "▂" "▃" "▄" "▅" "▆" "▇" "█")

_WAVE=(0 1 3 5 7 8 7 5 3 1 0 0 1 2 5 7 8 8 7 5 2 1 0 0 1 3 5 7 8 7 5 3 1 0 0 0 1 2 1 0)
_WAVE_LEN=40

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

  for pct in 12 25 40 55 70 85 100; do
    _render_wave "$pct"
    sleep 0.06
  done

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

  _render_wave 100

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

# ── Preflight ────────────────────────────────────────────
if [ ! -d "$VENV" ]; then
  echo -e "${RED}✗${NC} No virtual environment found. Run ${BOLD}./setup.sh${NC} first."
  exit 1
fi

# ── Intro ────────────────────────────────────────────────
show_intro

# ── Cleanup on exit ──────────────────────────────────────
cleanup() {
  echo -e ""
  echo -e "${PURPLE}┌─${BOLD} Shutting down${NC}"
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    log "Stopping server (unloading model, freeing memory)..."
    kill -INT "$SERVER_PID" 2>/dev/null || true
    for i in $(seq 1 10); do
      kill -0 "$SERVER_PID" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$SERVER_PID" 2>/dev/null && kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo -e "${PURPLE}└─${GREEN} Clean shutdown complete${NC}"
  show_goodbye
}
SERVER_PID=""
trap cleanup EXIT INT TERM

# ── Start server ─────────────────────────────────────────
source "$VENV/bin/activate"

python -m uvicorn backend.main:app \
  --host "$HOST" \
  --port "$PORT" \
  --log-level info &
SERVER_PID=$!

# Wait for server to be ready, then open browser
(
  for i in $(seq 1 30); do
    if curl -s "http://${HOST}:${PORT}/api/models/" >/dev/null 2>&1; then
      open "http://${HOST}:${PORT}"
      break
    fi
    sleep 0.5
  done
) &

echo -e ""
printf '  \033[38;5;135m▁▂▃\033[38;5;99m▅▇\033[38;5;51m█\033[38;5;99m▇▅\033[38;5;135m▃▂▁\033[0m'
printf '  \033[1;32mLoqui is running\033[0m  '
printf '\033[38;5;135m▁▂▃\033[38;5;99m▅▇\033[38;5;51m█\033[38;5;99m▇▅\033[38;5;135m▃▂▁\033[0m\n'
echo -e ""
echo -e "  ${CYAN}App:${NC}      http://${HOST}:${PORT}"
echo -e "  ${CYAN}API docs:${NC} http://${HOST}:${PORT}/docs"
echo -e ""
echo -e "  ${DIM}Select & load a model from the UI${NC}"
echo -e "  ${DIM}Press Ctrl+C to stop${NC}"
echo -e ""

wait
