#!/bin/bash
# 🏆 LEGENDARY SETUP — التثبيت الشامل
set -euo pipefail
source "$(dirname "$0")/lib.sh"

CYAN='\033[0;36m'

MODE="interactive"
[ "${1:-}" = "--all" ] && MODE="full"
[ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ] && {
    echo "🏆 LEGENDARY SETUP"
    echo "  $(basename "$0")         # تفاعلي"
    echo "  $(basename "$0") --all  # كامل بدون أسئلة"
    exit 0
}

confirm() {
    [ "$MODE" = "full" ] && return 0
    echo -en "${YELLOW}تثبيت $1؟ [Y/n]: ${NC}"; read -r ans; [[ "$ans" =~ ^[Nn] ]] && return 1
}

step() { echo -e "\n${CYAN}═══ [$1] $2 ═══${NC}"; }

step 1 "تحديث النظام"
sudo apt update && sudo apt upgrade -y

step 2 "الأساسيات"
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release flatpak unzip

step 3 "Flathub"
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo 2>/dev/null || true

step 4 "Docker"
if confirm "Docker"; then
    sudo apt install -y docker.io docker-compose 2>/dev/null || warn "Docker غير متاح"
    sudo systemctl enable docker 2>/dev/null && sudo systemctl start docker 2>/dev/null || true
    sudo usermod -aG docker "$USER" 2>/dev/null || true
fi

step 5 "أدوات التيرمنال"
sudo apt install -y zsh bat eza fzf ripgrep fd-find btop zoxide neofetch 2>/dev/null || true

step 6 "Oh My Zsh"
if confirm "Oh My Zsh" && [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

step 7 "Starship + Atuin"
curl -sS https://starship.rs/install.sh | sh -s -- -y 2>/dev/null || true
curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh 2>/dev/null || true

step 8 "Lazygit"
V=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*' 2>/dev/null || echo "0.44.1")
curl -Lo /tmp/lg.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${V}_Linux_x86_64.tar.gz" 2>/dev/null || true
tar xf /tmp/lg.tar.gz -C /tmp lazygit 2>/dev/null && sudo install /tmp/lazygit -D -t /usr/local/bin/ 2>/dev/null || true

step 9 "Zsh Config"
if ! grep -q "# Freebuff" ~/.zshrc 2>/dev/null; then
    cat >> ~/.zshrc << 'EOF'

# --- Freebuff Config ---
eval "$(starship init zsh)"
eval "$(zoxide init zsh)"
alias ls='eza --icons --group-directories-first'
alias ll='eza -la --icons --group-directories-first'
alias cat='batcat'
alias grep='rg'
alias top='btop'
alias lg='lazygit'
alias update='sudo apt update && sudo apt upgrade -y'
alias ai='ollama run llama3.2:3b'
EOF
fi

step 10 "Ollama AI"
if confirm "Ollama"; then
    curl -fsSL https://ollama.com/install.sh | sh 2>/dev/null || warn "Ollama فشل"
    ollama pull llama3.2:3b 2>/dev/null || true
fi

step 11 "VSCode"
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/ms.gpg 2>/dev/null || true
sudo install -o root -g root -m 644 /tmp/ms.gpg /etc/apt/keyrings/ 2>/dev/null || true
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list 2>/dev/null || true
sudo apt update && sudo apt install -y code 2>/dev/null || true

step 12 "Flatpak Apps"
if confirm "Flatpak Apps"; then
    flatpak install -y flathub md.obsidian.Obsidian com.bitwarden.desktop com.github.KRTirtho.Spotube \
        io.freetubeapp.FreeTube com.heroicgameslauncher.hgl com.usebottles.bottles 2>/dev/null || true
fi

step 13 "APT Apps"
if confirm "APT Apps"; then
    sudo apt install -y copyq flameshot gimp krita inkscape kdenlive audacity obs-studio \
        steam lutris mangohud gamemode qbittorrent 2>/dev/null || true
fi

step 14 "Themes"
if confirm "Themes"; then
    cd /tmp
    [ ! -d "Orchis-theme" ] && git clone https://github.com/vinceliuice/Orchis-theme.git 2>/dev/null || true
    cd Orchis-theme && ./install.sh -c dark -t purple 2>/dev/null || true
fi

step 15 "Docker Services"
if confirm "Docker Services" && command -v docker &>/dev/null; then
    mkdir -p ~/jellyfin/config ~/jellyfin/cache ~/homepage/config
    sudo docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main 2>/dev/null || true
    sudo docker run -d --name jellyfin --restart unless-stopped -p 8096:8096 -v ~/jellyfin/config:/config -v ~/jellyfin/cache:/cache -v ~/Videos:/media jellyfin/jellyfin 2>/dev/null || true
    sudo docker run -d --name homepage --restart unless-stopped -p 3001:3000 -v ~/homepage/config:/app/config ghcr.io/gethomepage/homepage:latest 2>/dev/null || true
    log "Open WebUI: :3000 | Jellyfin: :8096 | Homepage: :3001"
fi

step 16 "التنظيف"
sudo apt autoremove -y 2>/dev/null; sudo apt autoclean 2>/dev/null
sudo chsh -s "$(which zsh)" "$USER" 2>/dev/null || true
rm -f /tmp/*.deb /tmp/*.tar.gz /tmp/ms.gpg 2>/dev/null || true

echo -e "\n${GREEN}🏆 تم التثبيت! أعد التشغيل: sudo reboot${NC}\n"
