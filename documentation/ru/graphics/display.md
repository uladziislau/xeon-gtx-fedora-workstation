# 🎨 Graphics & Display: NVIDIA + Wayland + HDR

> Полное руководство по настройке графической подсистемы для связки GTX 1660 SUPER и KDE Plasma 6.

**📖 [Documentation Index →](../README.md)** | **🛠️ [System Setup →](../system/core-setup.md)**

---

## 1. Глобальные переменные (/etc/environment)
Этот файл управляет поведением драйверов и приложений на уровне всей системы.

    LIBVA_DRIVER_NAME=nvidia
    NVD_BACKEND=direct
    
    # Включает нативный Wayland для Firefox/Zen (убирает пиксельные шрифты)
    MOZ_ENABLE_WAYLAND=1
    
    # Позволяет браузерам использовать GPU даже если драйвер помечен как "нестабильный"
    MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
    MOZ_DISABLE_HW_COMPOSITING_BLOCKLIST=1
    MOZ_DISABLE_RDD_SANDBOX=1
    MOZ_WEBRENDER=1
    
    # Оптимизация задержек для NVIDIA 580+ (Explicit Sync)
    __GL_MaxFramesAllowed=1
    __GL_GSYNC_ALLOWED=0
    
    # Критично для красоты шрифтов
    FREETYPE_PROPERTIES="truetype:interpreter-version=40"
    
    # Активация HDR
    ENABLE_HDR_WSI=1
    
    # Помогает Chromium-браузерам (Thorium)
    EGL_PLATFORM=wayland
    __GLX_VENDOR_LIBRARY_NAME=nvidia

### ⚠️ Опасные параметры (Не использовать!)
Следующие флаги вызывали зависание системы при входе или ломали шрифты на Fedora 43:
*   KWIN_DRM_USE_MODIFIERS=1
*   QSG_RHI_BACKEND=vulkan (интерфейс KDE становится "рваным")
*   GSK_RENDERER=ngx

## 2. Шрифты и Масштабирование
Цель: Идеальная четкость на 27" 2K мониторе (108-120 DPI).

### Конфигурация:
*   Шрифт: Inter (Variable) для интерфейса, JetBrains Mono для кода.
*   Сглаживание: RGB, Slight Hinting (Незначительное).
*   Force Font DPI: 120 (установлено через kwriteconfig6).

### Fontconfig (~/.config/fontconfig/fonts.conf):
Мы принудительно переназначаем стандартные шрифты на Inter для всех приложений.

    <alias>
      <family>sans-serif</family>
      <prefer><family>Inter</family></prefer>
    </alias>

## 3. HDR и Цветопередача
Монитор: AOC AG275QXN (VA, 165Hz, HDR10).

*   SDR Brightness: Установлена на 55-60%, чтобы белый цвет в обычных окнах не слепил.
*   Цветовой профиль: Загружен официальный AG275QXN.icm для SDR режима.
*   В HDR режиме: Управление цветом берет на себя протокол Wayland (PQ).