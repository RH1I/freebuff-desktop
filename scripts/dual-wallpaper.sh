#!/bin/bash
# 🖼️ Dual Wallpaper — خلفية مختلفة لكل شاشة
source "$(dirname "$0")/lib.sh"

WALL_DIR="$HOME/Pictures/PixelWalls"

# Get monitors
LEFT=$(xrandr --query | grep " connected" | grep "eDP" | awk '{print $1}')
RIGHT=$(xrandr --query | grep " connected" | grep -v "eDP" | awk '{print $1}' | head -n 1)

if [ -z "$LEFT" ] || [ -z "$RIGHT" ]; then
    err "تحتاج شاشتين (لابتوب + خارجية)"
    exit 1
fi

echo "🖥️ الشاشات:"
echo "  يسار: $LEFT (لابتوب)"
echo "  يمين: $RIGHT (خارجية)"
echo ""

# List available wallpapers
echo "📁 الصور المتاحة:"
select img in $(ls "$WALL_DIR"/*.png "$WALL_DIR"/*.jpg 2>/dev/null | xargs -n1 basename); do
    [ -n "$img" ] && break
done
LEFT_IMG="$WALL_DIR/$img"
echo "  اخترت: $img للشاشة اليسرى"
echo ""

echo "📁 الصور المتاحة:"
select img in $(ls "$WALL_DIR"/*.png "$WALL_DIR"/*.jpg 2>/dev/null | xargs -n1 basename); do
    [ -n "$img" ] && break
done
RIGHT_IMG="$WALL_DIR/$img"
echo "  اخترت: $img للشاشة اليمنى"
echo ""

# Apply with feh
echo "🎨 تطبيق الخلفيات..."
feh --bg-fill "$LEFT_IMG" --bg-fill "$RIGHT_IMG" 2>/dev/null

# Also set via gsettings for Cinnamon
gsettings set org.cinnamon.desktop.background picture-uri "file://$LEFT_IMG" 2>/dev/null || true
gsettings set org.cinnamon.desktop.background picture-options "spanned" 2>/dev/null || true

log "تم تطبيق خلفية مختلفة لكل شاشة!"
echo "  يسار: $(basename "$LEFT_IMG")"
echo "  يمين: $(basename "$RIGHT_IMG")"
