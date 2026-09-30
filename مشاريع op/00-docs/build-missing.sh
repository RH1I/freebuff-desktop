#!/bin/bash
# build-missing.sh - بناء النواقص فقط (SimpMusic desktop + Komi + Harbor)
set -e
BASE="/home/bsh3/Desktop/مشاريع op"
echo "=== بناء النواقص (اختياري - يأخذ وقت) ==="

echo "[1] SimpMusic desktop binary (يحتاج Conveyor + وقت 10-15د)..."
echo "المصدر: $BASE/SimpMusic_best/"
echo "الأمر: cd \"$BASE/SimpMusic_best\" && ./gradlew :desktopApp:packageDistributionForCurrentOS"
echo "أو: bash build-desktop.sh (إن وجد)"
echo "الحالي: jar موجود desktopApp/build/libs/desktopApp-jvm-1.7.0.jar لكن binary ناقص"
read -p "هل تبي أبنيه الآن؟ (y/n) " ans
if [[ "$ans" == "y" ]]; then
  cd "$BASE/SimpMusic_best"
  export JAVA_HOME="$HOME/tools/msjdk"
  export ANDROID_HOME="$HOME/Android/Sdk"
  export PATH="$JAVA_HOME/bin:$PATH"
  echo "JAVA_HOME=$JAVA_HOME"
  java -version 2>&1 | head -2
  ./gradlew :desktopApp:packageDistributionForCurrentOS 2>&1 | tail -30
  ls -lh desktopApp/build/compose/binaries/ 2>&1 | head -20 || echo "فشل - راجع BUILD_LOG.md"
fi

echo ""
echo "[2] Komi build (إن أردت إعادة بناء)..."
echo "cd \"$BASE/Komi_best\" && export JAVA_HOME=\$HOME/tools/msjdk && export ANDROID_HOME=\$HOME/Android/Sdk && ./gradlew assembleDebug"

echo ""
echo "[3] Harbor build (pnpm + cargo)..."
echo "cd \"$BASE/Harbor_best_0.9.89\" && pnpm install && cargo check --manifest-path src-tauri/Cargo.toml && pnpm tauri build"

echo "=== انتهى ==="
