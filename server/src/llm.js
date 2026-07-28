/**
 * Client goi FPT AI Inference (chuan OpenAI-compatible).
 *
 * Day la CHO DUY NHAT trong app goi LLM. Nguyen tac: model chi viet van, khong
 * bao gio quyet dinh. Diem so va phan loai do rule engine tinh, model nhan du
 * lieu da co cau truc roi dien dat lai.
 *
 * Khong dung SDK nao - Node 20 co san global fetch.
 */

const ENDPOINT = 'https://mkp-api.fptcloud.com/v1/chat/completions'
const DEFAULT_MODEL = 'gemma-4-31B-it'
const TIMEOUT_MS = 20_000

export function isConfigured() {
  return typeof process.env.FPT_API_KEY === 'string' && process.env.FPT_API_KEY.length > 10
}

export function modelName() {
  return process.env.FPT_MODEL || DEFAULT_MODEL
}

/** Che key truoc khi ghi log. Key nam trong header nhung van de lo qua log loi. */
function maskKey(text) {
  const key = process.env.FPT_API_KEY
  if (!key || typeof text !== 'string') return text
  return text.split(key).join('sk-***')
}

export class LlmError extends Error {}

/**
 * Goi model, tra ve chuoi van ban.
 *
 * Nem LlmError khi: chua cau hinh key, timeout, API loi, hoac model tra ve
 * `content` rong. Truong hop cuoi la that - da do duoc: `gpt-oss-20b` tra
 * 200 OK nhung content = null, va model reasoning nhu DeepSeek-V4-Flash de bi
 * cat het token vao phan suy nghi neu maxTokens qua thap.
 */
export async function complete({ system, user, maxTokens = 400, temperature = 0.4 }) {
  if (!isConfigured()) {
    throw new LlmError('Chưa cấu hình FPT_API_KEY.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${process.env.FPT_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName(),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    })
  } catch (e) {
    throw new LlmError(
      e.name === 'AbortError' ? `Model không trả lời trong ${TIMEOUT_MS / 1000}s.` : maskKey(e.message),
    )
  } finally {
    clearTimeout(timer)
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = body?.error?.message ?? body?.message ?? `HTTP ${res.status}`
    throw new LlmError(maskKey(String(detail)).slice(0, 200))
  }

  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new LlmError('Model trả về nội dung rỗng.')
  }

  return {
    text: text.trim(),
    model: body.model ?? modelName(),
    tokens: body.usage?.total_tokens ?? null,
  }
}
