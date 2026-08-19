# 🧹 Services & Bloat Audit

> Removing what a physical workstation does not need, keeping the OS lean and understood.
> Fits the project goal: **eliminate the unnecessary, always with a documented revert.**

## Outcome (applied)

Removed **9 packages** that serve virtualisation / server / mobile use-cases while this machine is a **physical desktop** (`systemd-detect-virt` = `none`).

| Package | Service(s) | Why removed |
|---------|-----------|-------------|
| `qemu-guest-agent` | `qemu-guest-agent` | guest agent for QEMU/KVM hosts — no VM |
| `open-vm-tools` | `vmtoolsd`, `vgauthd` | VMware guest tools — no VMware |
| `iscsi-initiator-utils` | `iscsi-onboot`, `iscsi-starter` | network iSCSI boot — local NVMe/SATA only |
| `livesys-scripts` | `livesys`, `livesys-late` | live-media (USB) init — regular install |
| `ModemManager` | `ModemManager` | 3G/4G modem management — none present |
| `pcsc-lite` | `pcscd`, `pcscd.socket` | smart-card / token daemon — not used |
| `at` | `atd` | deferred one-shot jobs (`at`) — not used |
| `gssproxy` | `gssproxy` | GSSAPI/Kerberos proxy — no corporate domain |
| `numad` | `numad` | NUMA locality daemon — kernel handles a workstation |

### Disabled (service off), packages kept — required by KDE
These two daemons are **hard dependencies of Plasma**, so the packages stay, but the services are turned off:

| Service | Package | Why kept |
|---------|---------|----------|
| `accounts-daemon` | `accountsservice` | pulled by `plasma-desktop` (ding profile/UIs) |
| `avahi-daemon` (+`avahi-daemon.socket`) | `avahi` | pulled via `nss-mdns → kf6-kdnssd → kio-extras → plasma-workspace` |

Both are now `disabled` + `inactive`. If a Plasma feature ever needs them, `systemctl enable --now accounts-daemon avahi-daemon` restores.

---

## 2026-08-19: Crash analysis & broken services cleanup

### The "crash" at 12:19:15 — what actually happened
No kernel panic / hard reset. The system was up since 10:31. At ~12:18–12:19 a **restart storm** from three broken user/system services flooded the journal and consumed CPU/IO:

| Service | Type | Root cause | Action taken |
|---------|------|------------|--------------|
| `agy-zen-proxy.service` | user | `Cannot find module '/home/uladzislau/Projects/agy-zen/dist/proxy.js'` — project does not exist | **Disabled, masked, unit file removed** |
| `mouse-chord.service` | user | `ExecStart` pointed to `/home/uladzislau/Projects/agentica/tools/scripts/mouse-chord-daemon.py` — project renamed to `synchronika` | **Fixed**: updated path to `/home/uladzislau/Projects/ai/synchronika/sync/scripts/mouse-chord-daemon.py`, **enabled & running** |
| `upscale-cam.service` | system | Symlink `/usr/local/bin/upscale-cam` → `/home/uladzislau/Projects/agentica/sync/devices/xeon/video/upscale-cam.sh` — target missing | **Symlink fixed** to `/home/uladzislau/Projects/ai/synchronika/sync/devices/xeon/video/upscale-cam.sh`, service **left disabled** (idea preserved for later) |

The restart storm (counters > 1970) stopped immediately after the fixes. No further "crash" occurred; the next reboot (12:43) was manual.

### Result
- `mouse-chord` ✅ works (Right+Wheel → Tab switching, uinput device created)
- `agy-zen-proxy` ❌ removed (no project)
- `upscale-cam` ⏸ disabled, symlink correct, script intact in `synchronika`

---

## How to revert

Backups live in [`scripts/backup/`](../../scripts/backup/):
- `services-enabled-before.list` — full enabled-units snapshot before changes.
- `packages-before.list` — full installed-package list before changes.

Reinstall removed packages:
```bash
sudo dnf install -y qemu-guest-agent open-vm-tools iscsi-initiator-utils livesys-scripts ModemManager pcsc-lite at gssproxy numad
sudo systemctl enable --now accounts-daemon avahi-daemon
```

Restore broken services (if needed):
```bash
# agy-zen-proxy — only if project reappears
# mouse-chord — already fixed, just enable:
systemctl --user enable --now mouse-chord.service

# upscale-cam — enable when ready:
sudo systemctl enable --now upscale-cam.service
```

---

## Verification performed
- `dnf check` → no real dependency breakage (only pre-existing version duplicates).
- Removed packages have **no installed reverse-dependencies**.
- `sddm` active; KDE session intact.
- Journal clean: no restart loops, no MODULE_NOT_FOUND errors.