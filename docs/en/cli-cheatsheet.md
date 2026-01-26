# 💻 CLI Cheatsheet: Fedora Workstation

> Collection of useful commands for configuring, diagnosing, and managing system on Xeon + NVIDIA base.

**📖 [Documentation Index →](README.md)** | **🇷🇺 [Русская версия →](../ru/cli-cheatsheet.md)**

---

## 🔍 Quick Diagnostics

### Check Boot Parameters
Verify that all flags (zswap, clear_cpuid, etc.) were applied:

```bash
cat /proc/cmdline
```

### Check Environment Variables
If output is empty — hardware acceleration in browser won't work:

```bash
env | grep MOZ
```

### Check VA-API Hardware Acceleration
Should display list of codecs (VP9, HEVC, etc.):

```bash
vainfo --display wayland
```

### Check Scheduler Status (scx)
Check which eBPF scheduler currently manages cores:

```bash
systemctl status scx-* --no-pager
```

---

## 🖥️ System & Kernel

### Update GRUB Bootloader
Apply changes after editing `/etc/default/grub`:

```bash
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

### Manage Environment Variables
Quick overwrite of environment file (copy entire block):

```bash
sudo bash -c 'cat <<EOF > /etc/environment
LIBVA_DRIVER_NAME=nvidia
NVD_BACKEND=direct
MOZ_ENABLE_WAYLAND=1
...
EOF'
```

---

## 🎨 Graphics & Video (GPU)

### GPU Monitoring (Quick)
Check memory, frequencies, and GPU temperature:

```bash
nvidia-smi
```

### Video Decode Monitoring (NVDEC)
Watch `dec` column. If > 0 when watching YouTube — GPU is working:

```bash
nvidia-smi dmon -s u
```

### Display Information
Detailed information about connected monitors (model, modes):

```bash
kscreen-doctor -o
```

---

## ⚡ CPU & Power

### Frequency Monitoring (Simple)
Show current frequency of all cores in real-time:

```bash
watch -n1 "grep 'MHz' /proc/cpuinfo"
```

### Frequency & Power Monitoring (Professional)
Show real frequency under load, watts (PkgWatt), and C-states:

```bash
sudo turbostat --quiet --interval 1 --show Bzy_MHz,PkgWatt,CorWatt,GFXWatt,IRQ
```

### Power Profile Management
Set "Performance" mode:

```bash
powerprofilesctl set performance
```

Check current profile:

```bash
powerprofilesctl list
```

### Check CPU Governor
Verify all cores are in 'performance' mode:

```bash
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort | uniq
```

---

## 💾 Memory (RAM)

### Check Hugepages
Should show `[always]`:

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

### Check ZSWAP Status
Percentage of memory used for compressed buffer (should be 100):

```bash
cat /sys/module/zswap/parameters/max_pool_percent
```

---

## 🖼️ KDE Plasma & Interface

### Change Font DPI
Force DPI setting (e.g., 120 for 2K monitor):

```bash
kwriteconfig6 --file kcmfonts --group General --key forceFontDPI 120
```

### Restart Session (Logout)
Safe logout via terminal (to apply graphics settings):

```bash
loginctl terminate-session self
```

### Restart Plasma Shell
If panel or plasmoids "glitched" (without closing windows):

```bash
kquitapp6 plasmashell || killall plasmashell && kstart plasmashell
```

### Disable Baloo Indexer
If `baloo_file` loads disk:

```bash
balooctl6 disable
```

### Font Cache Reset
Execute after changing Fontconfig configs:

```bash
fc-cache -f -v
```

---

## 🧠 CPU Schedulers (Sched-ext)

### Enable Scheduler
Enable specific scheduler (e.g., BPFland):

```bash
sudo systemctl enable --now scx-bpfland
```

### Check Status
```bash
systemctl status scx-bpfland --no-pager
```

---

## 🌐 Browsers

### Update Desktop Entry Database
Update database after manual editing of `.desktop` files:

```bash
update-desktop-database ~/.local/share/applications/
```

### Launch Thorium with Debugging
If need to check flags via terminal:

```bash
thorium-browser --enable-features=VaapiVideoDecoder --disable-features=VaapiVideoDecodeLinuxGL --use-gl=angle --ozone-platform=wayland
```

### Launch Thorium with GPU Error Output
If hardware acceleration "failed", launch like this and check logs:

```bash
thorium-browser --enable-logging=stderr --v=1
```

---

## 🔧 Maintenance & Fix-It Commands

### System Cleanup
Clean DNF package cache and old metadata:

```bash
sudo dnf clean all && sudo dnf makecache
```

---

## 📚 Related Documentation

- **[System Core Setup](../system/core-setup.md)** - Kernel parameters and GRUB
- **[Graphics & Display](../graphics/display.md)** - NVIDIA Wayland configuration
- **[Troubleshooting](../troubleshooting/index.md)** - Common issues and solutions
