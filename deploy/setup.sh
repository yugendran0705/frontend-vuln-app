#!/usr/bin/env bash
# Run this ON the EC2 instance, from inside the uploaded frontend-vuln-app directory.
# Sets up Node, installs deps, registers a systemd service, and configures nginx
# as a reverse proxy on port 80 -> the app on port 4000.
set -euo pipefail

APP_DIR="$(pwd)"

echo "== Installing Node.js 20.x =="
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo "== Installing app dependencies =="
npm install --omit=dev

echo "== Installing systemd service =="
sudo cp deploy/bookshelf.service /etc/systemd/system/bookshelf.service
sudo sed -i "s#/home/ubuntu/frontend-vuln-app#${APP_DIR}#g" /etc/systemd/system/bookshelf.service
sudo systemctl daemon-reload
sudo systemctl enable bookshelf
sudo systemctl restart bookshelf

echo "== Installing nginx reverse proxy (port 80 -> 4000) =="
sudo apt-get update -y
sudo apt-get install -y nginx
sudo cp deploy/nginx-bookshelf.conf /etc/nginx/sites-available/bookshelf
sudo ln -sf /etc/nginx/sites-available/bookshelf /etc/nginx/sites-enabled/bookshelf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "== Done =="
echo "App service status:"
sudo systemctl --no-pager status bookshelf | head -10
echo
echo "Visit: http://<EC2-public-ip>/"
