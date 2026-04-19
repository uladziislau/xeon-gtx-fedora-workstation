# 🚀 Оптимизация Fedora Workstation: Xeon E5 v3 + NVIDIA GTX

> Проверенный набор конфигураций для превращения систем на базе **Intel Xeon E5 v3 (Haswell-EP)** и **NVIDIA** в высокопроизводительную рабочую станцию на **Fedora 43+ (KDE Plasma 6, Wayland)**.

[![Лицензия: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 💻 Целевое железо

| Компонент | Характеристики |
|-----------|----------------|
| **CPU** | Intel Xeon E5-2696 v3 (18 ядер, 36 потоков) |
| **GPU** | NVIDIA GTX 1660 SUPER (Driver 580+, Explicit Sync) |
| **RAM** | 64 GB (настройка ZSWAP и Hugepages) |
| **Монитор** | 2K (1440p) @ 165Hz с поддержкой HDR10 |

---

## 🚀 Краткие результаты

1. **✅ Интерфейс** - Полное устранение "киселя" и лагов курсора на 165 Гц
2. **✅ Шрифты** - Исправлена пиксельность в Wayland, настроено нативное сглаживание
3. **✅ Видео** - Включено аппаратное декодирование (NVDEC) в браузерах
4. **✅ Температуры** - Снижение с 60°C до 34-37°C в простое без потери отклика
5. **✅ Планировщик** - Переход на `sched-ext` (scx_bpfland) для управления 36 потоками

---

## 📂 Структура репозитория

```
.
├── docs/                    # Полная документация
│   ├── en/                 # English documentation
│   │   ├── system/         # Kernel, GRUB, schedulers
│   │   ├── graphics/       # NVIDIA, Wayland, HDR config
│   │   ├── browsers/       # Browser configuration guides
│   │   └── troubleshooting/ # Common issues & solutions
│   └── ru/                 # Русская документация
│       ├── system/         # Ядро, GRUB, планировщики
│       ├── graphics/       # NVIDIA, Wayland, HDR
│       ├── browsers/       # Руководства по браузерам
│       └── troubleshooting/ # Решение проблем
├── configs/                 # Конфигурационные файлы
│   └── zen-browser/        # Файлы user.js для Zen Browser
├── scripts/                 # Скрипты автоматизации
│   ├── optimize.sh         # Главный скрипт оптимизации
│   ├── check.sh            # Проверка конфигурации
│   └── README.md           # Документация по скриптам
└── README.ru.md            # Этот файл
```

---

## 🛠️ Краткая инструкция по применению

### 🚀 Автоматическая установка (Рекомендуется)

**Самый быстрый способ применить все оптимизации:**

```bash
# Клонировать репозиторий
git clone https://github.com/uladziislau/xeon-gtx-fedora-workstation.git
cd xeon-gtx-fedora-workstation

# Запустить скрипт оптимизации
sudo ./scripts/optimize.sh

# Обновить GRUB и перезагрузить
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
sudo reboot
```

**Проверить текущие настройки:**
```bash
./scripts/check.sh
```

📖 **[Документация по скриптам →](scripts/README.md)**

---

### Ручная установка

### 1. Ядро и GRUB

Настройка параметров ядра и загрузчика:

📖 **[Полное руководство →](docs/ru/system/core-setup.md)** | 📖 **[English Guide →](docs/en/system/core-setup.md)**

**Быстрые шаги:**
```bash
# Редактируем /etc/default/grub
sudo nano /etc/default/grub

# Добавляем в GRUB_CMDLINE_LINUX:
clear_cpuid=514 zswap.max_pool_percent=100 transparent_hugepage=always mitigations=off

# Обновляем GRUB
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

### 2. Графика и HDR

Настройка NVIDIA для работы в нативном Wayland режиме:

📖 **[Полное руководство →](docs/ru/graphics/display.md)** | 📖 **[English Guide →](docs/en/graphics/display.md)**

**Быстрые шаги:**
```bash
# Редактируем /etc/environment
sudo nano /etc/environment

# Добавляем критичные переменные:
MOZ_ENABLE_WAYLAND=1
ENABLE_HDR_WSI=1
MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
LIBVA_DRIVER_NAME=nvidia
```

### 3. Браузеры

#### Zen Browser
- Скопируйте [`configs/zen-browser/user.js`](configs/zen-browser/user.js) в папку профиля
- 📖 **[Руководство по настройке →](docs/ru/browsers/zen.md)** | 📖 **[English Guide →](docs/en/browsers/zen.md)**

#### Thorium Browser
- Используйте версию **AVX2** с флагами `--use-gl=angle`
- 📖 **[Руководство по настройке →](docs/ru/browsers/thorium.md)** | 📖 **[English Guide →](docs/en/browsers/thorium.md)**

### 4. Планировщик CPU (Опционально)

Для оптимальной работы с 36 потоками рассмотрите использование sched-ext:

📖 **[Руководство по планировщикам →](docs/ru/system/schedulers.md)** | 📖 **[English Guide →](docs/en/system/schedulers.md)**

---

## 📚 Документация

📖 **[Полный индекс документации →](docs/README.md)**

### Быстрые ссылки (Русский)

- **[Системные настройки](docs/ru/system/core-setup.md)** - Ядро, GRUB, управление питанием
- **[Графика и дисплей](docs/ru/graphics/display.md)** - NVIDIA Wayland, HDR, шрифты
- **[Zen Browser](docs/ru/browsers/zen.md)** - Конфигурация форка Firefox
- **[Thorium Browser](docs/ru/browsers/thorium.md)** - Сборка Chromium с AVX2
- **[Решение проблем](docs/ru/troubleshooting/index.md)** - Частые проблемы и решения
- **[Справочник команд](docs/ru/cli-cheatsheet.md)** - Быстрая справка по командам

### Quick Links (English)

- **[System Setup](docs/en/system/core-setup.md)** - Kernel, GRUB, power management
- **[Graphics & Display](docs/en/graphics/display.md)** - NVIDIA Wayland, HDR, fonts
- **[Zen Browser](docs/en/browsers/zen.md)** - Firefox fork configuration
- **[Thorium Browser](docs/en/browsers/thorium.md)** - Chromium AVX2 build
- **[Troubleshooting](docs/en/troubleshooting/index.md)** - Common issues & solutions
- **[CLI Cheatsheet](docs/en/cli-cheatsheet.md)** - Command reference

---

## 🆘 Решение проблем

Возникли проблемы? Ознакомьтесь с **[Руководством по решению проблем](docs/ru/troubleshooting/index.md)** | **[English Guide →](docs/en/troubleshooting/index.md)**:

- Сбои и зависания системы
- Графические артефакты и проблемы со шрифтами
- Проблемы с декодированием видео
- Вопросы производительности

---

## 🐛 Проблемы и вопросы

Нашли проблему или есть вопрос? [Создайте issue](https://github.com/uladziislau/xeon-gtx-fedora-workstation/issues/new) или начните [обсуждение](https://github.com/uladziislau/xeon-gtx-fedora-workstation/discussions).

---

## 📝 Лицензия

Этот проект распространяется под лицензией MIT - см. файл [LICENSE](LICENSE) для деталей.

---

## 💡 О проекте

Этот репозиторий документирует реальный опыт оптимизации серверного железа (Xeon E5 v3) в высокопроизводительную Linux рабочую станцию. Все конфигурации протестированы и проверены на реальном железе.

**Протестировано на:**
- Fedora 43+ (Rawhide) с KDE Plasma 6
- Ядро CachyOS 6.18+ (поддержка sched-ext)
- Нативная сессия Wayland

---

**🇺🇸 [English Version →](README.md)** | **📚 [Документация →](docs/ru/README.md)**
