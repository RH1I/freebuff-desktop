#!/bin/bash
# install-all.sh - تثبيت كل الـ debs الأفضل بذكاء (مرة واحدة)
set -e
BASE="/home/bsh3/Desktop/مشاريع op"
echo "=== تثبيت الحزم الأفضل ==="

# Freebuff 11 حزمة (إصلاح glob مع مسار عربي)
echo "[1/4] Freebuff..."
sudo dpkg -i "$BASE"/Freebuff_best/packages/freebuff-*.deb 2>&1 | tail -20 || echo "Freebuff: بعض الحزم قد تكون منصبة مسبقاً"

# Harbor BEST 0.9.89 (مع force-overwrite لـ yt-dlp)
echo "[2/4] Harbor 0.9.89 BEST..."
sudo dpkg -i --force-overwrite "$BASE/external_best/harbor-packages_best/Harbor_0.9.89_amd64.deb" 2>&1 | tail -10 || true
echo "Harbor منصّب: $(dpkg -l harbor 2>&1 | grep harbor | awk '{print $3}')"

# Komi (اختياري - يحتاج تأكيد)
echo "[3/4] Komi (اختياري - اسأل قبل التثبيت)..."
echo "لتثبيت Komi: sudo dpkg -i ~/Downloads/komi-premium_1.9.2_amd64.deb"
# sudo dpkg -i ~/Downloads/komi-premium_1.9.2_amd64.deb 2>&1 | tail -5 || true

# 7meshX (منصّب مسبقاً 3.1.0)
echo "[4/4] 7meshX..."
echo "7meshX منصّب: $(dpkg -l 7meshx 2>&1 | grep 7meshx | awk '{print $3}') - لا حاجة"

# AppImages جعلها تنفيذية (إصلاح glob)
echo "=== جعل AppImages تنفيذية ==="
chmod +x "$BASE"/external_best/apps/*.AppImage 2>&1 | head -5
chmod +x "$BASE"/external_best/harbor-packages_best/*.AppImage 2>&1 | head -5
chmod +x "$BASE/external_best/Freebuff-0.0.75-linux-x86_64.AppImage" 2>&1 | head -5
chmod +x "$BASE"/Freebuff_best/scripts/*.sh 2>&1 | head -5
echo "تم - كل AppImages وscripts جاهزة للتشغيل المباشر"
echo "=== انتهى ==="
