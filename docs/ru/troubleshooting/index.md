# 🆘 Troubleshooting & Incident Log

> База знаний по проблемам, возникшим в процессе настройки Fedora 43 на Xeon v3 + NVIDIA.

**📖 [Documentation Index →](../README.md)**

---

## 1. Системные сбои (System Crashes)

### 🔴 Kernel Panic / Freeze при нагрузке
*   **Симптомы:** Полное зависание системы, звук зацикливается, черный экран.
*   **Виновник:** Планировщик `scx_lavd` (версия 1.0.x).
*   **Причина:** В режиме Autopilot планировщик перегружал **Core 0**, пытаясь обрабатывать все прерывания через него. На 36-поточном CPU это приводило к `NULL pointer dereference`.
*   **Решение:** Переход на `scx_bpfland` (баланс) или `scx_rustland` (интерактивность).

### 🔴 Зависание на экране входа (Login Loop)
*   **Симптомы:** После ввода пароля система виснет намертво.
*   **Виновник:** «Токсичная» комбинация переменных в `/etc/environment`.
*   **Причина:**
    *   `KWIN_DRM_USE_MODIFIERS=1` (конфликт буферов NVIDIA).
    *   `QSG_RHI_BACKEND=vulkan` (краш оболочки Plasma).
    *   `GSK_RENDERER=ngx` (краш GTK приложений).
*   **Решение:** Удалить эти строки. Использовать только стандартный OpenGL/EGL.

### 🔴 Перегрев в простое (60°C)
*   **Симптомы:** Вентиляторы воют, температура CPU 60°C при 1% нагрузки.
*   **Виновник:** Параметр ядра `intel_idle.max_cstate=1`.
*   **Причина:** Запрет процессору уходить в энергосберегающие состояния (C-states).
*   **Решение:** Удалить параметр. Температура упала до 34°C. Отзывчивость сохранилась благодаря `performance` governor.

---

## 2. Графические артефакты (Graphics & Fonts)

### 🟡 Пиксельные / Рваные шрифты
*   **Симптомы:** Текст в системном мониторе и браузере выглядит как "лесенка" без сглаживания.
*   **Причина 1 (Система):** Использование `QSG_RHI_BACKEND=vulkan`.
*   **Причина 2 (Браузер):** Работа через XWayland вместо нативного Wayland.
*   **Решение:**
    1. Убрать `vulkan` из переменных среды (вернуться на OpenGL).
    2. Добавить `MOZ_ENABLE_WAYLAND=1` для Firefox/Zen.
    3. Использовать `--ozone-platform=wayland` для Chrome/Thorium.

### 🟡 Лаги Яндекс.Карт (Stuttering)
*   **Симптомы:** 165 Гц монитор, но карта двигается рывками ("кисель").
*   **Виновник:** WARP (Windows Advanced Rasterization Platform) — программный рендеринг.
*   **Диагностика:** `about:support` -> WebRender (Software).
*   **Решение:**
    *   В Zen: `gfx.webrender.use-warp = false` + `widget.dmabuf.force-enabled = true`.
    *   В Thorium: Использовать флаги `--use-gl=angle --use-angle=gl`.

---

## 3. Проблемы с Видео (Video Decode)

### 🟠 "Should skip nVidia device named: nvidia-drm"
*   **Где:** Thorium / Chromium.
*   **Суть:** В код браузера вшит "черный список" драйверов.
*   **Решение:** Использовать флаг `--vaapi-on-nvidia-gpus` (патч Thorium) или комбинацию `--enable-features=VaapiVideoDecoder` + `--disable-features=VaapiVideoDecodeLinuxGL` (для обычного Chrome).

### 🟠 "Failed to initialize frame pool"
*   **Где:** Thorium.
*   **Суть:** Конфликт ресурсов памяти при декодировании.
*   **Причина:** Одновременное включение `DrDc` (композитор в отдельном потоке), `CanvasOopRasterization` и `Vulkan`.
*   **Решение:** Отключить экспериментальные функции, оставить только базовый VA-API и OpenGL.

### 🟠 Тормоза на YouTube 4K
*   **Причина:** Кодек **AV1**. Видеокарта GTX 1660 Super его **не поддерживает**. Нагрузка ложится на CPU.
*   **Решение:**
    *   В браузере: Расширение **enhanced-h264ify** (Block AV1).
    *   В Thorium: Флаг `--disable-features=Av1VideoDecoder`.
    *   Результат: YouTube отдает VP9, который работает аппаратно.

---

## 4. Полезные команды для диагностики

**Проверка, видит ли браузер переменные:**
```bash
env | grep MOZ