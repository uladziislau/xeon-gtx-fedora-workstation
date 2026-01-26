# ⚙️ Configuration Files

This directory contains ready-to-use configuration files for various applications.

## 📁 Directory Structure

```
configs/
└── zen-browser/
    ├── user.js      # Zen Browser configuration (English comments)
    └── user.ru.js   # Zen Browser configuration (Russian comments)
```

## 🌐 Zen Browser Configuration

### Installation

1. Find your Zen Browser profile folder:
   - Open Zen Browser
   - Navigate to `about:support`
   - Find "Profile Folder" path

2. Copy the configuration file:
   ```bash
   cp configs/zen-browser/user.js ~/.zen-browser/<profile>/user.js
   ```
   Or for Russian version:
   ```bash
   cp configs/zen-browser/user.ru.js ~/.zen-browser/<profile>/user.js
   ```

3. Restart Zen Browser

### Configuration Details

📖 **[Full Configuration Guide →](../docs/browsers/zen.md)**

The configuration includes:
- ✅ NVIDIA Wayland optimization
- ✅ Hardware video acceleration (VA-API/NVDEC)
- ✅ HDR 10-bit color support
- ✅ 36-thread CPU optimization
- ✅ 64GB RAM cache configuration

---

## 📝 Notes

- Configuration files are versioned and tested on Fedora 43+ with KDE Plasma 6
- Always backup your existing `user.js` before replacing
- Some settings may need adjustment based on your specific hardware
