#!/bin/bash
# 🏗️ Build all Freebuff .deb packages
set -e

BUILD_DIR="/tmp/freebuff-debs"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="1.0.0"
MAINTAINER="Freebuff <freebuff@local>"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

build_deb() {
    local name="$1" desc="$2" script="$3"
    local pkg_dir="$BUILD_DIR/$name"

    echo "📦 بناء $name..."

    mkdir -p "$pkg_dir/DEBIAN" "$pkg_dir/usr/bin" "$pkg_dir/usr/share/applications"

    cp "$SCRIPTS_DIR/$script" "$pkg_dir/usr/bin/$name"
    chmod 755 "$pkg_dir/usr/bin/$name"

    cp "$SCRIPTS_DIR/lib.sh" "$pkg_dir/usr/bin/freebuff-lib.sh"
    chmod 644 "$pkg_dir/usr/bin/freebuff-lib.sh"

    sed -i 's|source "$(dirname "$0")/lib.sh"|source /usr/bin/freebuff-lib.sh|' "$pkg_dir/usr/bin/$name"

    cat > "$pkg_dir/DEBIAN/control" << EOF
Package: freebuff-$name
Version: $VERSION
Architecture: amd64
Maintainer: $MAINTAINER
Description: $desc
Section: utils
Priority: optional
EOF

    cat > "$pkg_dir/usr/share/applications/freebuff-$name.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$desc
Exec=/usr/bin/$name
Icon=utilities-terminal
Terminal=true
Categories=Utility;
EOF

    dpkg-deb --build "$pkg_dir" "$BUILD_DIR/freebuff-${name}_${VERSION}_amd64.deb"
    echo "  ✅ freebuff-${name}_${VERSION}_amd64.deb"
}

build_deb "color-god" "أداة الألوان (presets + GUI)" "Color_God.sh"
build_deb "brightness" "تحكم السطوع (كل الشاشات + GUI)" "Brightness.sh"
build_deb "break-limits" "كسر قيود الشاشة (NVIDIA + picom)" "BREAK_LIMITS.sh"
build_deb "fix-displays" "إصلاح الشاشات (autostart)" "FIX_DISPLAYS.sh"
build_deb "wallpaper" "مدير الخلفيات (dual monitor + GUI)" "pixel_wallpaper_manager.sh"
build_deb "dual-wallpaper" "خلفية مختلفة لكل شاشة" "dual-wallpaper.sh"
build_deb "status" "تقرير النظام" "upgrade-summary.sh"
build_deb "legendary" "التثبيت التفاعلي" "legendary-setup.sh"
build_deb "setup" "الإعداد الشامل" "THE_ULTIMATE_MASTER.sh"

# Meta package
mkdir -p "$BUILD_DIR/freebuff-all/DEBIAN"
cat > "$BUILD_DIR/freebuff-all/DEBIAN/control" << EOF
Package: freebuff-all
Version: $VERSION
Architecture: amd64
Maintainer: $MAINTAINER
Description: Freebuff Desktop - all tools
Depends: freebuff-color-god, freebuff-brightness, freebuff-break-limits, freebuff-fix-displays, freebuff-wallpaper, freebuff-dual-wallpaper, freebuff-status, freebuff-legendary, freebuff-setup
Section: metapackages
Priority: optional
EOF
dpkg-deb --build "$BUILD_DIR/freebuff-all" "$BUILD_DIR/freebuff-all_${VERSION}_amd64.deb"
echo "  ✅ freebuff-all_${VERSION}_amd64.deb (حزمة شاملة)"

echo ""
echo "📦 الحزم جاهزة في: $BUILD_DIR"
echo ""
ls -lh "$BUILD_DIR"/*.deb | awk '{print "  " $NF " (" $5 ")"}'
echo ""
echo "🚀 للتثبيت:"
echo "  sudo dpkg -i freebuff-all_${VERSION}_amd64.deb"
