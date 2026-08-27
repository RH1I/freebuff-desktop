#!/bin/bash
# 🚀 THE ULTIMATE MASTER — المركبة الفضائية
# جهاز: MSI GF63 | 8GB RAM | GTX 1650 | Linux Mint 22
set -euo pipefail
source "$(dirname "$0")/lib.sh"

LOG_FILE="/tmp/freebuff-master-$(date +%Y%m%d-%H%M%S).log"
CYAN='\033[0;36m'

log()  { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
err()  { echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"; }
step() { echo -e "\n${CYAN}═══ [$1] $2 ═══${NC}" | tee -a "$LOG_FILE"; }

MODE="full"
case "${1:-}" in
    --help|-h)
        echo "🚀 THE ULTIMATE MASTER"
        echo "  bash $(basename "$0")"; exit 0 ;;
    *) ;;
esac

[ "$(id -u)" -eq 0 ] && { err "لا تشغل كـ root!"; exit 1; }

echo -e "${CYAN}📋 السجل: ${LOG_FILE}${NC}\n"

# ============================================================
# [1/12] ضبط الذاكرة (RAM) و OOM Killer
# ============================================================
step 1 "ضبط الذاكرة (RAM + zram + OOM Killer)"

if [ "$MODE" = "full" ]; then
    log "تعطيل swap القديم..."
    sudo swapoff -a
    sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab 2>/dev/null || true

    log "تثبيت zram-tools و systemd-oomd..."
    sudo apt update && sudo apt install -y zram-tools systemd-oomd

    sudo bash -c 'cat > /etc/default/zramswap <<EOF
ALGO=zstd
PERCENT=50
PRIORITY=100
EOF'

    sudo systemctl enable --now systemd-oomd

    sudo bash -c 'cat > /etc/sysctl.d/99-memory-optimize.conf <<EOF
vm.swappiness=100
vm.watermark_boost_factor=0
vm.watermark_scale_factor=125
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=1
vm.dirty_ratio=10
EOF'
    sudo sysctl -p /etc/sysctl.d/99-memory-optimize.conf 2>/dev/null || true
    sudo systemctl restart zramswap systemd-oomd

    sudo sed -i 's/defaults/noatime,defaults/g' /etc/fstab 2>/dev/null || true
    sudo mount -o remount / 2>/dev/null || true

    # تقليل حجم Journal
    sudo mkdir -p /etc/systemd/journald.conf.d
    sudo bash -c 'cat > /etc/systemd/journald.conf.d/size.conf <<EOF
[Journal]
SystemMaxUse=100M
RuntimeMaxUse=50M
EOF'
    sudo systemctl restart systemd-journald
    log "تم ضبط الذاكرة بنجاح!"
else
    warn "تخطي ضبط الذاكرة في الوضع السريع"
fi

# ============================================================
# [2/12] ضبط الذكاء الاصطناعي (Ollama & Aider)
# ============================================================
step 2 "ضبط الذكاء الاصطناعي (Ollama & Aider)"

if [ "$MODE" = "full" ]; then
    log "تحسين إعدادات Ollama..."
    sudo mkdir -p /etc/systemd/system/ollama.service.d
    sudo bash -c 'cat > /etc/systemd/system/ollama.service.d/override.conf <<EOF
[Service]
Environment="OLLAMA_KEEP_ALIVE=2m"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_FLASH_ATTENTION=1"
EOF'
    sudo systemctl daemon-reload 2>/dev/null || true
    sudo systemctl restart ollama 2>/dev/null || warn "Ollama غير مثبت، تخطي"

    log "تثبيت Aider..."
    python3 -m venv ~/.agent-env 2>/dev/null || true
    source ~/.agent-env/bin/activate
    pip install aider-chat
    deactivate

    echo -e "model: ollama/qwen2.5-coder:3b\nauto-commits: false\ndark-mode: true\ncheck-update: false" > ~/.aider.conf.yml
    log "تم ضبط AI بنجاح!"
else
    warn "_tEkh_Ti ضبط AI في الوضع السريع"
fi

# ============================================================
# [3/12] ضبط VSCodium لتوفير الرام
# ============================================================
step 3 "ضبط VSCodium لتوفير الرام"

mkdir -p ~/.config/VSCodium/User
cat > ~/.config/VSCodium/User/settings.json << 'EOF'
{
  "files.watcherExclude": {
    "**/.git/objects/**": true, "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true, "**/__pycache__/**": true, "**/.venv/**": true
  },
  "search.exclude": { "**/__pycache__": true, "**/.venv": true },
  "editor.largeFileOptimizations": true,
  "extensions.autoUpdate": false,
  "telemetry.telemetryLevel": "off"
}
EOF
echo '{"disable-hardware-acceleration": true}' > ~/.config/VSCodium/argv.json
log "تم ضبط VSCodium بنجاح!"

# ============================================================
# [4/12] تسليح النظام بكل لغات البرمجة
# ============================================================
step 4 "تسليح النظام بكل لغات البرمجة والأدوات"

sudo dpkg --add-architecture i386 2>/dev/null || true
sudo apt install -y \
    build-essential gcc g++ make cmake git curl wget unzip jq ffmpeg \
    python3 python3-pip python3-venv golang rustc cargo openjdk-21-jdk \
    libgl1-mesa-dri:i386 mesa-vulkan-drivers mesa-vulkan-drivers:i386 \
    wine winetricks steam lutris retroarch mangohud gamemode \
    btop cava flameshot rofi mpv batcat tmux neovim \
    kvantum-qt5 qt5ct qt6ct materia-gtk-theme papirus-icon-theme variety \
    kdeconnect stacer 2>/dev/null || warn "بعض الحزم قد لا تكون متاحة"
log "تم تثبيت أدوات البرمجة!"

# ============================================================
# [5/12] تثبيت Node.js عبر NVM
# ============================================================
step 5 "تثبيت Node.js عبر NVM"

if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
npm install -g pnpm yarn
log "تم تثبيت Node.js $(node -v) بنجاح!"

# ============================================================
# [6/12] الخطوط وثيم Catppuccin
# ============================================================
step 6 "الخطوط وثيم Catppuccin"

mkdir -p ~/.local/share/fonts
wget -qO /tmp/nerd-font.zip "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip"
unzip -o /tmp/nerd-font.zip -d ~/.local/share/fonts 2>/dev/null
fc-cache -fv

gsettings set org.cinnamon.desktop.interface gtk-theme "Materia-dark" 2>/dev/null || true
gsettings set org.cinnamon.desktop.interface icon-theme "Papirus-Dark" 2>/dev/null || true
gsettings set org.cinnamon.desktop.wm.preferences theme "Materia-dark" 2>/dev/null || true

mkdir -p ~/.config/Kvantum
git clone --depth 1 https://github.com/catppuccin/kvantum.git /tmp/catppuccin-kvantum 2>/dev/null || true
cp -r /tmp/catppuccin-kvantum/themes/* ~/.config/Kvantum/ 2>/dev/null || true
kvantummanager --set Catppuccin-Mocha-Blue 2>/dev/null || true
log "تم تثبيت الخطوط والثيم بنجاح!"

# ============================================================
# [7/12] أدوات التيرمنال الخارقة من GitHub
# ============================================================
step 7 "أدوات التيرمنال الخارقة"

log "تثبيت zoxide..."
curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash

log "تثبيت eza و fastfetch..."
sudo mkdir -p /etc/apt/keyrings
wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg 2>/dev/null || true
echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list 2>/dev/null || true
sudo apt update && sudo apt install -y eza fastfetch 2>/dev/null || true

log "تثبيت lazygit..."
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*' 2>/dev/null || echo "0.44.1")
curl -Lo /tmp/lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz" 2>/dev/null
tar -xzf /tmp/lazygit.tar.gz -C /tmp lazygit 2>/dev/null && sudo mv /tmp/lazygit /usr/local/bin/

log "تثبيت delta..."
wget -q "$(curl -s https://api.github.com/repos/dandavison/delta/releases/latest | grep -o 'https://.*x86_64-unknown-linux-musl.tar.gz' | head -1)" -O /tmp/delta.tar.gz 2>/dev/null || true
mkdir -p /tmp/delta_extract && tar -xzf /tmp/delta.tar.gz -C /tmp/delta_extract 2>/dev/null || true
sudo mv /tmp/delta_extract/delta /usr/local/bin/ 2>/dev/null || true
git config --global core.pager "delta"
git config --global interactive.diffFilter "delta --color-only"
git config --global delta.navigate true

log "تثبيت glow..."
wget -q "$(curl -s https://api.github.com/repos/charmbracelet/glow/releases/latest | grep -o 'https://.*linux-x86_64.tar.gz' | head -1)" -O /tmp/glow.tar.gz 2>/dev/null || true
tar -xzf /tmp/glow.tar.gz -C /tmp 2>/dev/null && sudo mv /tmp/glow /usr/local/bin/ 2>/dev/null || true

log "تثبيت zellij..."
wget -q "$(curl -s https://api.github.com/repos/zellij-org/zellij/releases/latest | grep -o 'https://.*x86_64-unknown-linux-musl.tar.gz' | head -1)" -O /tmp/zellij.tar.gz 2>/dev/null || true
tar -xzf /tmp/zellij.tar.gz -C /tmp 2>/dev/null && sudo mv /tmp/zellij /usr/local/bin/ 2>/dev/null || true

log "تثبيت dust..."
wget -q "$(curl -s https://api.github.com/repos/bootandy/dust/releases/latest | grep -o 'https://.*x86_64-unknown-linux-musl.tar.gz' | head -1)" -O /tmp/dust.tar.gz 2>/dev/null || true
mkdir -p /tmp/dust_extract && tar -xzf /tmp/dust.tar.gz -C /tmp/dust_extract 2>/dev/null && sudo mv /tmp/dust_extract/dust /usr/local/bin/ 2>/dev/null || true

log "تثبيت procs..."
wget -q "$(curl -s https://api.github.com/repos/dalance/procs/releases/latest | grep -o 'https://.*x86_64-linux.zip' | head -1)" -O /tmp/procs.zip 2>/dev/null || true
mkdir -p /tmp/procs_extract && unzip -o /tmp/procs.zip -d /tmp/procs_extract 2>/dev/null && sudo mv /tmp/procs_extract/procs /usr/local/bin/ 2>/dev/null || true

log "تم تثبيت أدوات التيرمنال بنجاح!"

# ============================================================
# [8/12] تطبيقات سطح المكتب والألعاب
# ============================================================
step 8 "تطبيقات سطح المكتب والألعاب"

log "تثبيت Heroic Games Launcher..."
wget -q "$(curl -s https://api.github.com/repos/Heroic-Games-Launcher/HeroicGamesLauncher/releases/latest | grep -o 'https://.*amd64.deb' | head -1)" -O /tmp/heroic.deb 2>/dev/null || true

log "تثبيت Spotube..."
wget -q "$(curl -s https://api.github.com/repos/KRTirtho/spotube/releases/latest | grep -o 'https://.*spotube-linux-x86_64.deb' | head -1)" -O /tmp/spotube.deb 2>/dev/null || true

log "تثبيت Feishin..."
wget -q "$(curl -s https://api.github.com/repos/feishin-app/feishin/releases/latest | grep -o 'https://.*linux-x86_64.deb' | head -1)" -O /tmp/feishin.deb 2>/dev/null || true

log "تثبيت Bottles..."
wget -q "$(curl -s https://api.github.com/repos/bottlesdevs/Bottles/releases/latest | grep -o 'https://.*bottles.*amd64.deb' | head -1)" -O /tmp/bottles.deb 2>/dev/null || true

log "تثبيت Mission Center..."
wget -q "$(curl -s https://api.github.com/repos/mission-center-devs/mission-center/releases/latest | grep -o 'https://.*x86_64.deb' | head -1)" -O /tmp/mission.deb 2>/dev/null || true

log "تثبيت OpenSnitch..."
wget -q "$(curl -s https://api.github.com/repos/evilsocket/opensnitch/releases/latest | grep -o 'https://.*python3-opensnitch.*amd64.deb' | head -1)" -O /tmp/opensnitch.deb 2>/dev/null || true
wget -q "$(curl -s https://api.github.com/repos/evilsocket/opensnitch/releases/latest | grep -o 'https://.*opensnitch-ui.*amd64.deb' | head -1)" -O /tmp/opensnitch-ui.deb 2>/dev/null || true

log "تثبيت Tabby..."
wget -q "$(curl -s https://api.github.com/repos/Eugeny/tabby/releases/latest | grep -o 'https://.*tabby.*linux-x64.deb' | head -1)" -O /tmp/tabby.deb 2>/dev/null || true

log "تثبيت WebCord..."
wget -q "$(curl -s https://api.github.com/repos/SpacingBat3/WebCord/releases/latest | grep -o 'https://.*linux-amd64.deb' | head -1)" -O /tmp/webcord.deb 2>/dev/null || true

sudo apt install -y /tmp/*.deb 2>/dev/null || warn "بعض الحزم قد تفشل"
log "تم تثبيت تطبيقات سطح المكتب!"

# ============================================================
# [9/12] أدوات التخصيص (Vencord & Spicetify)
# ============================================================
step 9 "أدوات التخصيص (Vencord & Spicetify)"

if [ "$MODE" = "full" ]; then
    log "تثبيت Vencord..."
    if [ ! -d ~/Vencord ]; then
        git clone https://github.com/Vendicated/Vencord.git ~/Vencord 2>/dev/null || true
    fi
    cd ~/Vencord && pnpm install && pnpm build && cd ~

    log "تثبيت Spicetify..."
    curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh 2>/dev/null || true
    curl -fsSL https://raw.githubusercontent.com/Comfy-Themes/Spicetify/master/install/install.sh | sh -s -- --theme Comfy 2>/dev/null || true
    log "تم تثبيت Vencord و Spicetify!"
else
    warn "تخطي أدوات التخصيص في الوضع السريع"
fi

# ============================================================
# [10/12] مشاريع جاهزة للتجربة
# ============================================================
step 10 "مشاريع جاهزة للتجربة"

mkdir -p ~/Spaceship_Projects
if [ ! -d ~/Spaceship_Projects/amethyst_engine ]; then
    git clone https://github.com/amethyst/Amethyst.git ~/Spaceship_Projects/amethyst_engine 2>/dev/null || true
fi
if [ ! -d ~/Spaceship_Projects/pygame ]; then
    git clone https://github.com/pygame/pygame.git ~/Spaceship_Projects/pygame 2>/dev/null || true
fi
log "تم تجهيز المشاريع!"

# ============================================================
# [11/12] ضبط شكل التيرمنال (Spaceship Prompt & Zsh)
# ============================================================
step 11 "ضبط شكل التيرمنال (Zsh + Spaceship)"

# تثبيت Zsh إذا لم يكن مثبتاً
if ! command -v zsh &>/dev/null; then
    sudo apt install -y zsh
fi

# تثبيت Oh My Zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# تثبيت Spaceship Prompt
if [ ! -d "$HOME/.zsh/spaceship-prompt" ]; then
    git clone https://github.com/spaceship-prompt/spaceship-prompt.git "$HOME/.zsh/spaceship-prompt" --depth=1
fi
ln -sf "$HOME/.zsh/spaceship-prompt/spaceship.zsh-theme" "$HOME/.oh-my-zsh/custom/themes/spaceship.zsh-theme"

# ضبط الثيم
sed -i 's/ZSH_THEME="starship"/ZSH_THEME="spaceship"/g' ~/.zshrc 2>/dev/null || \
sed -i 's/ZSH_THEME="robbyrussell"/ZSH_THEME="spaceship"/g' ~/.zshrc 2>/dev/null || true

# تنظيف الإعدادات القديمة
sed -i '/alias ls=/d; /alias ll=/d; /alias bat=/d; /alias cat=/d; /alias top=/d; /alias lg=/d; /alias yt=/d; /alias y=/d; /alias du=/d; /alias ps=/d; /alias z=/d; /alias game=/d; /fastfetch/d; /zoxide init/d' ~/.zshrc 2>/dev/null || true

# إضافة الإعدادات الجديدة
cat >> ~/.zshrc << 'ZSH'

# --- Freebuff Custom Config ---

# تحويلات سريعة
alias ls='eza --icons --group-directories-first'
alias ll='eza -la --icons --group-directories-first'
alias tree='eza --tree --icons'
alias cat='batcat'
alias find='fdfind'
alias grep='rg'
alias top='btop'
alias lg='lazygit'
alias du='dust'
alias ps='procs'
alias z='z'
alias game='mangohud'
alias ai='ollama run llama3.2:3b'
alias ai-ar='ollama run qwen2.5:3b'

# أوامر Freebuff
alias freebuff-color='bash ~/.config/colorgod/Color_God.sh'
alias freebuff-brightness='bash ~/.config/brightness/Brightness.sh'
alias freebuff-status='bash ~/upgrade-summary.sh'

# Zoxide init
eval "$(zoxide init zsh)"

# Fastfetch عند فتح التيرمنال
fastfetch 2>/dev/null || neofetch 2>/dev/null || true

ZSH

log "تم ضبط التيرمنال بنجاح!"

# ============================================================
# [12/12] التنظيف النهائي
# ============================================================
step 12 "التنظيف النهائي"

log "تنظيف الملفات المؤقتة..."
rm -f /tmp/*.deb /tmp/*.tar.gz /tmp/*.zip 2>/dev/null || true
rm -rf /tmp/delta_extract /tmp/dust_extract /tmp/procs_extract 2>/dev/null || true

log "إصلاح الحزم المكسورة..."
sudo apt --fix-broken install -y 2>/dev/null || true
sudo apt autoremove -y 2>/dev/null || true

log "تفعيلخدمات النظام..."
sudo systemctl daemon-reload 2>/dev/null || true

# ============================================================
# ✅ الانتهاء
# ============================================================
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║     🚀 تم إعداد المركبة الفضائية بنجاح! 🚀            ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📋 السجل: ${CYAN}${LOG_FILE}${NC}"
echo -e "🔄 أعد تشغيل الجهاز: ${YELLOW}sudo reboot${NC}"
echo ""
echo -e "${BOLD}أوامر سريعة:${NC}"
echo "  ls          → eza (قائمة جميلة)"
echo "  cat         → batcat (عرض ملفات)"
echo "  top         → btop (مراقبة النظام)"
echo "  lg          → lazygit (واجهة git)"
echo "  z <folder>  → zoxide ( التنقل)"
echo "  ai          → Ollama (ذكاء اصطناعي)"
echo ""
