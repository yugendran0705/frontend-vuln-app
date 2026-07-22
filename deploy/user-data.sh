#!/bin/bash
# EC2 "User data" bootstrap script (Ubuntu 22.04 AMI).
# Paste this whole file into the "User data" box when launching the instance.
# It runs once, as root, on first boot: installs Node + nginx, clones this
# repo, and starts the app as a systemd service behind nginx on port 80.

# ---- EDIT THESE before launching ----
GIT_REPO_URL="https://github.com/<your-username>/<your-repo>.git"
GIT_BRANCH="main"
# --------------------------------------

APP_DIR="/home/ubuntu/frontend-vuln-app"

exec > >(tee /var/log/user-data.log) 2>&1
echo "== Bookshelf user-data setup starting =="

apt-get update -y
apt-get install -y git nginx

echo "== Installing Node.js 20.x =="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "== Cloning $GIT_REPO_URL ($GIT_BRANCH) =="
rm -rf "$APP_DIR"
git clone --branch "$GIT_BRANCH" --depth 1 "$GIT_REPO_URL" "$APP_DIR"
chown -R ubuntu:ubuntu "$APP_DIR"

cd "$APP_DIR"
sudo -u ubuntu npm install --omit=dev

echo "== Installing systemd service =="
cp deploy/bookshelf.service /etc/systemd/system/bookshelf.service
sed -i "s#/home/ubuntu/frontend-vuln-app#${APP_DIR}#g" /etc/systemd/system/bookshelf.service
systemctl daemon-reload
systemctl enable bookshelf
systemctl restart bookshelf

echo "== Configuring nginx reverse proxy (80 -> 4000) =="
cp deploy/nginx-bookshelf.conf /etc/nginx/sites-available/bookshelf
ln -sf /etc/nginx/sites-available/bookshelf /etc/nginx/sites-enabled/bookshelf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "== Done. Visit http://<instance-public-ip>/ =="
