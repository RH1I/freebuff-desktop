# فهرس مشاريع op - كل شي حلو ويفيدك

> المجلد: `/home/bsh3/Desktop/مشاريع op` - الحجم الكلي 5.3G - تاريخ النسخ 2026-08-27 - كل التطبيقات تطبيقات فقط (بدون مهارات) - شامل المكتمل وغير المكتمل والمكرر

## الفهرس الشامل:

| # | المجلد | المصدر الأصلي | الحجم | الحالة | أمر التشغيل / التثبيت | ملاحظة |
|---|---|---|---|---|---|---|
| 1 | `Harbor_best_0.9.89/` | `~/Documents/Default Project/harbor` (git 67b9f4a) | 658M | **BEST** أكمل + مدمج | `cd Harbor_best_0.9.89 && pnpm tauri build` أو `sudo dpkg -i ../external_best/harbor-packages_best/Harbor_0.9.89_amd64.deb` | `target/` غير منسوخ، `node_modules` موجود |
| 2 | `7meshX_best_3.1.0/` | `~/Downloads/kudu-2.0.1` (git cc7729a, 1611/1611) | 1.5G | **BEST** مكتمل | `cd 7meshX_best_3.1.0 && npm run dev` أو `sudo dpkg -i dist/7meshX-3.1.0-amd64.deb` (منصّب) | `dist/` + `out/` + `node_modules` موجود، `AppImage` في `dist/` |
| 3 | `Komi_best/` | `~/Downloads/komi-src/komi-store-1.9.2` (git 07d991b) | 119M | **BEST** source | `cd Komi_best && ~/komi-build.sh assembleDebug` (يحتاج `JAVA_HOME`+`ANDROID_HOME`) | بدون `build/` و `.gradle` لتوفير المساحة |
| 4 | `SimpMusic_best/` | `~/Documents/Default Project/SimpMusic-Dev` (git 0d0ccee) | 467M | **BEST** source + ناقص desktop binary | `cd SimpMusic_best && ./gradlew :composeApp:assembleDebug` للـ APK | بدون `.git`/`build`/`.gradle`/`node_modules` |
| 5 | `ascii-0x/` | `~/Desktop/ascii-0x` (git 38abec7) | 199M | **BEST** جاهز | `cd ascii-0x && npm run dev` أو `pnpm dev` → http://localhost:5173 | `node_modules` + `dist/` موجود |
| 6 | `Freebuff_best/` | `~/Desktop/scripts` + `packages` + `~/.config/freebuff-desktop` | 9.2M | **BEST** جاهز | `Freebuff_best/scripts/THE_ULTIMATE_MASTER.sh` أو `sudo dpkg -i Freebuff_best/packages/freebuff-*.deb` | `freebuff-desktop-config/` (state.json) موجود |
| 7 | `3lmnu/` | `~/Downloads/3lmnu` (git 223fc92) | 230M | **BEST** لكن ناقص node_modules | `cd 3lmnu && bun install && bun run dev` أو `systemctl --user start 3lmni` `:3100` شغال | `.next/standalone` موجود لكن يحتاج `node_modules` |
| 8 | `upscale/` | `~/Downloads/upscale-app/server` (git 2e9df07) | 9.5M | **BEST** لكن ناقص node_modules | `cd upscale && npm install && npm run dev` أو `systemctl --user start upscale` `:3456` شغال | بدون `node_modules`، `server.old` غير منسوخ |
| 9 | `external_best/apps/` | `~/Desktop/apps` | 257M | **BEST** AppImages | `./PlayTorrio-1.4.0.AppImage` / `./Recordly-linux-x64.AppImage` | |
| 10 | `external_best/games/` | `~/Desktop/games` | 1.3M | **BEST** shortcuts | 17 `*.desktop` (Steam) | |
| 11 | `external_best/harbor-packages_best/` | `~/harbor-packages` | 808M | **BEST** debs+AppImages | `Harbor_0.9.89_amd64.deb` (133M) + `AppImage` (272M) الأفضل | `0.9.88` أيضاً موجود |
| 12 | `external_best/komi-builds_best/` | `~/komi-builds` | 111M | **BEST** APKs | `KomiPremium-1.9.2-AURORA-debug.apk` (68M) الأفضل | |
| 13 | `external_best/androidApp-universal-debug.apk` | `~/Downloads/androidApp-universal-debug.apk` | 87M | **BEST** APK | universal أفضل من المتغيرات | نسخة واحدة فقط (الباقي في old_versions) |
| 14 | `external_best/0o-latest-arm64.apk` | `~/Downloads/0o-latest-arm64.apk` | 60M | **BEST** APK | `adb install 0o-latest-arm64.apk` | |
| 15 | `old_versions/9or ascii 0x/` | `~/Desktop/9or ascii 0x` | 1.3M | **OLD** صور | صور فقط `sky.png` | مكرر |
| 16 | `old_versions/harbor_old/` | `~/Downloads/Harbor_0.9.8*.deb` | 266M | **OLD** debs | `0.9.87`+`0.9.88` | |
| 17 | `old_versions/komi_old/` | `~/komi-builds` + `~/Downloads` | 111M | **OLD** APKs | `release-unsigned` + `komi-premium-aurora.apk` | ناقص توقيع |
| 18 | `old_versions/simpmusic_old/` | `~/Downloads/androidApp*.apk` | 325M | **OLD** APKs | 4 متغيرات + `0o-latest` | المكرر |
| 19 | `Freebuff_best/freebuff-desktop-config/` | `~/.config/freebuff-desktop` | 3.9M | **BEST** config | `state.json` + `desktop-v2.db` | |
| 20 | `Freebuff_best/.freebuff` | `~/Desktop/.freebuff` | 37B | **BEST** hidden | `project-id` | |

## الخدمات الشغالة الآن (تم اختبارها 27-08 200 OK):
- `3lmni.service :3100` active (Next.js 16.3.0)
- `upscale.service :3456` active (Next.js 16.3.3)
- `lockbeast-scheduler.service` active (بعد تفعيل `auto_change true`)

## ما تم إصلاحه بذكاء:
- Harbor: commit `67b9f4a` لدمج `types.ts`+`theme.ts` + `git log` نظيف
- LockBeast: `~/.config/lockbeast/settings.json` `auto_change_enabled: true` (مع backup)
- مجلد `مشاريع op` نفسه: 5.3G، 18 مجلد/ملف رئيسي، كل `rsync -a --checksum`

## أحجام سريعة:
- `du -sh` الكلي 5.3G (بدون `~/.hermes` و `~/.local/share/opencode` حسب طلبك تطبيقات فقط)
- أكبر 3: `7meshX_best 1.5G` + `external_best 1.5G` + `Harbor_best 658M`
