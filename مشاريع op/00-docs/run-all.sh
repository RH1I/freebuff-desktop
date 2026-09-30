#!/bin/bash
# run-all.sh - تشغيل كل التطبيقات مباشرة بدون تثبيت
set -e
BASE="/home/bsh3/Desktop/مشاريع op"
echo "=== تشغيل التطبيقات مباشرة ==="

echo "[1] ascii-0x (Vite)..."
echo "cd \"$BASE/ascii-0x\" && npm run dev  # يفتح http://localhost:5173"
# cd "$BASE/ascii-0x" && npm run dev &

echo "[2] Freebuff scripts..."
echo "bash \"$BASE/Freebuff_best/scripts/THE_ULTIMATE_MASTER.sh\""
echo "bash \"$BASE/Freebuff_best/scripts/Color_God.sh\""

echo "[3] 7meshX AppImage..."
echo "\"$BASE/7meshX_best_3.1.0/dist/7meshX-3.1.0-x86_64.AppImage\" &"

echo "[4] Harbor AppImage..."
echo "\"$BASE/external_best/harbor-packages_best/Harbor_0.9.89_amd64.AppImage\" &"

echo "[5] Freebuff AppImage..."
echo "\"$BASE/external_best/Freebuff-0.0.75-linux-x86_64.AppImage\" &"

echo "[6] PlayTorrio / Recordly..."
echo "\"$BASE/external_best/apps/PlayTorrio-1.4.0.AppImage\" &"
echo "\"$BASE/external_best/apps/Recordly-linux-x64.AppImage\" &"

echo "[7] خدمات 3lmnu/upscale (شغالة مسبقاً)..."
systemctl --user is-active 3lmni upscale lockbeast-scheduler
echo "3lmnu: http://127.0.0.1:3100 - $(curl -s -o /dev/null -w %{http_code} http://127.0.0.1:3100/)"
echo "upscale: http://127.0.0.1:3456 - $(curl -s -o /dev/null -w %{http_code} http://127.0.0.1:3456/)"

echo "[8] للتطوير بدون تثبيت:"
echo "cd \"$BASE/Harbor_best_0.9.89\" && pnpm tauri dev"
echo "cd \"$BASE/3lmnu\" && bun run dev  # أو npm run dev"
echo "cd \"$BASE/upscale\" && npm run dev"

echo "=== كل التطبيقات جاهزة - انسخ الأمر اللي تبيه وشغّله ==="
