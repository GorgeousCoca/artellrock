#!/usr/bin/env bash
# Первичная настройка чистого Ubuntu 22.04/24.04 под artellrock.ru.
# Запуск на сервере от root: bash deploy/bootstrap-server.sh
# Повторный запуск безопасен: секреты в .env не перезаписываются.
set -euo pipefail

SITE_DOMAIN="${SITE_DOMAIN:-artellrock.ru}"
SITE_URL="${SITE_URL:-https://${SITE_DOMAIN}}"
ACME_EMAIL="${ACME_EMAIL:-admin@${SITE_DOMAIN}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${SITE_DOMAIN}}"
REPO_URL="${REPO_URL:-https://github.com/GorgeousCoca/artellrock.git}"
REPO_BRANCH="${REPO_BRANCH:-master}"
APP_DIR="${APP_DIR:-/opt/artellrock/app}"
SECRETS_FILE="${SECRETS_FILE:-/root/artellrock-first-login.txt}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Запустите скрипт от root." >&2
  exit 1
fi

mkdir -p /var/log /opt/artellrock
exec 9>/var/lock/artellrock-bootstrap.lock
flock -n 9 || { echo "bootstrap уже выполняется." >&2; exit 1; }
exec > >(tee -a /var/log/artellrock-bootstrap.log) 2>&1
echo "=== ArtellRock bootstrap $(date -Is) ==="

export DEBIAN_FRONTEND=noninteractive

ensure_swap() {
  if swapon --show | grep -q .; then
    return 0
  fi
  local mem_kb
  mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
  if [ "$mem_kb" -ge 4000000 ]; then
    return 0
  fi
  echo "Мало памяти (${mem_kb} КБ), добавляю swap 2 ГБ для сборки Next.js."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
}

install_base() {
  apt-get update
  apt-get install -y ca-certificates curl git ufw openssl gnupg apt-transport-https fail2ban unattended-upgrades
  apt-get install -y debian-keyring debian-archive-keyring || true
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
}

install_docker() {
  if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
    return 0
  fi
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  local codename arch
  codename="$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")"
  arch="$(dpkg --print-architecture)"
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${codename}
Components: stable
Architectures: ${arch}
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
  systemctl enable --now docker
  systemctl restart docker
}

install_caddy() {
  if ! command -v caddy >/dev/null; then
    rm -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
    chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
  fi
  cat > /etc/caddy/Caddyfile <<EOF
{
	email ${ACME_EMAIL}
}

${SITE_DOMAIN} {
	encode gzip
	reverse_proxy 127.0.0.1:3000
}
EOF
  chown root:caddy /etc/caddy/Caddyfile
  chmod 640 /etc/caddy/Caddyfile
  systemctl enable caddy
  systemctl reload caddy || systemctl restart caddy
}

configure_firewall() {
  local ssh_port
  ssh_port="$(awk 'tolower($1)=="port" {print $2; exit}' /etc/ssh/sshd_config 2>/dev/null || true)"
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow OpenSSH
  if [ -n "$ssh_port" ] && [ "$ssh_port" != "22" ]; then
    ufw allow "${ssh_port}/tcp"
  fi
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
}

sync_app() {
  if [ -d "${APP_DIR}/.git" ]; then
    git -C "$APP_DIR" fetch --depth 1 origin "$REPO_BRANCH"
    git -C "$APP_DIR" reset --hard FETCH_HEAD
  else
    rm -rf "$APP_DIR"
    git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
  fi
}

ensure_env() {
  if [ -f "${APP_DIR}/.env" ]; then
    echo ".env уже есть, не трогаю."
    return 0
  fi
  local admin_password session_secret old_umask
  admin_password="$(openssl rand -hex 16)"
  session_secret="$(openssl rand -hex 32)"
  old_umask="$(umask)"
  umask 077
  cat > "${APP_DIR}/.env" <<EOF
NEXT_PUBLIC_SITE_URL=${SITE_URL}
WEB_PUBLISH=127.0.0.1:3000
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${admin_password}
ADMIN_SESSION_SECRET=${session_secret}
EOF
  chmod 600 "${APP_DIR}/.env"
  cat > "$SECRETS_FILE" <<EOF
Сайт: ${SITE_URL}
Админка: ${SITE_URL}/admin/login
Логин: ${ADMIN_EMAIL}
Пароль: ${admin_password}

SMTP в ${APP_DIR}/.env не задан: заявки сохраняются в CMS, письма не уходят.
После правки .env: systemctl restart artellrock.service
Смените пароль админки и удалите этот файл.
EOF
  chmod 600 "$SECRETS_FILE"
  umask "$old_umask"
  echo "Первый пароль админки записан в ${SECRETS_FILE}"
}

ensure_data() {
  mkdir -p "${APP_DIR}/data/uploads"
  if [ ! -f "${APP_DIR}/data/cms-store.json" ]; then
    cp "${APP_DIR}/src/content/cms-store.json" "${APP_DIR}/data/cms-store.json"
  fi
  chown -R 1001:1001 "${APP_DIR}/data"
}

write_compose_override() {
  cat > "${APP_DIR}/docker-compose.override.yml" <<'EOF'
services:
  web:
    ports: !override
      - "127.0.0.1:3000:3000"
    restart: unless-stopped
EOF
}

install_service() {
  cat > /etc/systemd/system/artellrock.service <<EOF
[Unit]
Description=ArtellRock website
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/docker compose up -d --build --remove-orphans
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable artellrock.service
  systemctl restart artellrock.service
}

wait_healthy() {
  local i
  for i in $(seq 1 60); do
    if curl -sf --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then
      echo "Сайт отвечает на http://127.0.0.1:3000/api/health"
      return 0
    fi
    sleep 5
  done
  echo "Контейнер не ответил на /api/health. Смотрите: docker compose -f ${APP_DIR}/docker-compose.yml logs" >&2
  return 1
}

ensure_swap
install_base
install_docker
configure_firewall
sync_app
ensure_env
ensure_data
write_compose_override
install_caddy
install_service
wait_healthy
echo "Готово. Публичный адрес: ${SITE_URL} (нужна A-запись домена на этот сервер)."
