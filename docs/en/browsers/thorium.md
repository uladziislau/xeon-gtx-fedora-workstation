# 🔵 Thorium Browser: AVX2 Speed Monster

> Thorium is used as **specialized tool** for tasks where Gecko engine (Zen) fails: heavy WebGL maps (Yandex), Google AI Studio, and 8K video.

**📖 [Documentation Index →](../README.md)** | **🇷🇺 [Русская версия →](../ru/browsers/thorium.md)**

---

## 1. Advantages

*   **AVX2**: Build with `-march=haswell` flags, using native Xeon v3 instructions.
*   **ANGLE**: Blink engine can use ANGLE layer for OpenGL call translation, providing **perfect 165 FPS** in Yandex Maps on NVIDIA.
*   **VA-API**: Thorium has unique patch allowing to bypass NVIDIA driver blacklist on Linux.

---

## 2. Configuration (~/.config/thorium-flags.conf)

Thorium ignores standard config files in some RPM builds, so we use this file to generate flags, then embed them in launcher.

```bash
# --- GRAPHICS (ANGLE) ---
--ozone-platform-hint=auto
--ozone-platform=wayland
--use-gl=angle
--use-angle=gl
--ignore-gpu-blocklist
--disable-gpu-driver-bug-workarounds

# --- VIDEO (NVIDIA UNLOCK) ---
--enable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL
--disable-features=UseChromeOSDirectVideoDecoder,Av1VideoDecoder

# --- PERFORMANCE ---
--enable-zero-copy
--enable-gpu-rasterization
--num-raster-threads=4
--force-gpu-mem-available-mb=4096

# --- HDR (WORKAROUND) ---
--force-color-profile=hdr10
--enable-hdr
```

### Important About AV1

GTX 1660 Super **cannot** decode AV1 hardware-accelerated.  
Flag `--disable-features=Av1VideoDecoder` forces YouTube to deliver video in **VP9** format, which card decodes hardware-accelerated.

---

## 3. Launcher

Since Thorium is finicky, we create custom `.desktop` file that hardcodes required arguments.

```
Exec=/usr/bin/thorium-browser %U
```

*(Arguments taken from config or written directly if package version doesn't read config).*

---

## 4. Result

*   **Yandex Maps**: Absolutely smooth scroll and zoom.
*   **Video**: VP9 4K HDR works via GPU.
*   **Fonts**: Sharp (native Wayland).
