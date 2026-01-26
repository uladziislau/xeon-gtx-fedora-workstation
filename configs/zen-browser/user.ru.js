// =============================================================================
// ZEN BROWSER CONFIG v18 (HYBRID ULTIMA) - 2026
// =============================================================================
// СИСТЕМА: Xeon E5-2696 v3 (36 Threads) | 64GB RAM | GTX 1660 SUPER
// ГРАФИКА: Fix for NVIDIA 580 + Wayland (GPU Process Disabled)
// =============================================================================

// [СЕКЦИЯ 1: ГРАФИКА (CRASH FIX & NVIDIA UNLOCK)]
// -----------------------------------------------------------------------------
user_pref("gfx.webrender.all", true);                  // WebRender везде
user_pref("gfx.webrender.enabled", true);
user_pref("layers.acceleration.force-enabled", true);  // Игнорировать блок-листы
user_pref("webgl.force-enabled", true);                // Форсировать WebGL
user_pref("gfx.x11-egl.force-enabled", true);
user_pref("widget.dmabuf.force-enabled", true);        // Zero-copy текстуры

// [ГЛАВНЫЙ ФИКС: ОТКЛЮЧАЕМ ИЗОЛЯЦИЮ GPU]
// Это предотвращает падение драйвера NVIDIA в Wayland и снимает blocklist
user_pref("layers.gpu-process.enabled", false);
user_pref("layers.gpu-process.force-enabled", false);
user_pref("gfx.work-around-driver-bugs", false);

// [ЗАПРЕТ ПРОГРАММНОЙ ЭМУЛЯЦИИ (WARP KILLER)]
user_pref("gfx.webrender.use-warp", false);            // ЗАПРЕТ WARP
user_pref("gfx.webrender.software", false);            // ЗАПРЕТ Software
user_pref("gfx.webrender.fallback.software", false);   // ЗАПРЕТ отката
user_pref("gfx.webrender.reject-software-driver", true);

// [СЕКЦИЯ 2: СИНХРОНИЗАЦИЯ И ЭКРАН (165Hz)]
// -----------------------------------------------------------------------------
user_pref("layout.frame_rate", 0);                     // Синхронизация с монитором
user_pref("widget.wayland.vsync.enabled", true);
user_pref("gfx.webrender.max-partial-present-rects", 0);
user_pref("gfx.webrender.precache-shaders", true);
user_pref("gfx.webrender.program-binary-disk", false); // Кэш шейдеров в RAM

// [СЕКЦИЯ 3: ЦВЕТ И ШРИФТЫ (HDR 10-BIT)]
// -----------------------------------------------------------------------------
user_pref("layout.css.devPixelsPerPx", "1.15"); // Отключено, используем системный DPI
user_pref("gfx.webrender.quality.force-subpixel-aa-where-possible", true);
user_pref("gfx.text.disable-aa", false);
user_pref("gfx.font_rendering.cleartype_params.cleartype_level", 100);
user_pref("gfx.content.azure.backends", "skia");
user_pref("gfx.color_management.mode", 1);
user_pref("gfx.color_management.enablev4", true);
user_pref("gfx.color_management.native_srgb", true);
user_pref("gfx.webrender.10bit-format", true);

// [СЕКЦИЯ 4: ЯНДЕКС.КАРТЫ И CANVAS (PERFORMANCE)]
// -----------------------------------------------------------------------------
user_pref("gfx.canvas.accelerated", true);
user_pref("gfx.canvas.accelerated.async", true);       // Асинхронная отрисовка
user_pref("gfx.canvas.accelerated.cache-items", 65536);// Максимальный кэш элементов
user_pref("gfx.canvas.accelerated.cache-size", 2048);  // 2GB видеопамяти под Canvas
user_pref("layout.display-list.retain", true);
user_pref("layout.display-list.retain.chrome", true);
user_pref("layers.tiles.max-pool-size", 256);
user_pref("webgl.out-of-process", true);               // WebGL оставляем отдельно

// [СЕКЦИЯ 5: ВИДЕО (VA-API / NVDEC)]
// -----------------------------------------------------------------------------
user_pref("media.ffmpeg.vaapi.enabled", true);
user_pref("media.hardware-video-decoding.force-enabled", true);
user_pref("media.ffvpx.enabled", false);               // Софтовый декодер OFF
user_pref("media.prefer-non-ffvpx", true);             // Системный ffmpeg ON
user_pref("media.rdd-ffmpeg.enabled", true);
user_pref("media.ffmpeg.vaapi.force-surface-zero-copy", 2);

// [СЕКЦИЯ 6: XEON 36-THREADS (FULL POWER)]
// -----------------------------------------------------------------------------
user_pref("dom.ipc.processCount", 18);                 // 32 процесса
user_pref("dom.ipc.processCount.webIsolated", 18);
user_pref("javascript.options.parallel_parsing", true);
user_pref("javascript.options.wasm", true);
user_pref("dom.workers.max_per_domain", 100);
user_pref("dom.worker.limit", 100);
user_pref("image.parallel.decode.limit.multiplier", 9);
user_pref("dom.ipc.scheduler.useActiveTabPriority", true);
user_pref("dom.ipc.processPriorityManager.enabled", false); // Приоритет за Linux
user_pref("javascript.options.mem.gc_incremental_slice_ms", 20);
user_pref("javascript.options.mem.high_water_mark", 8192); // 8GB куча JS

// [СЕКЦИЯ 7: 64GB RAM (RAMDISK MODE)]
// -----------------------------------------------------------------------------
user_pref("browser.cache.disk.enable", false);         // SSD не трогаем
user_pref("browser.cache.memory.enable", true);
user_pref("browser.cache.memory.capacity", 20971520);  // 20 ГБ кэша в RAM
user_pref("browser.cache.memory.max_entry_size", 512000);
user_pref("image.mem.max_decoded_image_kb", 8388608);  // 8 ГБ под картинки
user_pref("browser.sessionhistory.max_total_viewers", 20);
user_pref("browser.tabs.unloadOnLowMemory", true);

// [СЕКЦИЯ 8: СЕТЬ И LATENCY]
// -----------------------------------------------------------------------------
user_pref("network.http.http3.enable", true);
user_pref("network.predictor.enabled", true);
user_pref("network.http.max-connections", 1200);
user_pref("network.http.max-persistent-connections-per-server", 36);
user_pref("nglayout.initialpaint.delay", 0);
user_pref("content.notify.interval", 0);
user_pref("content.notify.ontimer", true);
user_pref("security.sandbox.content.level", 1);        // Ускорение IPC