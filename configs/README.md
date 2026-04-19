# ⚙️ Configuration Files

This directory contains ready-to-use configuration files for various applications.

## 📁 Directory Structure

```
configs/
├── zen-browser/
│   ├── user.js      # Zen Browser configuration (English comments)
│   └── user.ru.js   # Zen Browser configuration (Russian comments)
└── thorium-browser/
    ├── flags.conf    # Thorium CLI flags (English comments; canonical for scripts)
    └── flags.ru.conf # Same flags, Russian comments (human reference)
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

📖 **[Full configuration guide (EN) →](../docs/en/browsers/zen.md)**

The configuration includes:
- ✅ NVIDIA Wayland optimization
- ✅ Hardware video acceleration (VA-API/NVDEC)
- ✅ HDR 10-bit color support
- ✅ 36-thread CPU optimization
- ✅ 64GB RAM cache configuration

---

## 🔷 Thorium Browser Configuration

Thorium uses **command-line flags**, not a `user.js`. The repository ships a flag list aligned with the same goals as Zen v21 (Wayland, VP9 over AV1, VA-API, ANGLE).

### Files

| File | Purpose |
|------|---------|
| `thorium-browser/flags.conf` | Canonical list; used by `scripts/optimize.sh` when installing flags |
| `thorium-browser/flags.ru.conf` | Same active flags, Russian comments (optional copy for reading) |

Comment lines (`# ...`) and blank lines are ignored when applying flags. Optional aggressive flags are kept commented out by default.

### Installation

**Automated (recommended after cloning):** run `sudo ./scripts/optimize.sh` — it writes `~/.config/thorium-flags.conf` and, if a system Thorium `.desktop` file is found, a user override under `~/.local/share/applications/` so the flags are passed on launch.

**Manual:** copy `flags.conf` to `~/.config/thorium-flags.conf` (strip comment lines), then append the same arguments to your launcher `Exec=` line, or merge into a custom `.desktop` file. Some RPM/Flatpak builds ignore `thorium-flags.conf`; the desktop override is the reliable path.

📖 **[Full guide (EN) →](../docs/en/browsers/thorium.md)** · **[RU →](../docs/ru/browsers/thorium.md)**

---

## 📝 Notes

- Configuration files are versioned and tested on Fedora 43+ with KDE Plasma 6
- Always backup your existing `user.js` or `.desktop` before replacing
- Some settings may need adjustment based on your specific hardware
- Chromium flag names change between major versions; run `thorium --help` if a flag is rejected
