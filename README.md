# Zen Browser Workstation Configuration

[Русская версия](README.ru.md)

High‑performance `user.js` for Zen Browser on Linux workstations.  
Optimized for maximum responsiveness, stable 165 Hz rendering, and heavy SPA/WebGPU workloads.

## Hardware baseline
- 2560×1440 @ **165 Hz**
- Intel Xeon (18 cores / 36 threads)
- **64 GB RAM**
- NVIDIA **GTX 1660 Super**
- NVMe SSD
- Fedora Linux (Wayland, KDE Plasma)

## Key features
- WebRender fully enabled (Warp, DMA‑BUF, no partial present)
- Vulkan WebGPU backend
- Aggressive RAM caching (4 GB memory cache, 2 GB decoded images)
- 24 content processes, 8 extension processes
- Optimized IPC scheduler (8 threads, preemption)
- Wayland vsync + opaque region
- Smooth scrolling tuned for 165 Hz
- Telemetry disabled

## Installation
Place `user.js` into your Zen Browser profile:
```
~/.zen/<profile>/user.js
```

Restart the browser.

## Notes
Designed for powerful workstations.  
Not recommended for low‑RAM systems or laptops.

## License
MIT