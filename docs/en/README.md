# 📚 Documentation Index

Complete documentation for optimizing Fedora Workstation on Intel Xeon E5 v3 + NVIDIA GTX systems.

**🇷🇺 [Русская версия →](../ru/README.md)**

## 📖 Table of Contents

### 🛠️ System Configuration
- **[Core Setup](system/core-setup.md)** - Kernel parameters, GRUB configuration, and power management
- **[CPU Schedulers](system/schedulers.md)** - Testing and comparison of sched-ext schedulers for 36-thread systems

### 🎨 Graphics & Display
- **[Graphics & Display](graphics/display.md)** - NVIDIA + Wayland + HDR configuration

### 🌐 Browsers
- **[Zen Browser](browsers/zen.md)** - Configuration guide for Zen Browser (Firefox fork)
- **[Thorium Browser](browsers/thorium.md)** - AVX2-optimized Chromium configuration

### 🆘 Troubleshooting
- **[Troubleshooting Log](troubleshooting/index.md)** - Common issues and solutions

### 💻 Reference
- **[CLI Cheatsheet](cli-cheatsheet.md)** - Quick command reference for system management

---

## 🚀 Quick Start

1. **System Setup**: Start with [Core Setup](system/core-setup.md) to configure kernel parameters
2. **Graphics**: Configure [Graphics & Display](graphics/display.md) for NVIDIA Wayland support
3. **Browsers**: Apply browser configurations from [Browsers](browsers/) section
4. **Troubleshooting**: Check [Troubleshooting](troubleshooting/index.md) if you encounter issues

---

## 📁 Configuration Files

Browser configuration files are located in:
- 🔴 **[Zen Browser](../../configs/zen-browser/)**:
  - `user.js` - Zen Browser configuration (English comments)
  - `user.ru.js` - Zen Browser configuration (Russian comments)
- 🔵 **[Thorium Browser](../../configs/thorium-browser/)**:
  - `flags.conf` - Thorium CLI flags (English comments; canonical for scripts)
  - `flags.ru.conf` - Same flags, Russian comments (human reference)

---

## 🌍 Languages

- 🇺🇸 **English** (this page) - Currently being translated
- 🇷🇺 **[Русский](../ru/README.md)** - Complete Russian documentation
