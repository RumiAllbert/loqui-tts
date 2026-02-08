#!/usr/bin/env python3
"""Pre-download MLX Audio model weights with progress display."""

import sys
import time

from backend.config import MODEL_REPOS

PURPLE = "\033[0;35m"
GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[0;33m"
RED = "\033[0;31m"
DIM = "\033[2m"
BOLD = "\033[1m"
NC = "\033[0m"

SIZES = {
    "turbo-fp16": "~4GB",
    "turbo-8bit": "~2GB",
    "turbo-4bit": "~1GB",
    "qwen-0.6b": "~1.2GB",
    "qwen-1.7b": "~3.4GB",
}


def download_model(variant: str):
    """Download a model variant by loading then discarding it."""
    from mlx_audio.tts.generate import load_model

    repo = MODEL_REPOS.get(variant)
    if not repo:
        print(f"{RED}✗{NC} Unknown variant: {variant}", file=sys.stderr)
        print(f"{DIM}  Available: {', '.join(MODEL_REPOS.keys())}{NC}", file=sys.stderr)
        sys.exit(1)

    print(f"{PURPLE}│{NC} Device: {CYAN}Apple Silicon (MLX){NC}")
    print(f"{PURPLE}│{NC} Loading {BOLD}{variant}{NC} ({SIZES.get(variant, '?')})...")

    start = time.time()
    model = load_model(repo, lazy=False)
    elapsed = time.time() - start

    del model
    print(f"{GREEN}✓{NC} {BOLD}{variant}{NC} model ready ({elapsed:.0f}s)")


def main():
    variants = sys.argv[1:] if len(sys.argv) > 1 else ["turbo-4bit"]

    print()
    for variant in variants:
        download_model(variant)


if __name__ == "__main__":
    main()
