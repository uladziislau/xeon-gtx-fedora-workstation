# 🆘 Troubleshooting & Incident Log

> Knowledge base of problems encountered while configuring Fedora 43 on Xeon v3 + NVIDIA.

**📖 [Documentation Index →](../README.md)** | **🇷🇺 [Русская версия →](../ru/troubleshooting/index.md)**

---

## 1. System Crashes

### 🔴 Kernel Panic / Freeze Under Load

*   **Symptoms**: Complete system freeze, sound loops, black screen.
*   **Culprit**: `scx_lavd` scheduler (version 1.0.x).
*   **Cause**: In Autopilot mode, scheduler overloaded **Core 0**, trying to handle all interrupts through it. On 36-thread CPU this led to `NULL pointer dereference`.
*   **Solution**: Switch to `scx_bpfland` (balance) or `scx_rustland` (interactivity).

---

### 🔴 Login Screen Freeze (Login Loop)

*   **Symptoms**: After entering password, system freezes completely.
*   **Culprit**: "Toxic" combination of variables in `/etc/environment`.
*   **Cause**:
    *   `KWIN_DRM_USE_MODIFIERS=1` (NVIDIA buffer conflict).
    *   `QSG_RHI_BACKEND=vulkan` (Plasma shell crash).
    *   `GSK_RENDERER=ngx` (GTK applications crash).
*   **Solution**: Remove these lines. Use only standard OpenGL/EGL.

---

### 🔴 Overheating at Idle (60°C)

*   **Symptoms**: Fans roar, CPU temperature 60°C at 1% load.
*   **Culprit**: Kernel parameter `intel_idle.max_cstate=1`.
*   **Cause**: Prevents CPU from entering power-saving states (C-states).
*   **Solution**: Remove parameter. Temperature dropped to 34°C. Responsiveness preserved thanks to `performance` governor.

---

## 2. Graphics Artifacts & Fonts

### 🟡 Pixelated / Jagged Fonts

*   **Symptoms**: Text in system monitor and browser looks like "stairs" without antialiasing.
*   **Cause 1 (System)**: Using `QSG_RHI_BACKEND=vulkan`.
*   **Cause 2 (Browser)**: Running through XWayland instead of native Wayland.
*   **Solution**:
    1. Remove `vulkan` from environment variables (return to OpenGL).
    2. Add `MOZ_ENABLE_WAYLAND=1` for Firefox/Zen.
    3. Use `--ozone-platform=wayland` for Chrome/Thorium.

---

### 🟡 Yandex Maps Lag (Stuttering)

*   **Symptoms**: 165 Hz monitor, but map moves in jerks ("jelly").
*   **Culprit**: WARP (Windows Advanced Rasterization Platform) — software rendering.
*   **Diagnostics**: `about:support` -> WebRender (Software).
*   **Solution**:
    *   In Zen: `gfx.webrender.use-warp = false` + `widget.dmabuf.force-enabled = true`.
    *   In Thorium: Use flags `--use-gl=angle --use-angle=gl`.

---

## 3. Video Decode Issues

### 🟠 "Should skip nVidia device named: nvidia-drm"

*   **Where**: Thorium / Chromium.
*   **Essence**: Driver "blacklist" is hardcoded in browser code.
*   **Solution**: Use flag `--vaapi-on-nvidia-gpus` (Thorium patch) or combination `--enable-features=VaapiVideoDecoder` + `--disable-features=VaapiVideoDecodeLinuxGL` (for regular Chrome).

---

### 🟠 "Failed to initialize frame pool"

*   **Where**: Thorium.
*   **Essence**: Memory resource conflict during decoding.
*   **Cause**: Simultaneous enabling of `DrDc` (compositor in separate thread), `CanvasOopRasterization` and `Vulkan`.
*   **Solution**: Disable experimental features, leave only basic VA-API and OpenGL.

---

### 🟠 YouTube 4K Slowdown

*   **Cause**: **AV1** codec. GTX 1660 Super **does not support** it. Load falls on CPU.
*   **Solution**:
    *   In browser: **enhanced-h264ify** extension (Block AV1).
    *   In Thorium: Flag `--disable-features=Av1VideoDecoder`.
    *   Result: YouTube delivers VP9, which works hardware-accelerated.

---

## 4. Useful Diagnostic Commands

**Check if browser sees variables:**

```bash
env | grep MOZ
```

**Check VA-API codec support:**

```bash
vainfo --display wayland
```

**Check GPU video decode load:**

```bash
nvidia-smi dmon -s u
```
