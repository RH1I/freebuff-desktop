#!/bin/bash
# 🎨 Color God — تحكم بالسطوع والتباين مع presets
set -euo pipefail
source "$(dirname "$0")/lib.sh"

SETTINGS_DIR="$HOME/.config/colorgod"
SETTINGS_FILE="$SETTINGS_DIR/presets.conf"
CURRENT_FILE="$SETTINGS_DIR/current.conf"

declare -A PRESETS=(
    ["natural"]="1.0|1.0|1.0|1.0"
    ["cinema"]="0.85|1.1|1.0|0.9"
    ["gaming"]="1.1|1.05|1.05|1.1"
    ["reading"]="0.95|0.95|0.95|1.05"
    ["night_warm"]="0.7|1.2|1.05|0.8"
    ["night_cool"]="0.75|0.9|0.95|1.2"
    ["vibrant"]="1.05|1.3|1.2|1.1"
    ["muted"]="0.9|0.85|0.85|0.85"
    ["high_contrast"]="1.2|1.4|1.4|1.4"
    ["sepia"]="0.9|1.15|1.0|0.8"
)

get_monitors() {
    xrandr --query 2>/dev/null | grep " connected" | awk '{print $1}'
}

apply_color() {
    local brightness="$1" gamma_r="$2" gamma_g="$3" gamma_b="$4"
    local gamma="${gamma_r}:${gamma_g}:${gamma_b}"
    local monitors applied=0
    monitors=$(get_monitors)
    if [ -z "$monitors" ]; then err "لا توجد شاشات موصلة!"; return 1; fi
    for mon in $monitors; do
        xrandr --output "$mon" --brightness "$brightness" --gamma "$gamma" 2>/dev/null && applied=$((applied+1))
    done
    if [ $applied -gt 0 ]; then
        log "تم تطبيق الإعدادات على $applied شاشة"
        notify-send "🎨 Color God" "السطوع: $brightness | GAMMA: $gamma" 2>/dev/null || true
        mkdir -p "$SETTINGS_DIR"
        echo -e "brightness=$brightness\ngamma_r=$gamma_r\ngamma_g=$gamma_g\ngamma_b=$gamma_b" > "$CURRENT_FILE"
    fi
}

apply_preset() {
    local name="$1"
    if [[ -v "PRESETS[$name]" ]]; then
        IFS='|' read -r b r g bb <<< "${PRESETS[$name]}"
        log "preset: $name"
        apply_color "$b" "$r" "$g" "$bb"
    elif [ -f "$SETTINGS_FILE" ]; then
        local saved
        saved=$(grep "^${name}=" "$SETTINGS_FILE" 2>/dev/null | cut -d'=' -f2- || true)
        if [ -n "$saved" ]; then
            IFS='|' read -r b r g bb <<< "$saved"
            apply_color "$b" "$r" "$g" "$bb"
        else
            err "preset غير موجود: $name"
        fi
    else
        err "preset غير موجود: $name"
    fi
}

show_gui() {
    local cur_b=1.0 cur_r=1.0 cur_g=1.0 cur_b2=1.0
    [ -f "$CURRENT_FILE" ] && {
        cur_b=$(grep "^brightness=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
        cur_r=$(grep "^gamma_r=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
        cur_g=$(grep "^gamma_g=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
        cur_b2=$(grep "^gamma_b=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
    }
    VAL=$(zenity --forms --title="🎨 Color God" \
        --text="1.0 = طبيعي، 0.5 = غامق، 1.5 = فاتح" \
        --add-entry="السطوع" --add-entry="Gamma R" \
        --add-entry="Gamma G" --add-entry="Gamma B" \
        --separator="|" --width=400 2>/dev/null) || exit 0
    IFS='|' read -r BRIGHT GR GG GB <<< "$VAL"
    [ -z "$BRIGHT" ] && BRIGHT="$cur_b"
    [ -z "$GR" ] && GR="$cur_r"
    [ -z "$GG" ] && GG="$cur_g"
    [ -z "$GB" ] && GB="$cur_b2"
    apply_color "$BRIGHT" "$GR" "$GG" "$GB"
}

case "${1:-}" in
    --help|-h)
        echo "🎨 Color God"
        echo "  $(basename "$0")              # GUI"
        echo "  $(basename "$0") --preset X   # تطبيق preset"
        echo "  $(basename "$0") --list       # عرض الـ presets"
        echo "  $(basename "$0") --save NAME  # حفظ إعدادات حالية"
        echo "  $(basename "$0") --reset      # إعادة ضبط"
        ;;
    --list|-l)
        for name in "${!PRESETS[@]}"; do
            IFS='|' read -r b r g bb <<< "${PRESETS[$name]}"
            printf "  %-15s  %s | %s:%s:%s\n" "$name" "$b" "$r" "$g" "$bb"
        done
        ;;
    --preset|-p)  apply_preset "${2:?حدد اسم الـ preset}" ;;
    --save|-s)
        [ -z "${2:-}" ] && { err "حدد اسم"; exit 1; }
        mkdir -p "$SETTINGS_DIR"
        [ -f "$SETTINGS_FILE" ] && sed -i "/^${2}=/d" "$SETTINGS_FILE"
        local_b=1.0; local_r=1.0; local_g=1.0; local_bb=1.0
        [ -f "$CURRENT_FILE" ] && {
            local_b=$(grep "^brightness=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
            local_r=$(grep "^gamma_r=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
            local_g=$(grep "^gamma_g=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
            local_bb=$(grep "^gamma_b=" "$CURRENT_FILE" | cut -d'=' -f2 || echo 1.0)
        }
        echo "${2}=${local_b}|${local_r}|${local_g}|${local_bb}" >> "$SETTINGS_FILE"
        log "تم حفظ: $2"
        ;;
    --reset) apply_color 1.0 1.0 1.0 1.0 ;;
    "")      show_gui ;;
    *)       err "خيار غير معروف: $1"; exit 1 ;;
esac
