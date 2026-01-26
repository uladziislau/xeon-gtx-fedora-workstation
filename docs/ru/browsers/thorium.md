# 🔵 Thorium Browser: AVX2 Speed Monster

> Thorium используется как **специализированный инструмент** для задач, где движок Gecko (Zen) не справляется: тяжелые WebGL-карты (Яндекс), Google AI Studio и видео 8K.

**📖 [Documentation Index →](../README.md)**

---

## 1. Преимущества
*   **AVX2:** Сборка с флагами `-march=haswell`, использующая родные инструкции Xeon v3.
*   **ANGLE:** Движок Blink умеет использовать прослойку ANGLE для трансляции OpenGL вызовов, что дает **идеальные 165 FPS** в Яндекс.Картах на NVIDIA.
*   **VA-API:** В Thorium есть уникальный патч, позволяющий обойти черный список драйверов NVIDIA на Linux.

## 2. Конфигурация (~/.config/thorium-flags.conf)
Thorium игнорирует стандартные файлы конфигурации в некоторых RPM-сборках, поэтому мы используем этот файл для генерации флагов, которые потом вшиваем в ярлык.

    # --- ГРАФИКА (ANGLE) ---
    --ozone-platform-hint=auto
    --ozone-platform=wayland
    --use-gl=angle
    --use-angle=gl
    --ignore-gpu-blocklist
    --disable-gpu-driver-bug-workarounds
    
    # --- ВИДЕО (NVIDIA UNLOCK) ---
    --enable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL
    --disable-features=UseChromeOSDirectVideoDecoder,Av1VideoDecoder
    
    # --- ПРОИЗВОДИТЕЛЬНОСТЬ ---
    --enable-zero-copy
    --enable-gpu-rasterization
    --num-raster-threads=4
    --force-gpu-mem-available-mb=4096
    
    # --- HDR (КОСТЫЛЬ) ---
    --force-color-profile=hdr10
    --enable-hdr

### Важное про AV1
Видеокарта GTX 1660 Super **не умеет** декодировать AV1 аппаратно.
Флаг `--disable-features=Av1VideoDecoder` заставляет YouTube отдавать видео в формате **VP9**, который карта декодирует аппаратно.

## 3. Ярлык запуска
Поскольку Thorium капризен, мы создаем кастомный `.desktop` файл, который жестко передает нужные аргументы.

    Exec=/usr/bin/thorium-browser %U

*(Аргументы берутся из конфига или прописываются напрямую, если версия из пакета не читает конфиг).*

## 4. Результат
*   **Яндекс.Карты:** Абсолютно плавный скролл и зум.
*   **Видео:** VP9 4K HDR работает через GPU.
*   **Шрифты:** Четкие (нативный Wayland).