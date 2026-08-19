# 📦 DNF Repository & Configuration Audit

> Cleaning up dead repositories and hardening DNF configuration for a lean, reproducible system.

## Outcome (applied 2026-08-19)

### Removed dead repositories (14 files)

| Repository file | Reason |
|-----------------|--------|
| `mullvad.repo` | Mullvad VPN — not used (WireGuard/other) |
| `protonvpn-stable.repo` | ProtonVPN — not used |
| `_copr:copr.fedorainfracloud.org:mikaeldui:kernel-cachyos.repo` | Duplicate kernel COPR (using `bieszczaders`) |
| `windsurf.repo` | Windsurf IDE — dead repo, not used |
| `warpdotdev.repo` | Warp Terminal — installed via RPM, repo not needed |
| `docker-ce.repo` | Docker — not used (Podman preferred) |
| `nvidia-container-toolkit.repo` | NVIDIA container toolkit — not used |
| `antigravity.repo` | Unknown/abandoned repo |
| `_copr:copr.fedorainfracloud.org:boria138:portproton.repo` | PortProton — not used |
| `_copr:copr.fedorainfracloud.org:wehagy:protonplus.repo` | ProtonPlus — not used |
| `google-chrome.repo.rpmsave` | Obsolete backup |
| `_copr:copr.fedorainfracloud.org:phracek:PyCharm.repo.rpmsave` | Obsolete backup |
| `rpmfusion-nonfree-nvidia-driver.repo.rpmsave` | Obsolete backup |
| `rpmfusion-nonfree-steam.repo.rpmsave` | Obsolete backup |

**Cache cleaned:** `sudo dnf clean all` (freed ~2 GiB)

### Active repositories after cleanup

```
copr:copr.fedorainfracloud.org:bieszczaders:kernel-cachyos
copr:copr.fedorainfracloud.org:bieszczaders:kernel-cachyos-addons
copr:copr.fedorainfracloud.org:varlad:zellij
cuda-fedora44-x86_64
cursor
fedora
fedora-cisco-openh264
rpmfusion-free
rpmfusion-free-updates
rpmfusion-nonfree
rpmfusion-nonfree-updates
tailscale-stable
terra
updates
```

### dnf.conf hardened

**Before:**
```ini
[main]
fastestmirror=True
max_parallel_downloads=10
```

**After (`/etc/dnf/dnf.conf`):**
```ini
[main]
fastestmirror=True
max_parallel_downloads=10
keepcache=0
clean_requirements_on_remove=1
install_weak_deps=0
```

| Setting | Value | Reason |
|---------|-------|--------|
| `keepcache` | `0` | Don't retain downloaded RPMs after install (saves disk space) |
| `clean_requirements_on_remove` | `1` | Auto-remove unneeded dependencies when removing packages |
| `install_weak_deps` | `0` | Don't install weak dependencies (recommends/supplements) — explicit control only |

---

## How to revert

```bash
# Restore repo files from backup (if you made one) or re-add manually:
# Example for Mullvad:
sudo dnf config-manager --add-repo https://repository.mullvad.net/rpm/stable/mullvad.repo

# Reset dnf.conf to minimal:
sudo tee /etc/dnf/dnf.conf > /dev/null << 'EOF'
[main]
fastestmirror=True
max_parallel_downloads=10
EOF
```

---

## Verification performed

- `dnf repolist --enabled` → only intended repos active
- `dnf check` → no dependency issues
- `sudo dnf upgrade --refresh --dry-run` → works cleanly
- Disk space freed: ~2 GiB from cache cleanup