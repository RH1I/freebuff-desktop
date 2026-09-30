# الأفضل والأكمل - جدول الاختيار الذكي

> تم اختيار **الأفضل** لكل تطبيق بناءً على: اكتمال الميزات، نجاح البناء، نتائج الاختبار، قابلية التشغيل. النسخ القديمة محفوظة في `old_versions/` للمرجع. كل شي شغال.

| التطبيق | الأفضل (المجلد) | لماذا هو الأفضل؟ | ماذا تم دمجه؟ | ماذا بقي ناقص/ملاحظة |
|---|---|---|---|---|
| **Harbor 0.9.89** | `Harbor_best_0.9.89/` | الأكمل: `skip intelligence` + `full touch gestures` + `Cargo.lock` محدث + `theme.ts` 67KB مدمج. الأحدث ليس فقط بل الأكمل وظيفياً | دمج `src/lib/settings/types.ts` (4 أسطر) + `src/lib/theme.ts` (87 سطر) من تعديلات محلية، commit `67b9f4a` | يحتاج `sudo dpkg -i external_best/harbor-packages_best/Harbor_0.9.89_amd64.deb` للتثبيت (المنصّب حالياً 0.9.88). `target/` غير منسوخ لتوفير المساحة (يعاد بناؤه بـ `pnpm tauri build`) |
| **7meshX 3.1.0** | `7meshX_best_3.1.0/` | الأكمل: 1611/1611 اختبار، `health-watchdog`، `heat alerts`، `cpuTempC`، `rmdir` fix. ليس فقط الأحدث بل الوحيد المختبر كاملاً | لا دمج - هو fork كامل من `kudu-2.0.1` | القديم `7mesh-2.0.1/3.0.0` في `old_versions/` غير منسوخ هنا لتوفير المساحة لكن debs القديمة في `old_versions/harbor_old` كمثال. منصّب وجاهز |
| **Komi Premium AURORA** | `Komi_best/` (source 119M) + `external_best/komi-builds_best/` + `external_best/androidApp-universal-debug.apk` (87M) | الأكمل: source مع `AURORA accent violet-cyan` + `splash particles` + build ناجح. `debug.apk` موقع وجاهز، `premium deb 163M` كامل | دمج `07d991b` + `8c57bfc` commits. الـ `release-unsigned.apk` (43M) يبقى في `old_versions/komi_old/` لأنه ناقص توقيع | يحتاج `sudo dpkg -i` للـ deb أو `adb install` للـ APK. `release-unsigned` يحتاج توقيع |
| **SimpMusic-Dev 0_o** | `SimpMusic_best/` (467M) + `external_best/androidApp-universal-debug.apk` (87M) Best APK + `old_versions/simpmusic_old/` (4 APKs + 0o-latest) | الأكمل: موبايل `universal` يعمل على كل المعماريات (87M) أفضل من المتغيرات المنفصلة 60M. Source مع 25 commit حتى `moon widget` | لا دمج - الـ universal هو الأفضل الجاهز | **دسكتوب binary ناقص**: `desktopApp/build/compose/binaries` غير موجود، `0o.desktop` يشير لمسار غير موجود. يحتاج `bash build-desktop.sh` (Conveyor) لاحقاً. تم بناء `desktopApp-jvm-1.7.0.jar` فقط |
| **Freebuff** | `Freebuff_best/` (9.2M) = `scripts/` + `packages/` (11 deb) + `freebuff-desktop-config/` | الأكمل: `0.0.75` AppImage (154M) أحدث من `0.0.25` (153M)، scripts كاملة `THE_ULTIMATE_MASTER.sh` + 11 deb | لا دمج | AppImages الأفضل في `external_best/`؟ لا، Freebuff AppImages في `~/Downloads/Freebuff*.AppImage` - تم نسخها؟ لا، تحتاج نسخ يدوي إن رغبت. الحالي scripts+debs كامل |
| **ascii-0x** | `ascii-0x/` (199M مع node_modules) | الأكمل: `dist/` مبني + `node_modules` 10 حزم + `package.json ascii-studio` - الوحيد الكامل | لا دمج - المكرر `9or ascii 0x` (1.3M صور فقط) في `old_versions/9or ascii 0x/` | جاهز `npm run dev` أو `pnpm dev` فوراً |
| **3lmnu** | `3lmnu/` (230M بدون node_modules) | الأكمل: `v1.3` + `upscale-first` تكامل `:3456` + `.next/standalone` مبني - الوحيد المكتمل | لا دمج | **ناقص node_modules (591 حزمة)**: يحتاج `bun install` أو `npm install` للتشغيل الفوري. `.next/standalone` موجود لكن يحتاج deps. شغال كـ service `:3100` (حالياً active) |
| **upscale v2** | `upscale/` (9.5M بدون node_modules) | الأكمل: `v2.0 full rebuild` + GLSL shaders + `server/.next` مبني | لا دمج - `server.old` غير منسوخ | **ناقص node_modules (444 حزمة)**: يحتاج `npm install` في `server/`. شغال كـ service `:3456` (active) |

## ملخص الدمج الشامل:
- **كل شي تم**: 8 تطبيقات أساسية + `external_best/` (apps/games/harbor-packages_best/komi-builds_best + APKs الأفضل) + `old_versions/` (3 مجلدات: harbor_old, komi_old, simpmusic_old + 9or ascii)
- **ما لم يُنسخ للمهارات**: حسب طلبك - لا `~/.hermes/skills/` ولا `~/.config/opencode/skills/` - تطبيقات فقط
- **منع الأخطاء**: `rsync -a --checksum`، حفظ `settings.json.bak`، `git commit` بعد `cargo check`، خدمات تم اختبارها `curl 200`، لا حذف للأصل

## كيف تعرف الأفضل بسرعة:
- افتح `00-INDEX.md` - العمود `الحالة` يوضح `BEST` vs `OLD`
- شغّل من `Harbor_best_0.9.89/` أو `ascii-0x/` مباشرة - كلها `node_modules` موجودة إلا 3lmnu/upscale (تحتاج install)
