#!/bin/bash
# build-web-debs.sh — يبني حزمتي 3lmni-web_2.0.0 و upscale-web_2.1.0 (amd64)
# البنية: /opt/<app> + مشغّل /usr/bin + خدمة systemd user + .desktop + أيقونة hicolor
# يعتمد فقط على nodejs النظام (v18 مختبرة). بناء 2026-09-30 — Buffy/Freebuff
set -euo pipefail
BASE="/home/bsh3/Desktop/مشاريع op"
OUT="$BASE/ديب-مشاريعي"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$OUT"

# ---------- أيقونات SVG ----------
cat > /tmp/icon-3lmni.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#2A211B"/>
<circle cx="256" cy="256" r="150" fill="none" stroke="#B8431F" stroke-width="30"/>
<circle cx="256" cy="256" r="66" fill="#B8431F"/>
</svg>
EOF
cat > /tmp/icon-upscale.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#0b0f0e"/>
<path d="M96 352 L224 224 L288 288 L416 160" stroke="#10b981" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M320 160 h96 v96" stroke="#10b981" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="96" cy="352" r="24" fill="#10b981"/><circle cx="224" cy="224" r="24" fill="#10b981"/>
</svg>
EOF

build_pkg() { # $1=pkg $2=ver $3=srcdir $4=appname $5=port $6=iconsvg $7=display $8=desc
  local pkg="$1" ver="$2" src="$3" app="$4" port="$5" icon="$6" disp="$7" desc="$8"
  local S="$STAGE/$pkg"
  echo "=== بناء $pkg $ver ==="
  rm -rf "$S"; mkdir -p "$S/DEBIAN" "$S/opt/$app" "$S/usr/bin" \
    "$S/lib/systemd/user" "$S/usr/share/applications" \
    "$S/usr/share/icons/hicolor/256x256/apps" "$S/usr/share/doc/$pkg"

  # محتوى التطبيق: standalone مكتفية ذاتياً + static + public
  cp -r "$src/.next/standalone/." "$S/opt/$app/"
  cp -r "$src/.next/static"        "$S/opt/$app/.next/static"
  cp -r "$src/public"              "$S/opt/$app/public"
  echo "$ver  built $(date +%F)" > "$S/opt/$app/VERSION"

  # المشغّل
  cat > "$S/usr/bin/$app" <<EOF
#!/bin/bash
# $app launcher — يضمن تشغيل الخدمة المحلية ثم يفتح التطبيق
PORT=$port
SERVICE=$pkg.service
URL="http://127.0.0.1:\$PORT"
if ! curl -s -o /dev/null --max-time 2 "\$URL"; then
  systemctl --user start "\$SERVICE" 2>/dev/null || true
  for _ in \$(seq 1 20); do
    curl -s -o /dev/null --max-time 2 "\$URL" && break
    sleep 0.5
  done
fi
exec xdg-open "\$URL"
EOF
  chmod 755 "$S/usr/bin/$app"

  # الخدمة
  cat > "$S/lib/systemd/user/$pkg.service" <<EOF
[Unit]
Description=$disp — local web app (packaged)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/$app
ExecStart=/usr/bin/node /opt/$app/server.js
Environment=NODE_ENV=production
Environment=HOSTNAME=127.0.0.1
Environment=PORT=$port
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

  # اختصار القائمة
  cat > "$S/usr/share/applications/$pkg.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$disp
Name[ar]=$disp
GenericName=$disp
Comment=$desc
Exec=/usr/bin/$app
Icon=$pkg
Terminal=false
Categories=Graphics;Utility;
StartupWMClass=$pkg
EOF

  # الأيقونة + الوثائق
  convert -background none "$icon" -resize 256x256 "$S/usr/share/icons/hicolor/256x256/apps/$pkg.png"
  cat > "$S/usr/share/doc/$pkg/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: $pkg
Source: local build ($src)

Files: *
Copyright: 2026 bsh3
License: MIT
 Private local application build.
EOF
  cat > "$S/usr/share/doc/$pkg/changelog" <<EOF
$pkg ($ver) stable; urgency=medium

  * حزمة نظامية كاملة: تطبيق ويب محلي + خدمة systemd user + اختصار قائمة
  * آخر الميزات والإصلاحات من بناء $(date +%F)

 -- Buffy (Freebuff) <local@localhost>  $(date -R)
EOF
  gzip -9n "$S/usr/share/doc/$pkg/changelog"

  # control + سكربتات ما بعد التثبيت/الإزالة
  cat > "$S/DEBIAN/control" <<EOF
Package: $pkg
Version: $ver
Architecture: amd64
Maintainer: bsh3 <local@localhost>
Depends: nodejs, curl, xdg-utils, imagemagick
Section: graphics
Priority: optional
Homepage: http://127.0.0.1:$port
Description: $desc
 $disp — تطبيق ويب محلي معزول (Next.js standalone) على المنفذ $port.
 يشتغل كخدمة systemd للمستخدم، يظهر بقائمة التطبيقات، بدون رفع أي بيانات.
EOF
  cat > "$S/DEBIAN/postinst" <<EOF
#!/bin/sh
# تفعيل الخدمة لكل مستخدم مسجّل دخول (best-effort)
if [ "\$1" = configure ]; then
  if [ -x /usr/bin/loginctl ]; then
    for u in \$(loginctl list-users --no-legend 2>/dev/null | awk '{print \$1}'); do
      un=\$(id -nu "\$u" 2>/dev/null) || continue
      [ "\$un" = root ] && continue
      runuser -u "\$un" -- env XDG_RUNTIME_DIR=/run/user/\$u systemctl --user daemon-reload 2>/dev/null || true
      # restart if already active so the service serves the newly unpacked build
      runuser -u "\$un" -- env XDG_RUNTIME_DIR=/run/user/\$u sh -c 'systemctl --user is-active --quiet $pkg.service && systemctl --user restart $pkg.service' 2>/dev/null || true
      runuser -u "\$un" -- env XDG_RUNTIME_DIR=/run/user/\$u systemctl --user enable --now $pkg.service 2>/dev/null || true
    done
  fi
  echo "$pkg: للتشغيل اليدوي إن لزم: systemctl --user enable --now $pkg.service"
  echo "$disp: http://127.0.0.1:$port"
fi
exit 0
EOF
  cat > "$S/DEBIAN/postrm" <<EOF
#!/bin/sh
if [ "\$1" = remove ] || [ "\$1" = purge ]; then
  if [ -x /usr/bin/loginctl ]; then
    for u in \$(loginctl list-users --no-legend 2>/dev/null | awk '{print \$1}'); do
      un=\$(id -nu "\$u" 2>/dev/null) || continue
      [ "\$un" = root ] && continue
      runuser -u "\$un" -- env XDG_RUNTIME_DIR=/run/user/\$u systemctl --user stop $pkg.service 2>/dev/null || true
      runuser -u "\$un" -- env XDG_RUNTIME_DIR=/run/user/\$u systemctl --user disable $pkg.service 2>/dev/null || true
    done
  fi
fi
exit 0
EOF
  chmod 755 "$S/DEBIAN/postinst" "$S/DEBIAN/postrm"

  dpkg-deb --build --root-owner-group "$S" "$OUT/${pkg}_${ver}_amd64.deb"
  echo "=> $OUT/${pkg}_${ver}_amd64.deb"
}

build_pkg 3lmni-web   2.0.0 "$BASE/3lmnu"   3lmni   3100 /tmp/icon-3lmni.svg  "3lmni — Watermark Studio"  "علّم صورك وفيديوهاتك بالعلامة المائية — محلي بالكامل"
build_pkg upscale-web 2.1.0 "$BASE/upscale" upscale 3456 /tmp/icon-upscale.svg "Upscale — Image & Video Enhancer" "حسّن دقة الصور والفيديو محلياً بـ WebGL2"
echo "=== تم البناء ==="
ls -lh "$OUT"/3lmni-web_*.deb "$OUT"/upscale-web_*.deb
