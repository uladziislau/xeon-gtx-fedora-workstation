# 🚀 Fedora Workstation Optimization: Xeon E5 v3 + NVIDIA GTX

> Ultimate guide and configuration set for **Intel Xeon E5 v3 (Haswell-EP)** and **NVIDIA** systems running **Fedora 43+ (KDE Plasma 6, Wayland)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 💻 Target Hardware

| Component | Specification |
|-----------|--------------|
| **CPU** | Intel Xeon E5-2696 v3 (18c/36t) |
| **GPU** | NVIDIA GTX 1660 SUPER (Driver 580+, Explicit Sync) |
| **RAM** | 64 GB (ZSWAP & Hugepages tuning) |
| **Display** | 2K (1440p) @ 165Hz \| HDR10 Support |

---

## 🚀 Key Improvements

1. **✅ UI Latency** - Eliminated input lag and cursor stuttering at 165Hz
2. **✅ Font Rendering** - Fixed pixelated fonts in Wayland/NVIDIA session
3. **✅ Hardware Video** - Forced NVDEC (VA-API) in Zen and Thorium browsers
4. **✅ Thermal Management** - Reduced idle temps from 60°C to 34-37°C
5. **✅ Scheduling** - Implemented `sched-ext` (scx_bpfland) for optimal 36-thread handling

---

## 📂 Repository Structure

```
.
├── docs/                    # Complete documentation
│   ├── en/                 # English documentation
│   │   ├── system/         # Kernel, GRUB, schedulers
│   │   ├── graphics/       # NVIDIA, Wayland, HDR config
│   │   ├── browsers/       # Browser configuration guides
│   │   └── troubleshooting/ # Common issues & solutions
│   └── ru/                 # Russian documentation (Русская документация)
│       ├── system/         # Ядро, GRUB, планировщики
│       ├── graphics/       # NVIDIA, Wayland, HDR
│       ├── browsers/       # Руководства по браузерам
│       └── troubleshooting/ # Решение проблем
├── configs/                 # Configuration files
│   └── zen-browser/        # Zen Browser user.js files
├── scripts/                 # Automation scripts
│   ├── optimize.sh         # Main optimization script
│   ├── check.sh            # Configuration checker
│   └── README.md           # Scripts documentation
└── README.md               # This file
```

---

## 🛠️ Quick Setup Guide

### 🚀 Automated Setup (Recommended)

**Fastest way to apply all optimizations:**

```bash
# Clone the repository
git clone https://github.com/uladziislau/xeon-gtx-fedora-workstation.git
cd xeon-gtx-fedora-workstation

# Run the optimization script
sudo ./scripts/optimize.sh

# Update GRUB and reboot
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
sudo reboot
```

**Check current settings:**
```bash
./scripts/check.sh
```

📖 **[Scripts Documentation →](scripts/README.md)**

---

### Manual Setup

### 1. System Core Setup

Configure kernel parameters and GRUB bootloader:

📖 **[Full Guide →](docs/en/system/core-setup.md)** | 📖 **[Руководство →](docs/ru/system/core-setup.md)**

**Quick steps:**
```bash
# Edit /etc/default/grub
sudo nano /etc/default/grub

# Add to GRUB_CMDLINE_LINUX:
clear_cpuid=514 zswap.max_pool_percent=100 transparent_hugepage=always mitigations=off

# Update GRUB
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

### 2. Graphics & Display

Setup NVIDIA Wayland and HDR support:

📖 **[Full Guide →](docs/en/graphics/display.md)** | 📖 **[Руководство →](docs/ru/graphics/display.md)**

**Quick steps:**
```bash
# Edit /etc/environment
sudo nano /etc/environment

# Add critical variables:
MOZ_ENABLE_WAYLAND=1
ENABLE_HDR_WSI=1
MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
LIBVA_DRIVER_NAME=nvidia
```

### 3. Browser Configuration

#### Zen Browser
- Copy [`configs/zen-browser/user.js`](configs/zen-browser/user.js) to your profile folder
- 📖 **[Configuration Guide →](docs/en/browsers/zen.md)** | 📖 **[Руководство →](docs/ru/browsers/zen.md)**

#### Thorium Browser
- Use AVX2 build with `--use-gl=angle` flags
- 📖 **[Configuration Guide →](docs/en/browsers/thorium.md)** | 📖 **[Руководство →](docs/ru/browsers/thorium.md)**

### 4. CPU Scheduler (Optional)

For optimal 36-thread performance, consider using sched-ext:

📖 **[Scheduler Guide →](docs/en/system/schedulers.md)** | 📖 **[Руководство →](docs/ru/system/schedulers.md)**

---

## 📚 Documentation

📖 **[Complete Documentation Index →](docs/README.md)**

### Quick Links (English)

- **[System Setup](docs/en/system/core-setup.md)** - Kernel, GRUB, power management
- **[Graphics & Display](docs/en/graphics/display.md)** - NVIDIA Wayland, HDR, fonts
- **[Zen Browser](docs/en/browsers/zen.md)** - Firefox fork configuration
- **[Thorium Browser](docs/en/browsers/thorium.md)** - Chromium AVX2 build
- **[Troubleshooting](docs/en/troubleshooting/index.md)** - Common issues & solutions
- **[CLI Cheatsheet](docs/en/cli-cheatsheet.md)** - Command reference

### Быстрые ссылки (Русский)

- **[Системные настройки](docs/ru/system/core-setup.md)** - Ядро, GRUB, управление питанием
- **[Графика и дисплей](docs/ru/graphics/display.md)** - NVIDIA Wayland, HDR, шрифты
- **[Zen Browser](docs/ru/browsers/zen.md)** - Конфигурация форка Firefox
- **[Thorium Browser](docs/ru/browsers/thorium.md)** - Сборка Chromium с AVX2
- **[Решение проблем](docs/ru/troubleshooting/index.md)** - Частые проблемы и решения
- **[Справочник команд](docs/ru/cli-cheatsheet.md)** - Быстрая справка по командам

---

## 🆘 Troubleshooting

Encountering issues? Check the **[Troubleshooting Guide](docs/en/troubleshooting/index.md)** | **[Руководство →](docs/ru/troubleshooting/index.md)** for:

- System crashes and freezes
- Graphics artifacts and font issues
- Video decoding problems
- Performance issues

---

## 🐛 Issues & Questions

Found a problem or have a question? [Open an issue](https://github.com/uladziislau/xeon-gtx-fedora-workstation/issues/new) or start a [discussion](https://github.com/uladziislau/xeon-gtx-fedora-workstation/discussions).

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💡 About

This repository documents a real-world optimization journey for transforming server-grade hardware (Xeon E5 v3) into a high-performance Linux workstation. All configurations have been tested and verified on actual hardware.

**Tested on:**
- Fedora 43+ (Rawhide) with KDE Plasma 6
- CachyOS Kernel 6.18+ (sched-ext support)
- Native Wayland session

---

**🇷🇺 [Русская версия →](README.ru.md)** | **📚 [Документация →](docs/ru/README.md)**

