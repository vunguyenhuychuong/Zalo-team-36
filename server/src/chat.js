import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LlmError, complete } from './llm.js'

/**
 * Luong chat tu van — cua truoc dang hoi thoai, chay tren server cua minh.
 *
 * Vi sao khong dung zClaw: o "Tinh cach bot" cua zClaw la khe persona ngan,
 * khong nhan duoc system prompt day du va khong nhan duoc knowledge base. Da do
 * bang cach thu that. Muon bot tra loi dua tren KB thi phai tu so huu runtime.
 *
 * PHAN CONG — giu dung nguyen tac cua tai lieu:
 *   LLM  -> hoi chuyen, tra loi dua tren KB, TRICH XUAT thong tin ra JSON
 *   Code -> quyet dinh khi nao du thong tin, cham diem, phan loai, tao lead
 *
 * LLM khong bao gio quyet dinh "khach nay la SQL candidate". No chi ke lai
 * khach da noi gi, roi rule engine cham.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const PROMPT_DIR = join(HERE, '..', '..', 'prompts')

/** Nap prompt day du (co KB) mot lan luc khoi dong. */
function loadSystemPrompt() {
  for (const name of ['bot-prompt-full.txt', 'bot-prompt-compact.txt', 'bot-personality.txt']) {
    try {
      return readFileSync(join(PROMPT_DIR, name), 'utf8')
    } catch {
      /* thu file tiep theo */
    }
  }
  throw new Error('Không tìm được prompt nào trong prompts/. Chạy: node scripts/build-bot-prompt.mjs')
}

let SYSTEM = null

export function systemPromptInfo() {
  if (!SYSTEM) {
    try {
      SYSTEM = loadSystemPrompt()
    } catch {
      return null
    }
  }
  return { bytes: Buffer.byteLength(SYSTEM, 'utf8') }
}

/** Gioi han lich su de khong phinh chi phi: prompt da 4400 token, gui lai moi luot. */
const MAX_TURNS = 16

function trimHistory(messages) {
  const clean = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
  return clean.slice(-MAX_TURNS)
}

/** Mot luot hoi thoai. Tra ve cau tra loi cua bot. */
export async function reply(messages) {
  if (!SYSTEM) SYSTEM = loadSystemPrompt()
  const history = trimHistory(messages)
  if (history.length === 0) throw new LlmError('Chưa có tin nhắn nào.')

  const { text, model, tokens } = await complete({
    system: SYSTEM,
    messages: history,
    maxTokens: 600,
    temperature: 0.4,
  })

  return { text, model, tokens }
}

/* =====================================================================
   Trich xuat thong tin da thu thap duoc -> JSON
   ===================================================================== */

/**
 * Cac gia tri hop le. Bat model chon TRONG danh sach nay chu khong tu do,
 * de ket qua nap thang vao rule engine duoc.
 */
const CHOICES = {
  industry: ['fnb', 'retail', 'beauty', 'health', 'education', 'travel', 'realestate', 'finance', 'manufacture', 'service'],
  companySize: ['micro', 'small', 'medium', 'large'],
  currentChannels: ['facebook', 'tiktok', 'ecom', 'website', 'zalo_oa', 'pos', 'offline', 'none'],
  goals: ['sales', 'care', 'loyalty', 'order', 'notify', 'cost', 'brand', 'data'],
  buyingIntent: ['exploring', 'comparing', 'demo', 'quote', 'callback'],
  decisionRole: ['owner', 'manager', 'staff'],
  timeline: ['t0', 't1', 't2', 't3'],
}

const EXTRACT_SYSTEM = `Bạn đọc một đoạn hội thoại giữa chuyên viên Zalo và một doanh nghiệp, rồi rút ra thông tin đã biết.

Trả về DUY NHẤT một JSON object, không thêm lời dẫn, không bọc trong dấu \`\`\`.

Các khoá và giá trị hợp lệ (chỉ được chọn trong danh sách, không tự đặt giá trị mới):
  industry: ${CHOICES.industry.join(' | ')}
  companySize: ${CHOICES.companySize.join(' | ')}
  currentChannels: mảng, chọn trong ${CHOICES.currentChannels.join(' | ')}
  goals: mảng, chọn trong ${CHOICES.goals.join(' | ')}
  buyingIntent: ${CHOICES.buyingIntent.join(' | ')}
  decisionRole: ${CHOICES.decisionRole.join(' | ')}
  timeline: ${CHOICES.timeline.join(' | ')}  (t0 chưa có kế hoạch, t1 là 3-6 tháng, t2 là 1-3 tháng, t3 là ngay tháng này)
  painPoint: chuỗi — mô tả vấn đề bằng ĐÚNG từ ngữ khách đã dùng, không diễn giải lại
  companyName, fullName, phone, email: chuỗi nếu khách đã nói

QUY TẮC:
- Khoá nào khách CHƯA nói thì BỎ HẲN khỏi JSON. Tuyệt đối không đoán, không điền giá trị mặc định.
- painPoint lấy nguyên văn ý khách, không thêm chi tiết khách không nói.
- Nếu chưa rút được gì thì trả về {}`

/** Bo cac gia tri khong nam trong danh sach cho phep. Model co the tu bia. */
function sanitize(raw) {
  const out = {}
  if (typeof raw !== 'object' || raw === null) return out

  for (const [key, allowed] of Object.entries(CHOICES)) {
    const v = raw[key]
    if (Array.isArray(allowed) && key.endsWith('s') && Array.isArray(v)) {
      const kept = v.filter((x) => allowed.includes(x))
      if (kept.length) out[key] = kept
    } else if (typeof v === 'string' && allowed.includes(v)) {
      out[key] = v
    }
  }
  // currentChannels va goals la mang, xu ly rieng vi ten khong ket thuc bang 's'
  for (const key of ['currentChannels', 'goals']) {
    if (Array.isArray(raw[key])) {
      const kept = raw[key].filter((x) => CHOICES[key].includes(x))
      if (kept.length) out[key] = kept
    }
  }

  for (const key of ['painPoint', 'companyName', 'fullName', 'phone', 'email']) {
    if (typeof raw[key] === 'string' && raw[key].trim()) out[key] = raw[key].trim().slice(0, 1000)
  }

  return out
}

/**
 * Truong ma HOI THOAI phai lay duoc truoc khi cho sang buoc xac nhan.
 *
 * CO Y khong co `goals`: khach ke VAN DE ("khach nhan tin dat ban hay bi bo sot"),
 * khong ke muc tieu theo phan loai ('care' | 'order' | ...). Bat model suy ra
 * goals tu van la vi pham chinh quy tac "khong doan" o EXTRACT_SYSTEM.
 * Nen goals de nguoi dung tu tich o buoc xac nhan — do la lua chon cua ho.
 *
 * Ten lien he (fullName, phone) cung khong o day: khong bao gio tin model trich
 * xuat so dien thoai va email. Nguoi dung tu dien o buoc xac nhan.
 */
const REQUIRED = ['industry', 'companySize', 'painPoint', 'buyingIntent']

export async function extract(messages) {
  if (!SYSTEM) SYSTEM = loadSystemPrompt()
  const history = trimHistory(messages)

  const transcript = history
    .map((m) => `${m.role === 'user' ? 'DOANH NGHIỆP' : 'CHUYÊN VIÊN'}: ${m.content}`)
    .join('\n')

  let parsed = {}
  try {
    const { text } = await complete({
      system: EXTRACT_SYSTEM,
      user: transcript,
      maxTokens: 500,
      // 0 de cung mot hoi thoai luon rut ra cung mot ket qua
      temperature: 0,
    })
    // Model doi khi van boc trong ``` du da dan khong duoc
    const json = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
    parsed = JSON.parse(json)
  } catch {
    // Khong parse duoc thi coi nhu chua rut duoc gi — khong nem loi, de UI
    // van chay va nguoi dung tu dien phan con lai.
    parsed = {}
  }

  const collected = sanitize(parsed)
  const missing = REQUIRED.filter((k) => {
    const v = collected[k]
    return Array.isArray(v) ? v.length === 0 : !v
  })

  return { collected, missing, ready: missing.length === 0 }
}
