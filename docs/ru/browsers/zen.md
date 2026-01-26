# 🔴 Zen Browser: God Mode Configuration

> Zen (форк Firefox) используется как **основной браузер**. Он идеально интегрируется с Wayland, поддерживает HDR и цветовые профили, но имеет проблемы с производительностью Canvas (Яндекс.Карты) на NVIDIA.

**📂 [Configuration Files →](../../configs/zen-browser/)** | **📖 [Documentation Index →](../README.md)**

---

## 1. Проблема: Яндекс.Карты и Лаги
Движок Gecko (Firefox) исторически плохо дружит с проприетарными драйверами NVIDIA на Linux. Мы перепробовали все комбинации.

*   **WARP (Программный рендер):** Вызывал дикие тормоза и нагрузку на CPU. Мы его **запретили** (`gfx.webrender.use-warp = false`).
*   **Изоляция GPU:** На драйвере 580 процесс GPU часто падал. Решение: отключить изоляцию (`layers.gpu-process.enabled = false`), заставив браузер рисовать всё в основном потоке, но силами GPU.

## 2. user.js Configuration

Готовый конфигурационный файл находится в репозитории:
- **[user.js](../../configs/zen-browser/user.js)** - English comments
- **[user.ru.js](../../configs/zen-browser/user.ru.js)** - Russian comments

Скопируйте файл в папку профиля браузера (`about:support` -> Profile Folder).

    // =============================================================================
    // ZEN BROWSER CONFIG v19 (GOD MODE)
    // =============================================================================

    // --- ГРАФИКА И NVIDIA ---
    user_pref("gfx.webrender.all", true);
    user_pref("gfx.webrender.enabled", true);
    user_pref("layers.acceleration.force-enabled", true);
    user_pref("widget.dmabuf.force-enabled", true);        // Критично для Wayland
    user_pref("gfx.webrender.compositor", false);          // Выкл. нативный композитор (фикс статтеров)
    
    // --- УБИЙЦА WARP ---
    user_pref("gfx.webrender.use-warp", false); 
    user_pref("gfx.webrender.software", false);
    user_pref("gfx.webrender.fallback.software", false);

    // --- HDR И ЦВЕТ ---
    user_pref("gfx.webrender.10bit-format", true);
    user_pref("gfx.color_management.native_srgb", true);
    user_pref("gfx.color_management.mode", 1);

    // --- ЯНДЕКС.КАРТЫ (CANVAS) ---
    user_pref("gfx.canvas.accelerated", true);
    user_pref("gfx.canvas.accelerated.async", true);       // Асинхронный холст
    user_pref("gfx.canvas.accelerated.cache-items", 32768);
    user_pref("gfx.canvas.accelerated.cache-size", 512);

    // --- ВИДЕО (VA-API) ---
    user_pref("media.ffmpeg.vaapi.enabled", true);
    user_pref("media.hardware-video-decoding.force-enabled", true);
    user_pref("media.ffvpx.enabled", false);               // Только GPU декодинг
    user_pref("media.prefer-non-ffvpx", true);
    user_pref("media.rdd-ffmpeg.enabled", true);

    // --- XEON 36-THREADS ---
    user_pref("dom.ipc.processCount", 32);                 // 32 процесса контента
    user_pref("dom.ipc.processCount.webIsolated", 32);
    user_pref("javascript.options.parallel_parsing", true);
    user_pref("image.parallel.decode.limit.multiplier", 9);

    // --- 64GB RAM ---
    user_pref("browser.cache.disk.enable", false);         // Отключаем диск
    user_pref("browser.cache.memory.enable", true);
    user_pref("browser.cache.memory.capacity", 10485760);  // 10 ГБ кэша в RAM

## 3. Резюме
С этим конфигом Zen:
*   Отображает идеальные шрифты (нативный Wayland).
*   Показывает HDR контент.
*   Мгновенно открывает страницы из RAM-кэша.
*   **НО:** Яндекс.Карты могут всё еще подлагивать (особенность движка). Для них используем Thorium.