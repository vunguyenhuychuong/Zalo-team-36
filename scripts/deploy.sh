#!/usr/bin/env bash
#
# Deploy Zalo Business Copilot len VPS BTC cap cho team36.
#
#   bash scripts/deploy.sh
#
# Lan dau phai cai SSH key truoc (chi lam mot lan, tu nhap password BTC):
#   ssh-copy-id -i ~/.ssh/zalo-hackathon.pub -p 2222 zah19-team36@118.102.2.136
#
# Ghi chu ha tang (do bang cach thu that, khong phai theo doc BTC):
#   - SSH o port 2222, KHONG phai 22
#   - nginx 1.20.1 da co san, HTTPS da chay voi cert hop le cho zah-36.123c.vn
#   - Nen app Node chay o cong noi bo 4000, nginx reverse proxy vao

set -euo pipefail

HOST="118.102.2.136"
PORT="2222"
USER="zah19-team36"
DOMAIN="zah-36.123c.vn"
KEY="$HOME/.ssh/zalo-hackathon"
APP_DIR="/home/$USER/zalo-copilot"
APP_PORT="4000"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH="ssh -i $KEY -p $PORT -o StrictHostKeyChecking=accept-new $USER@$HOST"

# Mat khau khu vuc noi bo doc tu .env o may local roi truyen sang pm2.
# KHONG gui file .env len VPS (trong do con co API key FPT).
if [ -f "$ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$ROOT/.env"; set +a
fi
INTERNAL_PASSWORD="${INTERNAL_PASSWORD:-}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

# --- 0. Kiem key da cai chua ---------------------------------------------------
say "Kiem ket noi SSH bang key"
if ! $SSH -o BatchMode=yes -o ConnectTimeout=12 'echo ok' >/dev/null 2>&1; then
  echo "Chua vao duoc bang key. Chay lenh nay truoc (tu nhap password BTC):"
  echo "  ssh-copy-id -i $KEY.pub -p $PORT $USER@$HOST"
  exit 1
fi
echo "SSH bang key: OK"

# --- 1. Thong tin may ----------------------------------------------------------
say "Thong tin VPS"
$SSH 'echo "OS      : $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"
      echo "Kernel  : $(uname -r)"
      echo "CPU/RAM : $(nproc) core / $(free -m 2>/dev/null | awk "/Mem:/{print \$2\"MB\"}")"
      echo "Disk    : $(df -h / | awk "NR==2{print \$4\" trong\"}")"
      echo "Node    : $(command -v node >/dev/null && node -v || echo "CHUA CO")"
      echo "npm     : $(command -v npm  >/dev/null && npm -v  || echo "CHUA CO")"
      echo "pm2     : $(command -v pm2  >/dev/null && pm2 -v  || echo "CHUA CO")"
      echo "sudo    : $(sudo -n true 2>/dev/null && echo "co, khong can password" || echo "khong co hoac can password")"'

# --- 2. Build o may local ------------------------------------------------------
say "Build client o may local"
( cd "$ROOT" && npm run build )

# --- 3. Dong goi ---------------------------------------------------------------
# Chi gui thu can chay: server, dist, package.json. Khong gui node_modules
# (cai lai tren VPS de dung binary dung kien truc) va khong gui .env (co key).
say "Dong goi"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/pkg/client"
cp -r "$ROOT/server"        "$TMP/pkg/server"
cp -r "$ROOT/client/dist"   "$TMP/pkg/client/dist"
rm -rf "$TMP/pkg/server/node_modules" "$TMP/pkg/server/data"
# KHONG gui package.json goc: no khai workspaces ["client","server"] ma tren VPS
# client/ chi co dist (khong co package.json) => npm install o root se vo.
# Server chay bang `node server/src/index.js`, khong can package.json goc.
# Cung khong gui .env (chua API key) va node_modules (binary khac kien truc).
( cd "$TMP/pkg" && tar czf "$TMP/app.tgz" . )
echo "Goi: $(du -h "$TMP/app.tgz" | cut -f1)"

# --- 4. Day len va giai nen ----------------------------------------------------
say "Day len VPS"
$SSH "rm -rf $APP_DIR.new && mkdir -p $APP_DIR.new"
scp -i "$KEY" -P "$PORT" -o StrictHostKeyChecking=accept-new \
    "$TMP/app.tgz" "$USER@$HOST:$APP_DIR.new/app.tgz"
$SSH "cd $APP_DIR.new && tar xzf app.tgz && rm app.tgz"

# --- 5. Cai dependency cua server ---------------------------------------------
say "Cai dependency (chi express + cors, theo server/package.json)"
$SSH "cd $APP_DIR.new/server && npm install --omit=dev --no-fund --no-audit 2>&1 | tail -3"

# --- 6. Doi cho chay -----------------------------------------------------------
say "Chuyen sang ban moi"
$SSH "
  if [ -d $APP_DIR ]; then rm -rf $APP_DIR.old && mv $APP_DIR $APP_DIR.old; fi
  mv $APP_DIR.new $APP_DIR
"

# --- 7. Khoi dong bang pm2 (hoac systemd user neu khong co pm2) ---------------
say "Khoi dong app"
$SSH "
  cd $APP_DIR
  export INTERNAL_PASSWORD='$INTERNAL_PASSWORD'
  if command -v pm2 >/dev/null 2>&1; then
    pm2 delete zalo-copilot >/dev/null 2>&1 || true
    pm2 start server/src/index.js --name zalo-copilot --update-env -- --port $APP_PORT
    pm2 save >/dev/null 2>&1 || true
    pm2 list | grep -E 'zalo-copilot|name' || true
  else
    echo 'pm2 chua co - chay bang nohup tam thoi'
    pkill -f 'server/src/index.js' 2>/dev/null || true
    sleep 1
    nohup node server/src/index.js --port $APP_PORT > $APP_DIR/app.log 2>&1 &
    sleep 3
    tail -5 $APP_DIR/app.log
  fi
"

# --- 8. Kiem tra ---------------------------------------------------------------
say "Kiem tra tu ben trong VPS"
$SSH "curl -sS --max-time 10 http://127.0.0.1:$APP_PORT/api/health && echo"

say "Xong phan app. Buoc con lai: tro nginx vao cong $APP_PORT"
cat <<EOF

nginx dang serve trang placeholder cua BTC. De $DOMAIN tra ve app,
them block proxy vao server{} cua nginx (can sudo):

  location / {
      proxy_pass http://127.0.0.1:$APP_PORT;
      proxy_http_version 1.1;
      proxy_set_header Host              \$host;
      proxy_set_header X-Real-IP         \$remote_addr;
      proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
  }

Roi: sudo nginx -t && sudo systemctl reload nginx

EOF
