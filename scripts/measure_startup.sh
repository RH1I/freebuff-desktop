#!/bin/bash
# 0_o startup-time measurement: seconds from process launch to window mapped.
BIN="/home/bsh3/Documents/Default Project/SimpMusic-Dev/desktopApp/build/compose/binaries/main/app/SimpMusic/bin/SimpMusic"
LOG=/tmp/opencode/startup_measure.log

pkill -f "SimpMusic-Dev/desktopApp" 2>/dev/null; sleep 2

START=$(date +%s.%N)
nohup "$BIN" > "$LOG" 2>&1 &

# Poll for the window every 100ms, up to 60s
for i in $(seq 1 600); do
    if wmctrl -l 2>/dev/null | grep -qiE "0_o|SimpMusic"; then
        END=$(date +%s.%N)
        echo "WINDOW VISIBLE after $(echo "$END - $START" | bc) seconds"
        break
    fi
    sleep 0.1
done

echo "--- renderer check ---"
grep -iE "fallback|SOFTWARE|OPENGL|skiko" "$LOG" | head -3 || echo "(no skiko fallback messages = OpenGL engaged cleanly)"
echo "--- exceptions in first boot ---"
grep -cE "Exception|FATAL" "$LOG"
