#!/bin/bash
# 🖼️ Pixel Wallpaper Manager — خلفيات لشاشتين + شاشة القفل
set -euo pipefail
source "$(dirname "$0")/lib.sh"

WALL_DIR="$HOME/Pictures/PixelWalls"
COMBINED_DIR="$WALL_DIR/combined"

ensure_dirs() { mkdir -p "$WALL_DIR" "$COMBINED_DIR"; }

get_images() {
    find "$WALL_DIR" -maxdepth 1 -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) 2>/dev/null | sort
}

apply_wallpaper() {
    local image="$1" target="${2:-desktop}"
    [ -f "$image" ] || { err "الملف غير موجود: $image"; return 1; }
    local uri="file://$image"
    case "$target" in
        desktop)
            gsettings set org.cinnamon.desktop.background picture-uri "$uri" 2>/dev/null || true
            gsettings set org.cinnamon.desktop.background picture-uri-dark "$uri" 2>/dev/null || true
            ;;
        lock)
            gsettings set org.cinnamon.desktop.screensaver picture-uri "$uri" 2>/dev/null || true
            gsettings set org.cinnamon.desktop.screensaver picture-uri-dark "$uri" 2>/dev/null || true
            ;;
        both) apply_wallpaper "$image" "desktop"; apply_wallpaper "$image" "lock" ;;
    esac
    log "تم تطبيق: $(basename "$image")"
}

dual_monitor_wallpaper() {
    local left="$1" right="$2"
    [ -f "$left" ] && [ -f "$right" ] || { err "אחד הקבצים לא נמצא!"; return 1; }
    command -v convert &>/dev/null || sudo apt install -y imagemagick 2>/dev/null || { err "imagemagick غير متاح"; return 1; }
    local target_h
    target_h=$(identify -format "%h" "$left" 2>/dev/null || echo 1080)
    local combined="$COMBINED_DIR/dual_$(date +%s).png"
    convert +append \( "$left" -resize x${target_h} \) \( "$right" -resize x${target_h} \) "$combined" 2>/dev/null || { err "فشل الدمج"; return 1; }
    gsettings set org.cinnamon.desktop.background picture-uri "file://$combined" 2>/dev/null || true
    gsettings set org.cinnamon.desktop.background picture-options "spanned" 2>/dev/null || true
    log "تم تطبيق الخلفية المزدوجة"
}

random_wallpaper() {
    local images count
    images=$(get_images); count=$(echo "$images" | grep -c . || echo 0)
    [ "$count" -eq 0 ] && { err "لا توجد صور في $WALL_DIR"; return 1; }
    local selected
    selected=$(echo "$images" | sed -n "$((RANDOM % count + 1))p")
    apply_wallpaper "$selected" "both"
}

show_gui() {
    command -v zenity &>/dev/null || { log "تثبيت zenity..."; sudo apt install -y zenity 2>/dev/null; }
    ensure_dirs
    local images count
    images=$(get_images); count=$(echo "$images" | grep -c . || echo 0)
    [ "$count" -eq 0 ] && { zenity --info --text="لا توجد صور في:\n$WALL_DIR" --width=300 2>/dev/null; return 1; }
    ACTION=$(zenity --list --title="🖼️ Wallpaper Manager" --text="اختر الإجراء:" \
        --column="إجراء" --column="وصف" --width=400 --height=300 \
        "desktop" "خلفية سطح المكتب" "lock" "شاشة القفل" "both" "الكلاهما" \
        "dual" "دمج خلفيتين" "random" "عشوائي" 2>/dev/null) || return 0
    case "$ACTION" in
        desktop|lock|both)
            SELECTED=$(zenity --file-selection --title="اختر الصورة" \
                --file-filter="Images|*.png *.jpg *.jpeg *.webp" --filename="$WALL_DIR/" 2>/dev/null) || return 0
            apply_wallpaper "$SELECTED" "$ACTION"
            ;;
        dual)
            LEFT=$(zenity --file-selection --title="الشاشة اليسرى" --filename="$WALL_DIR/" 2>/dev/null) || return 0
            RIGHT=$(zenity --file-selection --title="الشاشة اليمنى" --filename="$WALL_DIR/" 2>/dev/null) || return 0
            dual_monitor_wallpaper "$LEFT" "$RIGHT"
            ;;
        random) random_wallpaper ;;
    esac
}

case "${1:-}" in
    --help|-h)
        echo "🖼️ Pixel Wallpaper Manager"
        echo "  $(basename "$0")              # GUI"
        echo "  $(basename "$0") --random     # عشوائي"
        echo "  $(basename "$0") --dual L R   # دمج خلفيتين"
        ;;
    --random)   random_wallpaper ;;
    --dual)     dual_monitor_wallpaper "${2:?حدد الصورة اليسرى}" "${3:?حدد الصورة اليمنى}" ;;
    "")         show_gui ;;
    *)          [ -f "$1" ] && apply_wallpaper "$1" "both" || { err "ملف غير موجود: $1"; exit 1; };;
    *)          err "خيار غير معروف: $1"; exit 1 ;;
esac
