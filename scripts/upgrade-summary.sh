#!/bin/bash
# 📊 FREEBUFF STATUS — تقرير حالة النظام
set -euo pipefail
source "$(dirname "$0")/lib.sh"

CYAN='\033[0;36m'; BOLD='\033[1m'
header() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
fail()   { echo -e "  ${RED}✗${NC} $1"; }

check_service() {
    local name="$1" service="${2:-$1}"
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        ok "$name: يعمل"
    elif systemctl is-enabled --quiet "$service" 2>/dev/null; then
        warn "$name: متوقف"
    else
        fail "$name: غير مثبت"
    fi
}

check_command() {
    local name="$1" cmd="${2:-$1}"
    command -v "$cmd" &>/dev/null && ok "$name: $($cmd --version 2>/dev/null | head -1 || echo 'مثبت')" || fail "$name: غير مثبت"
}

check_docker() {
    local name="$1" container="$2"
    docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$" && ok "$name: يعمل" || \
    docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$" && warn "$name: متوقف" || \
    fail "$name: غير موجود"
}

header "🖥️ النظام"
[ -f /etc/os-release ] && { source /etc/os-release; ok "OS: $PRETTY_NAME"; }
ok "Kernel: $(uname -r)"
cpu=$(grep -m1 "model name" /proc/cpuinfo 2>/dev/null | cut -d: -f2 | xargs || echo "?")
ok "CPU: $cpu ($(nproc) cores)"
ram_t=$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}'); ram_u=$(free -h 2>/dev/null | awk '/^Mem:/ {print $3}')
ram_pct=$(free 2>/dev/null | awk '/^Mem:/ {printf "%.0f", $3/$2*100}')
[ "${ram_pct:-0}" -gt 80 ] && warn "RAM: $ram_u / $ram_t (${ram_pct}%)" || ok "RAM: $ram_u / $ram_t (${ram_pct}%)"
command -v nvidia-smi &>/dev/null && ok "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null) ($(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader 2>/dev/null)°C)" || fail "GPU: NVIDIA غير مكتشف"

header "💾 القرص"
df -h / /home 2>/dev/null | tail -n +2 | sort -u | while read -r line; do
    m=$(echo "$line" | awk '{print $6}'); u=$(echo "$line" | awk '{print $3}'); s=$(echo "$line" | awk '{print $2}'); p=$(echo "$line" | awk '{print $5}' | tr -d '%')
    [ "${p:-0}" -gt 90 ] && warn "$m: $u / $s ($p%)" || ok "$m: $u / $s ($p%)"
done

header "⚙️ الخدمات"
check_docker "Open WebUI" "open-webui"; check_docker "Jellyfin" "jellyfin"; check_docker "Homepage" "homepage"
check_service "Ollama"; check_service "Docker"; check_service "Zram" "zramswap"; check_service "OOM" "systemd-oomd"

header "🛠️ الأدوات"
for cmd in node npm python3 git docker zsh starship eza batcat fzf btop zoxide lazygit; do
    check_command "$cmd"
done

header "⚡ أوامر سريعة"
echo "  bash Color_God.sh --preset cinema    → ألوان"
echo "  bash Brightness.sh --set 80          → سطوع"
echo "  bash BREAK_LIMITS.sh --revert        → إرجاع"
echo "  bash THE_ULTIMATE_MASTER.sh --help   → المساعدة"
echo ""
echo -e "${CYAN}أعد التشغيل بعد أي تغيير: sudo reboot${NC}"
