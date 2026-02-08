"""System information endpoint."""

import os
import platform
import subprocess
import sys

import psutil
from fastapi import APIRouter

from backend.dependencies import get_model_manager

router = APIRouter(prefix="/system", tags=["system"])


def _get_chip_name() -> str:
    """Get Apple Silicon chip name via sysctl."""
    try:
        result = subprocess.run(
            ["sysctl", "-n", "machdep.cpu.brand_string"],
            capture_output=True, text=True, timeout=2,
        )
        return result.stdout.strip() or "Apple Silicon"
    except Exception:
        return "Apple Silicon"


def _get_gpu_cores() -> int | None:
    """Get GPU core count from system_profiler."""
    try:
        result = subprocess.run(
            ["system_profiler", "SPDisplaysDataType"],
            capture_output=True, text=True, timeout=5,
        )
        for line in result.stdout.splitlines():
            if "Total Number of Cores" in line:
                return int(line.split(":")[-1].strip())
    except Exception:
        pass
    return None


def _get_neural_engine_cores() -> int | None:
    """Estimate Neural Engine cores based on chip."""
    chip = _get_chip_name().lower()
    if "m4" in chip:
        return 16
    if "m3" in chip or "m2" in chip:
        return 16
    if "m1" in chip:
        return 16
    return None


@router.get("/info")
async def get_system_info():
    """Return comprehensive system information."""
    import mlx.core as mx

    # CPU
    cpu_count_physical = psutil.cpu_count(logical=False) or 0
    cpu_count_logical = psutil.cpu_count(logical=True) or 0
    cpu_freq = psutil.cpu_freq()
    cpu_percent = psutil.cpu_percent(interval=0.1)

    # Memory
    mem = psutil.virtual_memory()

    # Disk
    disk = psutil.disk_usage("/")

    # GPU / Metal
    gpu_cores = _get_gpu_cores()
    neural_cores = _get_neural_engine_cores()

    # MLX memory (prefer new API, fall back to deprecated)
    try:
        metal_active = mx.get_active_memory() / (1024 ** 3)
        metal_peak = mx.get_peak_memory() / (1024 ** 3)
        metal_cache = mx.get_cache_memory() / (1024 ** 3)
    except AttributeError:
        try:
            metal_active = mx.metal.get_active_memory() / (1024 ** 3)
            metal_peak = mx.metal.get_peak_memory() / (1024 ** 3)
            metal_cache = mx.metal.get_cache_memory() / (1024 ** 3)
        except Exception:
            metal_active = metal_peak = metal_cache = 0

    # Software versions
    try:
        import mlx_audio
        mlx_audio_version = getattr(mlx_audio, "__version__", "unknown")
    except Exception:
        mlx_audio_version = "unknown"

    try:
        mlx_version = mx.__version__
    except Exception:
        mlx_version = "unknown"

    # Loaded model
    mm = get_model_manager()
    loaded_variant = mm.get_loaded_variant()

    return {
        "chip": _get_chip_name(),
        "os": f"macOS {platform.mac_ver()[0]}",
        "cpu": {
            "cores_physical": cpu_count_physical,
            "cores_logical": cpu_count_logical,
            "frequency_mhz": round(cpu_freq.current) if cpu_freq else None,
            "usage_percent": cpu_percent,
        },
        "memory": {
            "total_gb": round(mem.total / (1024 ** 3), 1),
            "available_gb": round(mem.available / (1024 ** 3), 1),
            "used_gb": round(mem.used / (1024 ** 3), 1),
            "percent": mem.percent,
        },
        "gpu": {
            "cores": gpu_cores,
            "neural_engine_cores": neural_cores,
            "metal_active_gb": round(metal_active, 2),
            "metal_peak_gb": round(metal_peak, 2),
            "metal_cache_gb": round(metal_cache, 2),
        },
        "disk": {
            "total_gb": round(disk.total / (1024 ** 3), 1),
            "free_gb": round(disk.free / (1024 ** 3), 1),
            "percent": disk.percent,
        },
        "software": {
            "python": platform.python_version(),
            "mlx": mlx_version,
            "mlx_audio": mlx_audio_version,
        },
        "model": {
            "loaded_variant": loaded_variant,
        },
    }
