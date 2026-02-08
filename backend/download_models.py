#!/usr/bin/env python3
"""Pre-download Chatterbox model weights with progress display."""

import contextlib
import functools
import sys
import time

PURPLE = "\033[0;35m"
GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[0;33m"
RED = "\033[0;31m"
DIM = "\033[2m"
BOLD = "\033[1m"
NC = "\033[0m"


def check_hf_login() -> bool:
    """Check if user is logged into HuggingFace."""
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        api.whoami()
        return True
    except Exception:
        return False


def ensure_hf_login():
    """Ensure user is logged into HuggingFace, prompt if not."""
    if check_hf_login():
        print(f"{GREEN}✓{NC} HuggingFace authenticated")
        return

    print(f"{YELLOW}!{NC} HuggingFace login required (models are gated)")
    print(f"{PURPLE}│{NC} Get your token at: {CYAN}https://huggingface.co/settings/tokens{NC}")
    print(f"{PURPLE}│{NC} Make sure you've accepted the model license at:")
    print(f"{PURPLE}│{NC}   {CYAN}https://huggingface.co/ResembleAI/chatterbox{NC}")
    print()

    from huggingface_hub import login
    login()

    if not check_hf_login():
        print(f"{RED}✗{NC} Login failed. Please try again.")
        sys.exit(1)
    print(f"{GREEN}✓{NC} HuggingFace authenticated")


@contextlib.contextmanager
def _patch_torch_load_for_device(device: str):
    """Patch torch.load to add map_location for non-CUDA devices."""
    import torch

    if device in ("cpu", "mps"):
        original = torch.load
        map_loc = torch.device("cpu")

        @functools.wraps(original)
        def patched(*args, **kwargs):
            if "map_location" not in kwargs:
                kwargs["map_location"] = map_loc
            return original(*args, **kwargs)

        torch.load = patched
        try:
            yield
        finally:
            torch.load = original
    else:
        yield


def download_model(variant: str):
    """Download a model variant by loading then discarding it."""
    import torch

    if torch.cuda.is_available():
        device = "cuda"
        device_label = torch.cuda.get_device_name(0)
    elif torch.backends.mps.is_available():
        device = "mps"
        device_label = "Apple Silicon MPS"
    else:
        device = "cpu"
        device_label = "CPU"

    print(f"{PURPLE}│{NC} Device: {CYAN}{device_label}{NC}")

    sizes = {"turbo": "350M", "standard": "500M", "multilingual": "500M"}
    print(f"{PURPLE}│{NC} Loading {BOLD}{variant}{NC} ({sizes.get(variant, '?')} params)...")

    start = time.time()

    if variant == "turbo":
        from chatterbox.tts_turbo import ChatterboxTurboTTS
        model = ChatterboxTurboTTS.from_pretrained(device)
    elif variant == "standard":
        from chatterbox.tts import ChatterboxTTS
        model = ChatterboxTTS.from_pretrained(device)
    elif variant == "multilingual":
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        with _patch_torch_load_for_device(device):
            model = ChatterboxMultilingualTTS.from_pretrained(device)
    else:
        print(f"{RED}✗{NC} Unknown variant: {variant}", file=sys.stderr)
        sys.exit(1)

    elapsed = time.time() - start
    del model
    if device == "cuda":
        torch.cuda.empty_cache()

    print(f"{GREEN}✓{NC} {BOLD}{variant}{NC} model ready ({elapsed:.0f}s)")


def main():
    variants = sys.argv[1:] if len(sys.argv) > 1 else ["turbo"]

    ensure_hf_login()
    print()

    for variant in variants:
        download_model(variant)


if __name__ == "__main__":
    main()
