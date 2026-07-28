#!/usr/bin/env bash
#
# Thu system prompt cua bot (o TINH CACH BOT trong zClaw) truoc khi dan vao app.
# Kiem 2 thu: bot co hoi tung cau mot khong, va co bam danh muc 5 giai phap khong.
#
#   bash scripts/test-bot-prompt.sh

set -u

ENDPOINT="https://mkp-api.fptcloud.com/v1/chat/completions"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT/.env" ]; then
  set -a; . "$ROOT/.env"; set +a
fi
: "${FPT_API_KEY:?Chua co FPT_API_KEY trong .env}"
MODEL="${FPT_MODEL:-gemma-4-31B-it}"

SYSTEM=$(cat "$ROOT/prompts/bot-personality.txt")

# Hai luot thu: mo dau, va luc khach da khai du thong tin
ask() {
  local label="$1"; shift
  printf '\n=========== %s ===========\n' "$label"

  python - "$MODEL" "$SYSTEM" "$@" <<'PY' > /tmp/zc-body.json
import json, sys
model, system = sys.argv[1], sys.argv[2]
msgs = [{"role": "system", "content": system}]
for i, t in enumerate(sys.argv[3:]):
    msgs.append({"role": "user" if i % 2 == 0 else "assistant", "content": t})
print(json.dumps({"model": model, "messages": msgs, "max_tokens": 900, "temperature": 0.4}))
PY

  curl -sS -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FPT_API_KEY" \
    -d @/tmp/zc-body.json \
  | python -c '
import sys, json
d = json.load(sys.stdin)
ch = d.get("choices")
if not ch:
    print("LOI:", json.dumps(d, ensure_ascii=False)[:400]); sys.exit()
m = ch[0]["message"]
print(m.get("content") or "(NULL)")
print("---")
print("out token:", d.get("usage",{}).get("completion_tokens"), "| finish:", ch[0].get("finish_reason"))
'
}

ask "Luot 1 - khach vao lan dau" \
  "chao ban"

ask "Luot 2 - khach da khai du thong tin" \
  "chao ban" \
  "Chào anh/chị! Em là Copilot. Để tư vấn đúng, em xin hỏi: quán mình thuộc ngành nào ạ?" \
  "quan ca phe o Da Nang, 5 nhan vien, dang ban qua Facebook thoi, khach hay nhan tin dat ban ma bon em bo sot nhieu"

rm -f /tmp/zc-body.json
