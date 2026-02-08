"""Detect best available compute device."""

import torch


def detect_device() -> dict:
    """Detect CUDA > MPS > CPU and return device info."""
    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        return {
            "device": "cuda",
            "name": name,
            "label": f"CUDA ({name})",
        }
    if torch.backends.mps.is_available():
        return {
            "device": "mps",
            "name": "Apple Silicon",
            "label": "Apple Silicon MPS",
        }
    return {
        "device": "cpu",
        "name": "CPU",
        "label": "CPU",
    }


def get_torch_device() -> torch.device:
    """Return torch.device for the best available hardware."""
    info = detect_device()
    return torch.device(info["device"])
