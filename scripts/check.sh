#!/usr/bin/env bash
# =============================================================================
# Configuration Check Script
# Verifies current optimization settings
# =============================================================================

set -euo pipefail

readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

check() { [[ -n "${2:-}" ]] && echo -e "${GREEN}✓${NC} $1: $2" || echo -e "${RED}✗${NC} $1: not set"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo "=== GRUB Configuration ==="
if [[ -f /etc/default/grub ]]; then
    cmdline=$(grep "^GRUB_CMDLINE_LINUX=" /etc/default/grub | cut -d'"' -f2)
    [[ "$cmdline" == *"clear_cpuid=514"* ]] && check "clear_cpuid" "set" || warn "clear_cpuid=514 missing"
    [[ "$cmdline" == *"zswap.max_pool_percent=100"* ]] && check "zswap" "set" || warn "zswap.max_pool_percent=100 missing"
    [[ "$cmdline" == *"transparent_hugepage=always"* ]] && check "hugepages" "set" || warn "transparent_hugepage=always missing"
    [[ "$cmdline" == *"nvidia-drm.modeset=1"* ]] && check "nvidia-drm" "set" || warn "nvidia-drm.modeset=1 missing"
else
    warn "/etc/default/grub not found"
fi

echo ""
echo "=== Environment Variables ==="
[[ -f /etc/environment ]] || warn "/etc/environment not found"
[[ -f /etc/environment ]] && grep -q "LIBVA_DRIVER_NAME=nvidia" /etc/environment && check "LIBVA_DRIVER_NAME" "nvidia" || warn "LIBVA_DRIVER_NAME not set"
[[ -f /etc/environment ]] && grep -q "MOZ_ENABLE_WAYLAND=1" /etc/environment && check "MOZ_ENABLE_WAYLAND" "1" || warn "MOZ_ENABLE_WAYLAND not set"
[[ -f /etc/environment ]] && grep -q "ENABLE_HDR_WSI=1" /etc/environment && check "ENABLE_HDR_WSI" "1" || warn "ENABLE_HDR_WSI not set"

echo ""
echo "=== Power Profile ==="
if command -v powerprofilesctl &>/dev/null; then
    profile=$(powerprofilesctl get)
    [[ "$profile" == "performance" ]] && check "Power profile" "performance" || warn "Power profile: $profile (should be performance)"
else
    warn "powerprofilesctl not found"
fi

echo ""
echo "=== Zen Browser ==="
zen_profile=$(find "$HOME/.zen" "$HOME/.local/share/zen" "$HOME/.mozilla/zen" -name "user.js" 2>/dev/null | head -1)
[[ -n "$zen_profile" ]] && check "Zen user.js" "found at $zen_profile" || warn "Zen Browser user.js not found"

echo ""
echo "=== System Info ==="
check "Kernel" "$(uname -r)"
check "NVIDIA Driver" "$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null || echo 'not found')"
check "Wayland" "$([[ -n "${WAYLAND_DISPLAY:-}" ]] && echo 'active' || echo 'X11')"
