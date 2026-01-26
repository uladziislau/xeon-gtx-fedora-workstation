# 🔴 Zen Browser: God Mode Configuration

> Zen (Firefox fork) is used as **primary browser**. It perfectly integrates with Wayland, supports HDR and color profiles, but has performance issues with Canvas (Yandex Maps) on NVIDIA.

**📂 [Configuration Files →](../../configs/zen-browser/)** | **📖 [Documentation Index →](../README.md)** | **🇷🇺 [Русская версия →](../ru/browsers/zen.md)**

---

## 1. Problem: Yandex Maps & Lag

Gecko engine (Firefox) historically has poor compatibility with proprietary NVIDIA drivers on Linux. We tried all combinations.

*   **WARP (Software Renderer)**: Caused severe slowdowns and CPU load. We **disabled** it (`gfx.webrender.use-warp = false`).
*   **GPU Isolation**: On driver 580, GPU process frequently crashed. Solution: disable isolation (`layers.gpu-process.enabled = false`), forcing browser to render everything in main thread, but using GPU.

---

## 2. user.js Configuration

Ready configuration file is in repository:
- **[user.js](../../configs/zen-browser/user.js)** - English comments
- **[user.ru.js](../../configs/zen-browser/user.ru.js)** - Russian comments

Copy file to browser profile folder (`about:support` -> Profile Folder).

### Key Settings:

```javascript
// --- GRAPHICS & NVIDIA ---
user_pref("gfx.webrender.all", true);
user_pref("gfx.webrender.enabled", true);
user_pref("layers.acceleration.force-enabled", true);
user_pref("widget.dmabuf.force-enabled", true);        // Critical for Wayland
user_pref("gfx.webrender.compositor", false);          // Disable native compositor (fix stutters)

// --- WARP KILLER ---
user_pref("gfx.webrender.use-warp", false); 
user_pref("gfx.webrender.software", false);
user_pref("gfx.webrender.fallback.software", false);

// --- HDR & COLOR ---
user_pref("gfx.webrender.10bit-format", true);
user_pref("gfx.color_management.native_srgb", true);
user_pref("gfx.color_management.mode", 1);

// --- YANDEX MAPS (CANVAS) ---
user_pref("gfx.canvas.accelerated", true);
user_pref("gfx.canvas.accelerated.async", true);       // Async canvas
user_pref("gfx.canvas.accelerated.cache-items", 32768);
user_pref("gfx.canvas.accelerated.cache-size", 512);

// --- VIDEO (VA-API) ---
user_pref("media.ffmpeg.vaapi.enabled", true);
user_pref("media.hardware-video-decoding.force-enabled", true);
user_pref("media.ffvpx.enabled", false);               // GPU decoding only
user_pref("media.prefer-non-ffvpx", true);
user_pref("media.rdd-ffmpeg.enabled", true);

// --- XEON 36-THREADS ---
user_pref("dom.ipc.processCount", 32);                 // 32 content processes
user_pref("dom.ipc.processCount.webIsolated", 32);
user_pref("javascript.options.parallel_parsing", true);
user_pref("image.parallel.decode.limit.multiplier", 9);

// --- 64GB RAM ---
user_pref("browser.cache.disk.enable", false);         // Disable disk
user_pref("browser.cache.memory.enable", true);
user_pref("browser.cache.memory.capacity", 10485760);  // 10 GB cache in RAM
```

---

## 3. Summary

With this config, Zen:
*   Displays perfect fonts (native Wayland).
*   Shows HDR content.
*   Instantly opens pages from RAM cache.
*   **BUT**: Yandex Maps may still lag (engine limitation). Use Thorium for them.
