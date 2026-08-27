#!/bin/bash
# Shared utilities for Freebuff scripts
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

get_monitors() {
    xrandr --query 2>/dev/null | grep " connected" | awk '{print $1}'
}

ensure_dir() { mkdir -p "$1"; }
