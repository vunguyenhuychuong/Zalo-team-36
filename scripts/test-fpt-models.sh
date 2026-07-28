#!/usr/bin/env bash
#
# So sanh cac model tren FPT AI Marketplace de chon model cho bot Zalo.
#
# Chay bang Git Bash (khong phai PowerShell):
#   bash scripts/test-fpt-models.sh
#
# Key doc tu file .env o goc project (da nam trong .gitignore).
# Neu bao loi "\r: command not found" thi file dang CRLF, sua bang:
#   sed -i 's/\r$//' scripts/test-fpt-models.sh

set -u

ENDPOINT="https://mkp-api.fptcloud.com/v1/chat/completions"
PROMPT="Toi ban ca phe o Da Nang, quan nho 5 nhan vien. Zalo giup duoc gi cho quan cua toi?"

# --- Nap key -----------------------------------------------------------------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$ROOT/.env"; set +a
fi

if [ -z "${FPT_API_KEY:-}" ]; then
  echo "Chua co FPT_API_KEY."
  echo "Tao file $ROOT/.env voi noi dung:"
  echo "  FPT_API_KEY=sk-..."
  echo "Hoac: export FPT_API_KEY='sk-...' roi chay lai."
  exit 1
fi

# --- Model muon so sanh ------------------------------------------------------
# Chi giu lai nhung model da tick Permission khi tao API key.
MODELS=(
  "DeepSeek-V4-Flash"
  "Llama-3.3-70B-Instruct"
  "SaoLa3.1-medium"
  "gemma-4-31B-it"
  "gpt-oss-20b"
)

for m in "${MODELS[@]}"; do
  printf '\n=== %s ===\n' "$m"

  body=$(printf '{"model":"%s","messages":[{"role":"user","content":"%s"}],"max_tokens":400}' "$m" "$PROMPT")

  curl -sS -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FPT_API_KEY" \
    -d "$body" \
  | python -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception as e:
    print("  loi doc JSON:", e); sys.exit()

ch = d.get("choices")
if not ch:
    print("  LOI:", json.dumps(d, ensure_ascii=False)[:300]); sys.exit()

msg = ch[0].get("message", {})
content = msg.get("content") or ""
reasoning = msg.get("reasoning_content") or ""
usage = d.get("usage", {})

print("  reasoning :", len(reasoning), "ky tu", "<-- model reasoning" if reasoning else "(khong co - dung cho chat bot)")
print("  finish    :", ch[0].get("finish_reason"))
print("  out token :", usage.get("completion_tokens"))
print("  content   :", (content[:220].replace(chr(10), " ") or "(NULL - zClaw se coi la loi)"))
'
done

printf '\n----------------------------------------------------------------\n'
printf 'Chon model co: reasoning = 0 va content day du.\n'
printf 'Do la loai instruct, phu hop cho bot chat va an toan voi zClaw.\n\n'
