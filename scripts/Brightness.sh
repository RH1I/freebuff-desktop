#!/bin/bash
# 🔆 Brightness Control — تحكم سطوع كل الشاشات
set -euo pipefail
source "$(dirname "$0")/lib.sh"

SETTINGS_DIR="$HOME/.config/brightness"
SETTINGS_FILE="$SETTINGS_DIR/last.conf"

set_brightness() {
    local value="$1" monitor="${2:-}"
    [[ "$value" =~ ^[0-9]+$ ]] && [ "$value" -ge 1 ] && [ "$value" -le 100 ] || { err "قيمة غير صالحة: $value"; return 1; }
    local decimal
    decimal=$(awk "BEGIN {printf \"%.2f\", $value/100}")
    local monitors applied=0
    [ -n "$monitor" ] && monitors="$monitor" || monitors=$(get_monitors)
    if [ -z "$monitors" ]; then err "لا توجد شاشات!"; return 1; fi
    for mon in $monitors; do
        xrandr --output "$mon" --brightness "$decimal" 2>/dev/null && applied=$((applied+1))
    done
    if [ $applied -gt 0 ]; then
        log "السطوع: $value% ($applied شاشة)"
        notify-send "🔆 Brightness" "السطوع: $value%" 2>/dev/null || true
        mkdir -p "$SETTINGS_DIR"
        echo -e "brightness=$value\ntimestamp=$(date +%s)" > "$SETTINGS_FILE"
    fi
}

show_gui() {
    command -v zenity &>/dev/null || { warn "تثبيت zenity..."; sudo apt install -y zenity 2>/dev/null; }
    local last=100
    [ -f "$SETTINGS_FILE" ] && last=$(grep "^brightness=" "$SETTINGS_FILE" | cut -d'=' -f2 || echo 100)
    local count
    count=$(get_monitors | wc -w)
    local text="$count شاشات متصلة"
    [ "$count" -eq 1 ] && text="شاشة واحدة: $(get_monitors)"
    VAL=$(zenity --scale --title="🔆 Brightness" --text="$text\nاسحب المؤشر" \
        --min-value=1 --max-value=100 --value="$last" --step=1 --width=400 2>/dev/null) || exit 0
    set_brightness "$VAL"
}

case "${1:-}" in
    --help|-h)
        echo "🔆 Brightness Control"
        echo "  $(basename "$0")              # GUI"
        echo "  $(basename "$0") --set 80     # ضبط يدوي"
        echo "  $(basename "$0") --reset      # إعادة ضبط 100%"
        ;;
    --set|-s)  set_brightness "${2:?حدد القيمة 1-100}" ;;
    --reset)   set_brightness 100 ;;
    "")        show_gui ;;
    *)         err "خيار غير معروف: $1"; exit 1 ;;
esac
