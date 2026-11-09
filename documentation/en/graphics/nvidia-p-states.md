# NVIDIA P-States

P-state (Performance State) — the GPU's performance level.
Lower number = higher performance and power draw.
Range: **P0** (maximum) to **P12** (minimum).

## P-state Scale

| State | Name | When Used |
|---|---|---|
| **P0** | Maximum performance | Gaming, CUDA, rendering |
| **P1** | High performance | Heavy workloads |
| **P2** | Balanced | Medium workloads |
| P3-P7 | Intermediate | Rarely used on desktop GPUs |
| **P8** | Low power idle | **Idle with display active** |
| P10-P11 | Deep idle | Battery saving |
| **P12** | Minimum power | **Display off, deep sleep** |

## Example: GTX 1660 SUPER

| State | Core | Memory | Typical Power |
|---|---|---|---|
| **P0** | 300-2160 MHz | 7001 MHz | 50-125 W |
| P2 | 300-1500 MHz | 5001 MHz | ~40-60 W |
| **P8** | **300 MHz** | **405 MHz** | **15-24 W** ← idle target |
| P12 | 0 MHz | 0 MHz | ~5 W |

## How It Works

The GPU has independent power domains:
- **Graphics (core)** — frequency and voltage scale dynamically
- **Memory (VRAM)** — discrete levels (405/810/5001/6801/7001 MHz)
- **Video** — separate block for encode/decode
- **Display** — separate block, active while a monitor is connected

In P8, most GPU blocks are **power-gated** (powered off). Only the display engine stays active to drive the monitor output.

## Why GPU May Stay Stuck in P0

Common causes:

1. **KWin/Compositor in C+G mode** — KDE Plasma 6.7.0 switched rendering to OpenGL via DRM, keeping the GPU active
2. **High refresh rate** — on some GPUs >120 Hz blocks P8 (but GTX 1660 SUPER worked fine before at 165 Hz)
3. **GPU-accelerated apps** — browsers, terminals (Warp), Electron apps
4. **Driver 595+** — since 595.58.03 P-state behavior changed (CudaNoStablePerfLimit):
   - Before (590): after CUDA workload GPU dropped to P2, then P8
   - Now (595): GPU stays in P0 after workload
5. **Persistence Mode** — nvidia-persistenced keeps GPU initialized
6. **nvidia_drm.modeset=1** — KMS mode keeps DRM subsystem active

## How to Check Current P-state

```bash
nvidia-smi -q -d PERFORMANCE | grep "Performance State"
# Output: P0, P2, P8, etc.

nvidia-settings -q GPUPerfModes
# Shows all available levels with frequencies

nvidia-smi -q -d CLOCK
# Current core and memory clocks
```

## Available Levels: GTX 1660 SUPER

```
perf=0: nvclock=300,  memclock=405   ← P8 (idle)
perf=1: nvclock=300,  memclock=810
perf=2: nvclock=300,  memclock=5001
perf=3: nvclock=300,  memclock=6801
perf=4: nvclock=300,  memclock=7001   ← P0 (max)
```

## Clocks Event Reasons

Shows what is keeping the GPU from lowering its P-state:

```bash
nvidia-smi -q -d PERFORMANCE | grep -A10 "Clocks Event Reasons"
```

- `Idle` — Active: GPU thinks it's idle (but may be stuck in P0)
- `Display Clock Setting` — Active: display is blocking the downclock
- `Applications Clocks Setting` — Active: an app requested high clocks
- `SW Power Cap` — Active: power limit engaged

## References

- [NVIDIA Driver 595 — P-state changes (Treeru)](https://treeru.com/en/blog/nvidia-driver-595-blackwell-upgrade)
- [NVIDIA nvidia-smi documentation](https://developer.nvidia.com/nvidia-system-management-interface)
