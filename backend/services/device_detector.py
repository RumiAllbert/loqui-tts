"""Detect compute device — MLX on Apple Silicon."""


def detect_device() -> dict:
    """Return MLX device info for Apple Silicon."""
    return {
        "device": "mlx",
        "name": "Apple Silicon",
        "label": "Apple Silicon (MLX)",
    }
