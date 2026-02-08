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

# ── Colors ──────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Preflight ───────────────────────────────────────────
if [ ! -d "$VENV" ]; then
  echo -e "${RED}✗${NC} No virtual environment found. Run ${BOLD}./setup.sh${NC} first."
  exit 1
fi

# ── Banner ──────────────────────────────────────────────
echo -e ""
echo -e "  ${PURPLE}${BOLD}╔═══════════════════════════════════════╗${NC}"
echo -e "  ${PURPLE}${BOLD}║${NC}   ${CYAN}${BOLD}L o q u i   T T S${NC}              ${PURPLE}${BOLD}║${NC}"
echo -e "  ${PURPLE}${BOLD}║${NC}   ${DIM}Beautiful local text-to-speech${NC}      ${PURPLE}${BOLD}║${NC}"
echo -e "  ${PURPLE}${BOLD}╚═══════════════════════════════════════╝${NC}"
echo -e ""

# ── Cleanup on exit ─────────────────────────────────────
cleanup() {
  echo -e "\n${DIM}Shutting down...${NC}"
  kill "$SERVER_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo -e "${DIM}Goodbye!${NC}"
}
trap cleanup EXIT INT TERM

# ── Start server ────────────────────────────────────────
source "$VENV/bin/activate"

echo -e "  ${GREEN}✓${NC} ${BOLD}Loqui is running${NC}"
echo -e ""
echo -e "  ${CYAN}App:${NC}      http://${HOST}:${PORT}"
echo -e "  ${CYAN}API docs:${NC} http://${HOST}:${PORT}/docs"
echo -e ""
echo -e "  ${DIM}Select & load a model from the UI${NC}"
echo -e "  ${DIM}Press Ctrl+C to stop${NC}"
echo -e ""

python -m uvicorn backend.main:app \
  --host "$HOST" \
  --port "$PORT" \
  --log-level info &
SERVER_PID=$!

wait
