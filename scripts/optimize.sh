#!/usr/bin/env bash
# =============================================================================
# Fedora Workstation Optimization Script
# Xeon E5 v3 + NVIDIA GTX - Automated Setup
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly BACKUP_DIR="$HOME/.xeon-gtx-backups/$(date +%Y%m%d_%H%M%S)"

# Dry-run mode
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# =============================================================================
# Utilities
# =============================================================================

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_dry() { [[ "$DRY_RUN" == true ]] && echo -e "${BLUE}[DRY-RUN]${NC} $*"; }

check_root() {
    if [[ "$DRY_RUN" != true ]]; then
        [[ $EUID -eq 0 ]] || { log_error "This script must be run as root"; exit 1; }
    else
        log_dry "Skipping root check (dry-run mode)"
    fi
}

backup_file() {
    local file="$1"
    [[ -f "$file" ]] || return 0
    if [[ "$DRY_RUN" == true ]]; then
        log_dry "Would backup: $file -> $BACKUP_DIR$file"
        return 0
    fi
    mkdir -p "$(dirname "$BACKUP_DIR$file")"
    cp -v "$file" "$BACKUP_DIR$file"
    log_info "Backed up: $file"
}

# =============================================================================
# GRUB Configuration
# =============================================================================

configure_grub() {
    log_info "Configuring GRUB boot parameters..."
    
    local grub_file="/etc/default/grub"
    backup_file "$grub_file"
    
    # Required parameters
    local params=(
        "nvidia-drm.modeset=1"
        "clear_cpuid=514"
        "zswap.max_pool_percent=100"
        "transparent_hugepage=always"
    )
    
    # Optional: mitigations=off (uncomment if needed)
    # params+=("mitigations=off")
    
    local cmdline="GRUB_CMDLINE_LINUX="
    local current_line=$(grep "^GRUB_CMDLINE_LINUX=" "$grub_file" || echo "$cmdline\"\"")
    
    # Extract existing params (remove quotes)
    local existing="${current_line#*=}"
    existing="${existing#\"}"
    existing="${existing%\"}"
    
    # Add new params if not present
    for param in "${params[@]}"; do
        if ! grep -q "$param" <<< "$existing"; then
            existing="$existing $param"
        fi
    done
    
    # Update file
    if [[ "$DRY_RUN" == true ]]; then
        log_dry "Would update GRUB_CMDLINE_LINUX to: $existing"
    else
        sed -i "s|^GRUB_CMDLINE_LINUX=.*|$cmdline\"$existing\"|" "$grub_file"
        log_info "Updated GRUB_CMDLINE_LINUX"
    fi
    log_warn "Run 'sudo grub2-mkconfig -o /boot/grub2/grub.cfg' and reboot to apply"
}

# =============================================================================
# Environment Variables (/etc/environment)
# =============================================================================

configure_environment() {
    log_info "Configuring system environment variables..."
    
    local env_file="/etc/environment"
    backup_file "$env_file"
    
    # Read existing content
    local existing=""
    [[ -f "$env_file" ]] && existing=$(cat "$env_file")
    
    # Required variables
    if [[ "$DRY_RUN" == true ]]; then
        log_dry "Would write environment variables to: $env_file"
        log_dry "Variables: LIBVA_DRIVER_NAME, MOZ_ENABLE_WAYLAND, ENABLE_HDR_WSI, etc."
    else
        cat > "$env_file" <<'EOF'
# NVIDIA VA-API
LIBVA_DRIVER_NAME=nvidia
NVD_BACKEND=direct

# Wayland (Firefox/Zen)
MOZ_ENABLE_WAYLAND=1
MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
MOZ_DISABLE_HW_COMPOSITING_BLOCKLIST=1
MOZ_DISABLE_RDD_SANDBOX=1
MOZ_WEBRENDER=1

# NVIDIA Explicit Sync (Driver 580+)
__GL_MaxFramesAllowed=1
__GL_GSYNC_ALLOWED=0

# Font rendering
FREETYPE_PROPERTIES="truetype:interpreter-version=40"

# HDR support
ENABLE_HDR_WSI=1

# Chromium browsers (Thorium)
EGL_PLATFORM=wayland
__GLX_VENDOR_LIBRARY_NAME=nvidia
EOF
    fi
    
    # Preserve existing custom variables (if any)
    if [[ "$DRY_RUN" != true ]] && [[ -n "$existing" ]]; then
        echo "" >> "$env_file"
        echo "# Custom variables (preserved)" >> "$env_file"
        echo "$existing" | grep -vE "^(LIBVA_DRIVER_NAME|NVD_BACKEND|MOZ_|__GL_|FREETYPE_PROPERTIES|ENABLE_HDR_WSI|EGL_PLATFORM|__GLX_VENDOR_LIBRARY_NAME)=" >> "$env_file" || true
    fi
    
    log_info "Environment variables configured"
}

# =============================================================================
# Zen Browser Configuration
# =============================================================================

configure_zen_browser() {
    log_info "Configuring Zen Browser..."
    
    local user_js="$PROJECT_ROOT/configs/zen-browser/user.js"
    [[ -f "$user_js" ]] || { log_warn "user.js not found, skipping"; return 0; }
    
    # Find Zen Browser profile directory
    local profile_dir=""
    local possible_dirs=(
        "$HOME/.zen"
        "$HOME/.local/share/zen"
        "$HOME/.mozilla/zen"
    )
    
    for dir in "${possible_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            # Find default profile
            profile_dir=$(find "$dir" -type d -name "*.default*" -o -type d -name "default" | head -1)
            [[ -n "$profile_dir" ]] && break
        fi
    done
    
    # If not found, try to detect from running process
    if [[ -z "$profile_dir" ]]; then
        local zen_pid=$(pgrep -f "zen" | head -1)
        if [[ -n "$zen_pid" ]]; then
            local zen_proc=$(readlink "/proc/$zen_pid/exe" 2>/dev/null || true)
            if [[ -n "$zen_proc" ]]; then
                log_info "Detected running Zen Browser, please specify profile directory manually"
            fi
        fi
    fi
    
    if [[ -z "$profile_dir" ]]; then
        log_warn "Zen Browser profile not found automatically"
        log_info "To install manually:"
        log_info "  1. Open Zen Browser"
        log_info "  2. Go to about:support"
        log_info "  3. Copy 'Profile Folder' path"
        log_info "  4. Run: cp $user_js <profile-folder>/user.js"
        return 0
    fi
    
    backup_file "$profile_dir/user.js"
    if [[ "$DRY_RUN" == true ]]; then
        log_dry "Would copy user.js to: $profile_dir/user.js"
    else
        cp "$user_js" "$profile_dir/user.js"
        log_info "Installed user.js to: $profile_dir"
    fi
}

# =============================================================================
# Power Profile
# =============================================================================

configure_power_profile() {
    log_info "Configuring power profile..."
    
    if command -v powerprofilesctl &>/dev/null; then
        if [[ "$DRY_RUN" == true ]]; then
            log_dry "Would set power profile to: performance"
        else
            powerprofilesctl set performance || log_warn "Failed to set performance profile"
            log_info "Power profile set to: performance"
        fi
    else
        log_warn "powerprofilesctl not found, skipping"
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    check_root
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "Starting Fedora Workstation optimization (DRY-RUN MODE)..."
        log_dry "No files will be modified"
    else
        log_info "Starting Fedora Workstation optimization..."
        log_info "Backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    configure_grub
    configure_environment
    configure_zen_browser
    configure_power_profile
    
    log_info ""
    log_info "Optimization complete!"
    log_warn "Next steps:"
    log_warn "  1. Run: sudo grub2-mkconfig -o /boot/grub2/grub.cfg"
    log_warn "  2. Reboot the system"
    log_warn "  3. Verify Zen Browser user.js installation (if needed)"
}

main "$@"
