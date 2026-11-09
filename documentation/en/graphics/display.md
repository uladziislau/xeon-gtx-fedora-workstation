# 🎨 Graphics & Display: NVIDIA + Wayland + HDR

> Complete guide for configuring graphics subsystem for GTX 1660 SUPER and KDE Plasma 6 combination.

**📖 [Documentation Index →](../README.md)** | **🛠️ [System Setup →](../system/core-setup.md)** | **🇷🇺 [Русская версия →](../ru/graphics/display.md)**

---

## 1. Global Environment Variables (/etc/environment)

This file controls driver and application behavior at system level.

```bash
LIBVA_DRIVER_NAME=nvidia
NVD_BACKEND=direct

# Enables native Wayland for Firefox/Zen (removes pixelated fonts)
MOZ_ENABLE_WAYLAND=1

# Allows browsers to use GPU even if driver is marked as "unstable"
MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
MOZ_DISABLE_HW_COMPOSITING_BLOCKLIST=1
MOZ_DISABLE_RDD_SANDBOX=1
MOZ_WEBRENDER=1

# Latency optimization for NVIDIA 580+ (Explicit Sync)
__GL_MaxFramesAllowed=1
__GL_GSYNC_ALLOWED=0

# Critical for font beauty
FREETYPE_PROPERTIES="truetype:interpreter-version=40"

# HDR activation
ENABLE_HDR_WSI=1

# Helps Chromium browsers (Thorium)
EGL_PLATFORM=wayland
__GLX_VENDOR_LIBRARY_NAME=nvidia
```

### ⚠️ Dangerous Parameters (Do Not Use!)

The following flags caused system freeze on login or broke fonts on Fedora 43:
*   `KWIN_DRM_USE_MODIFIERS=1` (NVIDIA buffer conflict)
*   `QSG_RHI_BACKEND=vulkan` (Plasma shell crash)
*   `GSK_RENDERER=ngx` (GTK applications crash)

---

## 2. Fonts & Scaling

Goal: Perfect clarity on 27" 2K monitor (108-120 DPI).

### Configuration:

*   **Font**: Inter (Variable) for interface, JetBrains Mono for code.
*   **Antialiasing**: RGB, Slight Hinting.
*   **Force Font DPI**: 120 (set via `kwriteconfig6`).

### Fontconfig (~/.config/fontconfig/fonts.conf):

We forcibly remap standard fonts to Inter for all applications.

```xml
<alias>
  <family>sans-serif</family>
  <prefer><family>Inter</family></prefer>
</alias>
```

---

## 3. HDR & Color Management

Monitor: AOC AG275QXN (VA, 165Hz, HDR10).

*   **SDR Brightness**: Set to 55-60% so white color in regular windows doesn't blind.
*   **Color Profile**: Loaded official AG275QXN.icm for SDR mode.
*   **In HDR mode**: Color management is handled by Wayland protocol (PQ).

---

## 4. Applying Changes

After editing `/etc/environment`, restart session:

```bash
loginctl terminate-session self
```

Verify variables are loaded:

```bash
env | grep MOZ
```
