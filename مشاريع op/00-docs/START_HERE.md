# START HERE - كيف تشغل كل شي فوراً

> ⚡ **تحديث 2026-09-30 (زبط كل شي)**: 3lmni وupscale صارت **حزم نظامية منصبة** (`3lmni-web 2.0.0` + `upscale-web 2.1.0` في `ديب-مشاريعي/`) — تفتح من قائمة التطبيقات مباشرة بأيقونات، خدماتها `enabled` تنطق مع الإقلاع، ومعها ميزات جديدة (لصق Ctrl+V، إلغاء معالجة الفيديو، مقارنة قبل/بعد في upscale، PWA). المعالج الآن `powersave` ذكي (كان performance على 78-96°C — الآن 58°C وهادر).

## التشغيل السريع للتطبيقين المحليين (الحزم المنصبة):
```bash
3lmni      # يفتح الاستوديو :3100 (يضمن تشغيل الخدمة أول)
upscale    # يفتح المحسّن :3456
# أو من قائمة التطبيقات: 3lmni-web / Upscale-web
# الخدمات: systemctl --user status 3lmni-web upscale-web
# ملاحظة: الوحدات اليدوية القديمة 3lmni/upscale خدمة أصبحت .bak-manual-20260930

## تشغيل سريع حسب التطبيق:

### 1. Harbor 0.9.89 (الأكمل) - Tauri
```bash
cd "/home/bsh3/Desktop/مشاريع op/Harbor_best_0.9.89"
pnpm install  # إن لم يكن node_modules موجوداً (هو موجود)
pnpm tauri dev          # تطوير
pnpm tauri build        # بناء
sudo dpkg -i "../external_best/harbor-packages_best/Harbor_0.9.89_amd64.deb"  # تثبيت BEST
harbor                  # تشغيل بعد التثبيت
```

### 2. ascii-0x (جاهز فوراً)
```bash
cd "/home/bsh3/Desktop/مشاريع op/ascii-0x"
npm run dev              # أو pnpm dev
# افتح http://localhost:5173
npm run build            # بناء dist
```

### 3. Freebuff (جاهز فوراً)
```bash
"/home/bsh3/Desktop/مشاريع op/Freebuff_best/scripts/THE_ULTIMATE_MASTER.sh"
"/home/bsh3/Desktop/مشاريع op/Freebuff_best/scripts/Color_God.sh"
sudo dpkg -i "/home/bsh3/Desktop/مشاريع op/Freebuff_best/packages/freebuff-*.deb"
freebuff                 # بعد التثبيت
```

### 4. 7meshX 3.1.0 (الأكمل 1611/1611)
```bash
cd "/home/bsh3/Desktop/مشاريع op/7meshX_best_3.1.0"
npm run dev              # Electron dev
npm test                 # 1611 اختبار
sudo dpkg -i dist/7meshX-3.1.0-amd64.deb  # منصّب حالياً
./dist/7meshX-3.1.0-x86_64.AppImage  # تشغيل AppImage
```

### 5. Komi Premium (source)
```bash
cd "/home/bsh3/Desktop/مشاريع op/Komi_best"
export JAVA_HOME="$HOME/tools/msjdk"
export ANDROID_HOME="$HOME/Android/Sdk"
./gradlew :composeApp:assembleDebug   # ينتج APK في build/
adb install ../external_best/komi-builds_best/KomiPremium-1.9.2-AURORA-debug.apk  # تثبيت BEST APK
sudo dpkg -i ~/Downloads/komi-premium_1.9.2_amd64.deb  # تثبيت deb
```

### 6. SimpMusic (موبايل جاهز، دسكتوب يحتاج بناء)
```bash
cd "/home/bsh3/Desktop/مشاريع op/SimpMusic_best"
./gradlew :composeApp:assembleDebug   # APK
adb install ../external_best/androidApp-universal-debug.apk  # BEST universal
# دسكتوب binary ناقص - يحتاج:
./gradlew :desktopApp:packageDistributionForCurrentOS  # أو bash build-desktop.sh (يحتاج Conveyor)
```

### 7. 3lmnu :3100 — (تاريخي، الحزمة المنصبة هي المستخدمة الآن)
```bash
curl http://127.0.0.1:3100/api/healthz   # فحص صحي مع الإصدار والميزات
# للتطوير (سورس بآخر الميزات):
cd "/home/bsh3/Desktop/مشاريع op/3lmnu"
bun run build && systemctl --user restart 3lmni-web  # بعد النسخ للـ standalone الموجود بالحزمة أو إعادة البناء
```

### 8. upscale :3456 — (تاريخي، الحزمة المنصبة هي المستخدمة الآن)
```bash
curl http://127.0.0.1:3456/api/healthz
# للتطوير:
cd "/home/bsh3/Desktop/مشاريع op/upscale"
bun run build   # ثم انشر standalone للحزمة
```

### 9. AppImages الخارجية
```bash
"/home/bsh3/Desktop/مشاريع op/external_best/apps/PlayTorrio-1.4.0.AppImage"
"/home/bsh3/Desktop/مشاريع op/external_best/apps/Recordly-linux-x64.AppImage"
"/home/bsh3/Desktop/مشاريع op/external_best/harbor-packages_best/Harbor_0.9.89_amd64.AppImage"
```

## ملاحظات ذكية:
- **الأفضل vs القديم**: كل `old_versions/` هو backup - لا تشغله إلا للمرجع
- **node_modules**: موجود في `ascii-0x` و `Harbor_best` و `7meshX_best` (جاهز فوراً)، ناقص في `3lmnu`/`upscale` (يحتاج `install` لأنه 800MB+)
- **LockBeast**: `auto_change` مفعّل + الخدمة `enabled` - `systemctl --user status lockbeast-scheduler`
- **اختصارات الألعاب**: كلها `trusted` الآن (بلا نافذة "السماح بالتشغيل")
- **حزم النظام المنصبة**: `dpkg -l | grep -E "3lmni-web|upscale-web|simpmusic|harbor|komi-store|7meshx"`
- **المعالج**: `powersave` ذكي + تيربو شغال، دائم عبر `/etc/tmpfiles.d/cpu-governor.conf` (نسخة احتياطية `.bak-20260930`) — كان performance على 78-96°C وأصبح 58°C
- **سكربت بناء الحزم**: `~/Desktop/scripts/build-web-debs.sh` (يعيد بناء الحزمتين بعد أي تعديل)
