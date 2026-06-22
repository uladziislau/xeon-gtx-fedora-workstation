# NVIDIA GPU Idle Power Investigation

**Date:** 2026-06-21
**System:** Fedora 44 KDE, CachyOS 7.0.12, NVIDIA 595.80
**GPU:** GTX 1660 SUPER, 2560×1440 @ 165 Hz (DP-3)
**Session:** Wayland (KWin 6.7.0)

## Symptom

Idle power draw increased from **~24 W** to **~49 W** after a system update.
GPU stuck at **P0** (performance state), memory clock at **7000 MHz** (max).

## Root Cause

**KWin 6.7.0 (Plasma 6.7.0) changed the rendering path on NVIDIA + Wayland.**

- Before (KWin 6.6.5): kwin_wayland showed as type `C` (compute only)
- After (KWin 6.7.0): kwin_wayland shows as type `C+G` (compute + graphics)

The `C+G` mode keeps the GPU in **P0** with **memory clock locked at 7000 MHz**,
preventing it from dropping to the idle P8 state (memory clock 405 MHz).

### Contributing Factors

| Factor | Impact | Notes |
|---|---|---|
| KWin 6.7.0 `C+G` | High | Primary cause — keeps GPU in P0 |
| NVIDIA 595 driver series | Medium | P-state behavior: P0 stays after workload (since 595.58.03) |
| Power profile = Performance | Low | Minimal direct effect on NVIDIA GPU |
| Browser with GPU accel | Variable | Thorium/Warp add load on top |
| 165 Hz refresh rate | None | Worked fine before at same refresh rate |

## Investigation Commands

### Initial diagnostics
```bash
nvidia-smi                                          # overall state
nvidia-smi -q -d POWER                              # power readings
nvidia-smi -q -d CLOCK                              # clock speeds
nvidia-smi -q -d PERFORMANCE                        # P-state & clock reasons
nvidia-smi pmon -c 5                                # per-process GPU usage
nvidia-settings -q GPUPowerMizerMode -t             # 0=Adaptive, 1=PreferMax, 2=Auto
nvidia-settings -q GPUPerfModes                     # available P-states
nvidia-settings -q GPUCurrentClockFreqsString       # current clocks
```

### Check P-state vs power profile
```bash
powerprofilesctl get                                # current profile
powerprofilesctl set balanced                       # test balanced
powerprofilesctl set power-saver                    # test power-saver
```

### Check live GPU utilization per process
```bash
nvidia-smi pmon -d 2                                # continuous monitoring
```

### Performance states available (GTX 1660 SUPER)
| Level | Graphics | Memory | Description |
|---|---|---|---|
| perf=0 | 300 MHz | 405 MHz | P8 true idle |
| perf=1 | 300 MHz | 810 MHz | |
| perf=2 | 300 MHz | 5001 MHz | |
| perf=3 | 300 MHz | 6801 MHz | |
| perf=4 | 300 MHz | 7001 MHz | P0 — current locked state |

### Key indicators in `nvidia-smi -q -d PERFORMANCE`
```
Performance State: P0
Clocks Event Reasons:
    Idle: Active               → GPU knows it's idle
    Display Clock Setting: Not Active → display NOT the reason for P0
```

## FIX Attempts & Results

### What did NOT help
- Switching power profile (balanced/power-saver barely changed GPU power)
- The GPU stayed in P0 regardless of power profile

### What would help (confirmed working)

1. **Revert KWin to 6.6.5** (from Plasma 6.7.0):
   ```bash
   sudo dnf downgrade kwin kwin-common kwin-libs
   ```

2. **Lock GPU clocks to minimum** (test only, not persistent):
   ```bash
   sudo nvidia-smi --lock-gpu-clocks=300,300
   sudo nvidia-smi --lock-memory-clocks=405,405
   ```

3. **Add Dynamic Power Management** (tunable, requires reboot):
   ```bash
   echo 'options nvidia NVreg_DynamicPowerManagement=0x01' | \
     sudo tee /etc/modprobe.d/nvidia-dpm.conf
   sudo dracut --force
   ```

4. **Downgrade to NVIDIA 590 series driver** (before P0 behavior change):
   ```bash
   sudo dnf downgrade xorg-x11-drv-nvidia kmod-nvidia
   ```

### Monitoring tips
- Always close GPU-heavy apps (browsers, terminals with GPU accel) before measuring idle
- Wait 5-10 seconds after process exit for clock to stabilize
- Check `nvidia-smi pmon` to see which processes are `C+G` vs `C` or `G`

## Related

- [NVIDIA 595 driver P-state change (Treeru)](https://treeru.com/en/blog/nvidia-driver-595-blackwell-upgrade)
- [KDE Plasma 6.7.0 changelog](https://kde.org/announcements/plasma/6/6.7.0/)
