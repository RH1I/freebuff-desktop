#!/bin/bash
# 🔥 BREAK LIMITS — كسر قيود الشاشة وأقصى أداء رسومي
set -euo pipefail
source "$(dirname "$0")/lib.sh"

PICOM_CONFIG="$HOME/.config/picom/picom.conf"
BACKUP_DIR="$HOME/.config/breaklimits-backup"

backup_config() {
    mkdir -p "$BACKUP_DIR"
    [ -f "$PICOM_CONFIG" ] && cp "$PICOM_CONFIG" "$BACKUP_DIR/picom.conf.bak"
    [ -f /etc/X11/xorg.conf.d/10-nvidia.conf ] && sudo cp /etc/X11/xorg.conf.d/10-nvidia.conf "$BACKUP_DIR/10-nvidia.conf.bak"
}

revert_settings() {
    log "إرجاع الإعدادات..."
    [ -f "$BACKUP_DIR/picom.conf.bak" ] && cp "$BACKUP_DIR/picom.conf.bak" "$PICOM_CONFIG" || rm -f "$PICOM_CONFIG"
    [ -f "$BACKUP_DIR/10-nvidia.conf.bak" ] && sudo cp "$BACKUP_DIR/10-nvidia.conf.bak" /etc/X11/xorg.conf.d/10-nvidia.conf || sudo rm -f /etc/X11/xorg.conf.d/10-nvidia.conf
    gsettings set org.cinnamon compositing-manager true 2>/dev/null || true
    killall picom 2>/dev/null || true
    log "تم الإرجاع! أعد التشغيل."
}

setup_nvidia() {
    log "إعداد NVIDIA..."
    sudo mkdir -p /etc/X11/xorg.conf.d
    sudo bash -c 'cat > /etc/X11/xorg.conf.d/10-nvidia.conf << EOF
Section "Device"
    Identifier "NVIDIA"
    Driver "nvidia"
    Option "AllowFlipping" "true"
    Option "TripleBuffer" "true"
    Option "ConnectorMonitorHWScale" "true"
    Option "Coolbits" "28"
EndSection
Section "Screen"
    Identifier "Screen0"
    Option "metamodes" "nvidia-auto-select +0+0 {ForceCompositionPipeline=On, ForceFullCompositionPipeline=On}"
EndSection
EOF'
}

setup_picom() {
    log "إعداد picom..."
    command -v picom &>/dev/null || sudo apt install -y picom 2>/dev/null || warn "picom غير متاح"
    sudo apt install -y xcalib 2>/dev/null || true
    gsettings set org.cinnamon compositing-manager false 2>/dev/null || true
    mkdir -p "$HOME/.config/picom"
    cat > "$PICOM_CONFIG" << 'EOF'
backend = "glx";
glx-no-stencil = true;
use-damage = true;
vsync = true;
unredir-if-possible = true;
shadow = true;
shadow-radius = 12;
shadow-offset-x = -7;
shadow-offset-y = -7;
shadow-opacity = 0.6;
shadow-exclude = ["name = 'Notification'", "class_g = 'Conky'", "_GTK_FRAME_EXTENTS@:c"];
fading = true;
fade-in-step = 0.03;
fade-out-step = 0.03;
fade-delta = 5;
inactive-opacity = 0.95;
active-opacity = 1.0;
opacity-rule = ["100:class_g = 'firefox'", "100:class_g = 'chromium'", "100:class_g = 'vlc'", "100:class_g = 'mpv'", "95:class_g = 'Rofi'"];
paint-on-overlay = true;
glx-swap-method = 2;
EOF
    killall picom 2>/dev/null || true
    killall compton 2>/dev/null || true
    picom -b --config "$PICOM_CONFIG" 2>/dev/null || picom -b 2>/dev/null || err "picom فشل"
}

case "${1:-}" in
    --help|-h)
        echo "🔥 BREAK LIMITS"
        echo "  $(basename "$0")            # تفعيل كل الإعدادات"
        echo "  $(basename "$0") --revert   # إرجاع للوضع الطبيعي"
        ;;
    --revert) revert_settings ;;
    "")
        backup_config
        setup_nvidia
        setup_picom
        log "🔥 تم كسر الحدود! أعد التشغيل."
        echo "📋 للإرجاع: $(basename "$0") --revert"
        ;;
    *) err "خيار غير معروف: $1"; exit 1 ;;
esac
