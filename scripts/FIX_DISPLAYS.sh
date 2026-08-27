#!/bin/bash
# 🖥️ FIX DISPLAYS — إصلاح الشاشات + autostart
set -euo pipefail
source "$(dirname "$0")/lib.sh"

AUTOSTART_DIR="$HOME/.config/autostart"
XRANDR_SCRIPT="$HOME/.config/fixdisplays/xrandr-setup.sh"

fix_lockscreen() {
    CURRENT_WALL=$(gsettings get org.cinnamon.desktop.background picture-uri | sed "s/file:\/\///" | tr -d "'" 2>/dev/null || echo "")
    if [ -n "$CURRENT_WALL" ]; then
        gsettings set org.cinnamon.desktop.screensaver picture-uri "file://$CURRENT_WALL" 2>/dev/null || true
        gsettings set org.cinnamon.desktop.screensaver picture-uri-dark "file://$CURRENT_WALL" 2>/dev/null || true
        log "شاشة القفل: $(basename "$CURRENT_WALL")"
    fi
    killall cinnamon-screensaver 2>/dev/null || true
}

set_primary_external() {
    EXTERNAL_MON=$(xrandr --query 2>/dev/null | grep " connected" | grep -v "eDP" | awk '{print $1}' | head -n 1)
    if [ -n "$EXTERNAL_MON" ]; then
        xrandr --output "$EXTERNAL_MON" --primary --auto 2>/dev/null || true
        log "تم تعيين $EXTERNAL_MON كشاشة أساسية"
    else
        warn "لا توجد شاشة خارجية"
    fi
}

save_and_autostart() {
    mkdir -p "$(dirname "$XRANDR_SCRIPT")"
    cat > "$XRANDR_SCRIPT" << 'EOF'
#!/bin/bash
sleep 2
EXTERNAL_MON=$(xrandr --query 2>/dev/null | grep " connected" | grep -v "eDP" | awk '{print $1}' | head -n 1)
[ -n "$EXTERNAL_MON" ] && xrandr --output "$EXTERNAL_MON" --primary --auto 2>/dev/null
CURRENT_WALL=$(gsettings get org.cinnamon.desktop.background picture-uri 2>/dev/null | sed "s/file:\/\///" | tr -d "'")
[ -n "$CURRENT_WALL" ] && {
    gsettings set org.cinnamon.desktop.screensaver picture-uri "file://$CURRENT_WALL" 2>/dev/null
    gsettings set org.cinnamon.desktop.screensaver picture-uri-dark "file://$CURRENT_WALL" 2>/dev/null
}
EOF
    chmod +x "$XRANDR_SCRIPT"
    mkdir -p "$AUTOSTART_DIR"
    cat > "$AUTOSTART_DIR/fixdisplays.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Fix Displays
Name[ar]=إصلاح الشاشات
Exec=bash $XRANDR_SCRIPT
X-GNOME-Autostart-enabled=true
EOF
}

case "${1:-}" in
    --help|-h)
        echo "🖥️ FIX DISPLAYS"
        echo "  $(basename "$0")          # إصلاح شامل + autostart"
        echo "  $(basename "$0") --restore  # استرجاع الإعدادات"
        ;;
    --restore)
        [ -f "$XRANDR_SCRIPT" ] && bash "$XRANDR_SCRIPT" && log "تم الاسترجاع" || warn "لا توجد إعدادات محفوظة"
        ;;
    "")
        fix_lockscreen
        set_primary_external
        save_and_autostart
        log "✅ تم إصلاح الشاشات!"
        ;;
    *) echo "خيار غير معروف: $1"; exit 1 ;;
esac
