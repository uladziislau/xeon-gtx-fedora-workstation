# 🛠️ Runbook: System Audit for Fedora Workstation (Xeon + GTX)

> **Goal:** Step-by-step system audit and optimization — from foundation to strategy.
> **Principle:** Every action = check command + apply command + rollback command.
> **Philosophy:** "Remove the unnecessary, keep the understood, document everything."

---

## 📋 Phase Overview

| Phase | Focus | Est. Effort | Expected Effect |
|-------|-------|-------------|-----------------|
| **1. Foundation** | Boot, Services, Packages | ~2-3 hrs | Clean base, removed bloat packages/services |
| **2. Optimization** | GPU, Memory/CPU | ~2-3 hrs | Performance, thermals, responsiveness |
| **3. Trim** | KDE, Security | ~1-2 hrs | Minimum bloat, baseline hardening |
| **4. Strategy** | Declarative decision | ~30 min | Clear long-term vector |

---

## 🏗️ PHASE 1: FOUNDATION (Boot + Services + Packages)

### 1.1 Boot/GRUB/initrd Audit

#### 🔍 Check (read-only)
```bash
# Current GRUB parameters
cat /etc/default/grub | grep GRUB_CMDLINE_LINUX

# Loaded initrd modules
lsinitrd | grep -E "nvidia|v4l2|i2c" | head -20

# initrd size
ls -lh /boot/initramfs-$(uname -r).img

# systemd-analyze
systemd-analyze time
systemd-analyze blame | head -20
systemd-analyze critical-chain
```

#### ⚙️ Optimization (apply)
```bash
# Backup
sudo cp /etc/default/grub /etc/default/grub.bak.$(date +%F)

# GRUB_CMDLINE_LINUX — add/verify:
# mitigations=off (already present)
# transparent_hugepage=always (already present)
# zswap.max_pool_percent=100 (already present)
# nvidia-drm.modeset=1 (for Wayland)
# initrd only needed modules (dracut omit)

# Dracut — exclude unneeded drivers
sudo tee /etc/dracut.conf.d/99-omit.conf > /dev/null << 'EOF'
omit_drivers+=" i2c-i801 i2c-smbus i2c-piix4 floppy parallel "
omit_drivers+=" pcspkr joydev "
hostonly=yes
hostonly_cmdline=yes
EOF

# Rebuild initrd
sudo dracut -f /boot/initramfs-$(uname -r).img $(uname -r)
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

#### ↩️ Rollback
```bash
sudo cp /etc/default/grub.bak.$(date +%F) /etc/default/grub
sudo rm /etc/dracut.conf.d/99-omit.conf
sudo dracut -f /boot/initramfs-$(uname -r).img $(uname -r)
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

#### ✅ Checklist
- [ ] `systemd-analyze time` — kernel + userspace < 5s
- [ ] `lsinitrd` — no unneeded modules (floppy, pcspkr, extra i2c)
- [ ] GRUB_CMDLINE_LINUX contains needed parameters

---

### 1.2 Services: systemd + xdg-autostart

#### 🔍 Check (read-only)
```bash
# System services — enabled & active
systemctl list-unit-files --state=enabled --type=service | grep -v "static\|generated"

# Failed services
systemctl list-units --state=failed --type=service

# User services
systemctl --user list-unit-files --state=enabled --type=service
systemctl --user list-units --state=failed --type=service

# Critical chain
systemd-analyze critical-chain

# xdg-autostart (KDE generates from .desktop)
systemctl --user list-unit-files --type=service | grep xdg
ls ~/.config/autostart/ /etc/xdg/autostart/ 2>/dev/null | head -30
```

#### ⚙️ Optimization
```bash
# Already done in previous session:
# - Removed 9 packages (qemu-guest-agent, open-vm-tools, iscsi, livesys, ModemManager, pcsc-lite, at, gssproxy, numad)
# - Disabled accounts-daemon, avahi-daemon (Plasma deps)

# Additionally: mask xdg-autostart for unused
# Example: xwaylandvideobridge (if XWayland video bridge not needed)
systemctl --user mask app-org.kde.xwaylandvideobridge@autostart.service

# plasma-startupsound — if startup sound not needed
systemctl --user mask plasma-startupsound.service

# windscribe-tray — if not using GUI
systemctl --user mask app-windscribe\x2dtray@autostart.service

# Handy (transcription) Insert hotkey does not register at boot
# Root cause: handy uses enigo/X11 for global hotkeys, but systemd-xdg-autostart-generator
# starts the unit before KDE imports DISPLAY into the user manager → "DisplayParsingError(DisplayNotSet)".
# Fix (committed to configs/handy/systemd/10-wait-x11.conf):
systemctl --user daemon-reload  # after placing drop-in
# Drop-in: ~/.config/systemd/user/app-Handy@autostart.service.d/10-wait-x11.conf
#   waits for /tmp/.X11-unix/X0 and sets DISPLAY=:0, WAYLAND_DISPLAY=wayland-0

# ✅ Verify after reboot:
PID=$(pgrep -x handy | head -1) && tr '\0' '\n' < "/proc/$PID/environ" | grep ^DISPLAY=
tail -6 ~/.local/share/com.pais.handy/logs/handy.log   # expect "Enigo initialized successfully", no DisplayNotSet
```

#### ↩️ Rollback
```bash
systemctl --user unmask app-org.kde.xwaylandvideobridge@autostart.service
systemctl --user unmask plasma-startupsound.service
systemctl --user unmask app-windscribe\x2dtray@autostart.service
```

#### ✅ Checklist
- [ ] `systemctl list-units --state=failed` — 0 system, minimal user
- [ ] All enabled services — understood and needed
- [ ] xdg-autostart masked only for unused

---

### 1.3 Packages: fedora-package-manager.py

#### 🔍 Check (read-only)
```bash
cd ~/Projects/ai/synchronika/sync/scripts

# Top-30 largest
python3 fedora-package-manager.py

# Categorized
python3 fedora-package-manager.py --categorized

# Leaves (user-installed, no deps) — removal candidates
python3 fedora-package-manager.py --leaves

# Duplicate versions
python3 fedora-package-manager.py --duplicates

# Unknown repos
python3 fedora-package-manager.py --unknown-repos

# Flatpak
python3 fedora-package-manager.py --flatpak

# Full summary
python3 fedora-package-manager.py --summary

# JSON for parsing
python3 fedora-package-manager.py --json > /tmp/pkg-audit.json
```

#### ⚙️ Optimization
```bash
# Remove leaves (after manual review!)
# python3 fedora-package-manager.py --leaves → pick packages → sudo dnf remove <pkg>

# Clean duplicates (carefully!)
# python3 fedora-package-manager.py --clean-duplicates --apply

# Remove unknown-repo packages (if not needed)
# sudo dnf remove <pkg-from-unknown-repo>

# Auto-clean weak deps (already in dnf.conf: clean_requirements_on_remove=1)
sudo dnf autoremove
```

#### ↩️ Rollback
```bash
# Reinstall removed packages from log
sudo dnf install <pkg1> <pkg2> ...

# Or from backup packages-before.list
comm -23 <(sort scripts/backup/packages-before.list) <(rpm -qa | sort) | xargs sudo dnf install -y
```

#### ✅ Checklist
- [ ] `--leaves` — reviewed, bloat removed
- [ ] `--duplicates` — 0 (or only installonlypkgs: kernel)
- [ ] `--unknown-repos` — 0 (or consciously kept)
- [ ] `dnf check` — clean

---

## 🎮 PHASE 2: OPTIMIZATION (GPU + Memory/CPU)

### 2.1 NVIDIA/GPU Deep Tune

#### 🔍 Check
```bash
# Driver, GSP, firmware
nvidia-smi
cat /proc/driver/nvidia/version
dmesg | grep -i gsp

# VA-API / VDPAU
vainfo
vdpauinfo

# Power management
cat /sys/bus/pci/devices/0000:03:00.0/power/runtime_status
nvidia-smi -q -d POWER

# Explicit sync (Wayland)
env | grep -i explicit
```

#### ⚙️ Optimization
```bash
# Already in /etc/environment:
# MOZ_ENABLE_WAYLAND=1
# ENABLE_HDR_WSI=1
# MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
# LIBVA_DRIVER_NAME=nvidia

# nvidia-powerd (already installed, check status)
systemctl status nvidia-powerd

# GSP firmware — verify load
dmesg | grep -i "gsp\|firmware"

# VA-API in browsers — check about:support / chrome://gpu
```

#### ✅ Checklist
- [ ] `vainfo` — shows VA-API entrypoints (H264, HEVC, VP9, AV1)
- [ ] `nvidia-smi` — P-state not stuck in P0 (verified earlier)
- [ ] Browser GPU acceleration — works (WebGL, Video Decode)

---

### 2.2 Memory/CPU (ZSWAP, hugepages, sched-ext, IRQ)

#### 🔍 Check
```bash
# ZSWAP
cat /sys/module/zswap/parameters/enabled
cat /sys/module/zswap/parameters/max_pool_percent
cat /sys/module/zswap/parameters/compressor
zramctl

# Hugepages
cat /proc/meminfo | grep -i huge

# sched-ext (scx_bpfland)
systemctl status scx_loader
scx_bpfland --help 2>/dev/null | head -5

# IRQ affinity
cat /proc/interrupts | grep -E "nvidia|eth|nvme" | head -10

# CPU governor
cpupower frequency-info
```

#### ⚙️ Optimization
```bash
# ZSWAP — already via GRUB (zswap.max_pool_percent=100)
# Additionally: zstd compressor
echo zstd | sudo tee /sys/module/zswap/parameters/compressor

# Hugepages — for DB/VM (if not used — disable)
# echo 0 | sudo tee /proc/sys/vm/nr_hugepages

# sched-ext — already running (scx_bpfland)
# Profile tuning for workload
# scx_bpfland -p balanced  # or latency, throughput

# IRQ affinity — spread nvme, nvidia, network across cores
# Example for NVMe (cores 0-5):
# echo 3f | sudo tee /proc/irq/$(grep nvme /proc/interrupts | head -1 | awk '{print $1}' | tr -d :)/smp_affinity
```

#### ✅ Checklist
- [ ] ZSWAP active, compressor zstd
- [ ] Hugepages = 0 (if not needed)
- [ ] sched-ext loaded, profile selected
- [ ] IRQ spread across NUMA/CCX

---

## ✂️ PHASE 3: TRIM (KDE + Security)

### 3.1 KDE/Plasma Trim

#### 🔍 Check
```bash
# Akonadi
systemctl --user status akonadi.service
akonadictl status

# Baloo (file indexer)
balooctl status
balooctl config

# KRunner plugins
krunner --list-plugins 2>/dev/null | head -20

# KCM modules
kcmshell6 --list | head -30

# Unused plasma-applets
ls /usr/share/plasma/plasmoids/ | wc -l
```

#### ⚙️ Optimization
```bash
# Akonadi — if not using KMail/KOrganizer/Contacts
systemctl --user disable --now akonadi.service
# Remove packages (careful — pulls kdepim)
# sudo dnf remove akonadi kdepim-runtime

# Baloo — disable indexing
balooctl disable
balooctl config set indexingEnabled false
# Or fully: sudo dnf remove baloo5-file baloo5-kioslave

# KRunner — keep only needed (apps, terminal, calculator)
# Configure in: Settings → Search → KRunner

# Plasma theme — light (Breeze, not heavy)
```

#### ↩️ Rollback
```bash
systemctl --user enable --now akonadi.service
balooctl enable
# Reinstall packages if removed
```

#### ✅ Checklist
- [ ] Akonadi: disabled (or consciously kept)
- [ ] Baloo: disabled (or consciously kept)
- [ ] KRunner: only needed plugins

---

### 3.2 Security Hardening (baseline)

#### 🔍 Check
```bash
# SELinux
sestatus
cat /etc/selinux/config

# systemd sandboxing for own services
systemctl --user show mouse-chord.service --property=DynamicUser,ProtectSystem,PrivateTmp

# Kernel lockdown
cat /sys/kernel/security/lockdown

# Firewall
firewall-cmd --list-all-zones
```

#### ⚙️ Optimization
```bash
# SELinux — already Enforcing (targeted), keep

# systemd sandboxing for own services
# Add to .service files:
# DynamicUser=yes
# ProtectSystem=strict
# PrivateTmp=yes
# NoNewPrivileges=yes
# Example for mouse-chord:
cat >> ~/.config/systemd/user/mouse-chord.service << 'EOF'
DynamicUser=yes
ProtectSystem=strict
PrivateTmp=yes
NoNewPrivileges=yes
CapabilityBoundingSet=CAP_DAC_OVERRIDE CAP_SYS_ADMIN
EOF
systemctl --user daemon-reload
systemctl --user restart mouse-chord.service

# Kernel lockdown — enable (if Secure Boot)
# sudo mokutil --enable-lockdown  # requires reboot + MOK enrollment

# Firewall — minimal zones
# Already done: docker-forwarding removed
firewall-cmd --permanent --set-default-zone=FedoraWorkstation
firewall-cmd --reload
```

#### ✅ Checklist
- [ ] SELinux = Enforcing
- [ ] Own services sandboxed (DynamicUser, ProtectSystem)
- [ ] Firewall — only needed ports/zones

---

## 🧭 PHASE 4: STRATEGY (Declarative — yes/no)

### Decision: **Skip declarative transition (declarative_skip)**

**Why:**
- Classic DNF + runbook already works reproducibly
- rpm-ostree/bootc require OS reinstall
- sysext — for extensions, not base system
- Current approach: git + dnf + runbook = full reproducibility

**When to reconsider:**
- Need for atomic updates/rollback at OS level
- Fedora releases official immutable variant (Silverblue/Kinoite) for KDE

---

## 📦 REPO ARTIFACTS

```
xeon-gtx-fedora-workstation/
├── docs/
│   ├── en/system/
│   │   ├── services-and-bloat.md
│   │   ├── dnf-audit.md
│   │   └── runbook.md          ← this file (EN version)
│   └── ru/system/
│       ├── services-and-bloat.md
│       ├── dnf-audit.md
│       └── runbook.md          ← this file (RU version)
├── configs/
│   └── zen-browser/
│       ├── user.js
│       └── user.ru.js
├── scripts/
│   ├── backup/
│   │   ├── services-enabled-before.list
│   │   └── packages-before.list
│   ├── optimize.sh
│   ├── check.sh
│   └── README.md
└── README.md / README.ru.md
```

---

## 🚀 QUICK START (for new machine)

```bash
# 1. Clone
git clone https://github.com/uladziislau/xeon-gtx-fedora-workstation.git
cd xeon-gtx-fedora-workstation

# 2. Apply foundation (Phase 1)
sudo ./scripts/optimize.sh --phase=foundation

# 3. Apply optimization (Phase 2)
sudo ./scripts/optimize.sh --phase=optimization

# 4. Apply trim (Phase 3)
sudo ./scripts/optimize.sh --phase=trim

# 5. Verify
./scripts/check.sh
```

---

## 📝 CHANGELOG

| Date | Phase | What Done | Commit |
|------|-------|-----------|--------|
| 2026-08-19 | 1 | Crash analysis, 3 services, 14 DNF repos, dnf.conf | bc3b3ee |
| 2026-08-19 | 1 | v4l2loopback, bluetooth, windscribe, firewalld | 67930b1 |
| — | 1 | Packages (fedora-package-manager) — planned | — |
| — | 2 | GPU/CPU deep tune — planned | — |
| — | 3 | KDE/Security trim — planned | — |

---

## 🔗 TOOL LINKS

- **fedora-package-manager.py** — `~/Projects/ai/synchronika/sync/scripts/`
- **major-upgrade.sh** — `~/Projects/ai/synchronika/tools/scripts/`
- **package-strategy.md** — `~/Projects/ai/synchronika/sync/devices/xeon/software/`

---

*Runbook created: 2026-08-19 | Version: 1.0 | For: Xeon E5-2696 v3 + GTX 1660 SUPER + Fedora 44 KDE/Wayland*