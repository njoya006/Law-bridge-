#!/usr/bin/env bash
# LawBridge EC2 bootstrap — Ubuntu 22.04
set -euo pipefail

echo "==> Installing Docker..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"

echo "==> Docker installed. Log out and SSH back in, then:"
echo "    git clone https://github.com/njoya006/Law-bridge-.git"
echo "    cd lawbridge"
echo "    cp .env.production.example .env && nano .env"
echo "    docker compose up -d --build"
