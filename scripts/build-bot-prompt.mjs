/**
 * Ghep prompt bot + knowledge base thanh mot file dan duoc vao zClaw.
 *
 *   node scripts/build-bot-prompt.mjs
 *   -> prompts/bot-prompt-full.txt
 *
 * Vi sao can buoc ghep: zClaw chi nhan MOT chuoi prompt, khong co cho cam KB
 * rieng. Nhung viet KB truc tiep vao bot-personality.txt thi file do phinh len
 * va lan lon giua "hanh vi" voi "kien thuc" — sua mot thu de va cai kia.
 * Nen giu hai file tach nhau, ghep bang script, va do lai eval tren ban ghep.
 *
 * Script in ra kich thuoc truoc/sau de biet prompt dai them bao nhieu. Prompt
 * dai lam model de bo sot quy tac (tai lieu, muc System Prompt), nen con so nay
 * dang theo doi — khong phai cang nhieu KB cang tot.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  FAQ,
  HANDOVER_REPORT_SCHEMA,
  HANDOVER_REPORT_WORKFLOW,
  PLAYBOOKS,
  PRODUCT_GUARDRAILS,
  RECOMMENDATION_RULES,
} from '../server/src/knowledgeBase.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = join(ROOT, 'prompts', 'bot-personality.txt')

/**
 * `--compact` bo phan playbook theo nganh, giu ranh gioi va FAQ.
 * Dung khi o "Tinh cach bot" cua zClaw co gioi han do dai va cat bot ban day.
 * Dau hieu bi cat: dan xong ma chat /zbc-version khong tra ve dung phien ban.
 */
const compact = process.argv.includes('--compact')
const OUT = join(ROOT, 'prompts', compact ? 'bot-prompt-compact.txt' : 'bot-prompt-full.txt')

const base = readFileSync(BASE, 'utf8').trimEnd()

/* --- FAQ --------------------------------------------------------------- */
const faqFact = FAQ.filter((f) => f.loai === 'fact')
const faqDeflect = FAQ.filter((f) => f.loai === 'deflect')

const faqBlock = [
  'CÂU HỎI THƯỜNG GẶP — dùng đúng nội dung dưới đây, không thêm thông tin ngoài:',
  '',
  ...faqFact.map((f) => `H: ${f.hoi}\nĐ: ${f.dap}`),
  '',
  'NHỮNG CÂU KHÔNG ĐƯỢC TỰ TRẢ LỜI — nói đúng câu bên dưới rồi chuyển chuyên viên:',
  '',
  ...faqDeflect.map((f) => `H: ${f.hoi}\nĐ: ${f.dap}`),
].join('\n')

/* --- Rule anh xa nhu cau -> san pham --------------------------------- */
const rulesBlock = [
  'QUY TẮC ÁNH XẠ NHU CẦU → SẢN PHẨM — dùng khi đã đủ thông tin để đề xuất.',
  'Nếu chưa biết khách đã có OA hay chưa, hỏi để xác nhận trước khi đưa Mini App/ZBS thành bước chính.',
  '',
  ...RECOMMENDATION_RULES.map(
    (r) =>
      `[${r.id}]\n` +
      `Điều kiện: ${r.dieuKien}\n` +
      `Đề xuất: ${r.deXuat}\n` +
      `Tiên quyết: ${r.tienQuyet}\n` +
      `Ghi chú: ${r.ghiChu}`,
  ),
].join('\n\n')

/* --- Guardrail san pham ---------------------------------------------- */
const guardrailsBlock = [
  'GIỚI HẠN SẢN PHẨM — dùng để tránh hứa quá phạm vi.',
  '',
  ...Object.values(PRODUCT_GUARDRAILS).map(
    (g) =>
      `[${g.ten}]\n` +
      `Không thể:\n` +
      g.khongThe.map((x) => `- ${x}`).join('\n') +
      `\nLối thoát: ${g.loiThoat}`,
  ),
].join('\n\n')

/* --- Handover cho account -------------------------------------------- */
const fieldNames = (items) =>
  items
    .map((x) => {
      if (typeof x === 'string') return x.split(' — ')[0]
      return `${x.key} (${x.nhan})`
    })
    .join('; ')

const handoverBlock = [
  'HANDOVER CHO ACCOUNT — dùng khi khách đã đủ thông tin hoặc muốn dừng.',
  'Không đọc report này cho khách; chỉ xác nhận ngắn là đã ghi nhận và chuyên viên sẽ liên hệ.',
  '',
  'Nguyên tắc:',
  ...HANDOVER_REPORT_WORKFLOW.nguyenTac.map((x) => `- ${x}`),
  '',
  'Nhóm trường cần gom:',
  `- Phân loại: ${fieldNames(HANDOVER_REPORT_SCHEMA.phanLoai)}`,
  `- Nhu cầu: ${fieldNames(HANDOVER_REPORT_SCHEMA.nhuCau)}`,
  `- Hiện trạng: ${fieldNames(HANDOVER_REPORT_SCHEMA.hienTrang)}`,
  `- Đề xuất của agent: ${fieldNames(HANDOVER_REPORT_SCHEMA.deXuatAgent)}`,
  `- Handover: ${fieldNames(HANDOVER_REPORT_SCHEMA.handover)}`,
  '',
  'Đủ điều kiện handover khi:',
  ...HANDOVER_REPORT_WORKFLOW.duDieuKienHandover.map((x) => `- ${x}`),
].join('\n')

/* --- Playbook theo nganh ---------------------------------------------- */
const playbookBlock = [
  'MÔ HÌNH TRIỂN KHAI THEO NGÀNH — dùng để giải thích thứ tự nên làm.',
  'Đây là mô tả mô hình điển hình, KHÔNG phải cam kết kết quả. Không được thêm số liệu nào.',
  '',
  ...Object.values(PLAYBOOKS).map(
    (p) =>
      `[${p.ten}]\n` +
      `Mô hình: ${p.monHinh}\n` +
      `Thứ tự: ${p.thuTu}\n` +
      `Chưa nên: ${p.chuaNen}`,
  ),
].join('\n\n')

const composed = [
  '# File này do scripts/build-bot-prompt.mjs sinh ra — đừng sửa tay.',
  '# Sửa prompts/bot-personality.txt (hành vi) hoặc server/src/knowledgeBase.js (kiến thức),',
  '# rồi chạy lại: node scripts/build-bot-prompt.mjs',
  '',
  base,
  '',
  '='.repeat(72),
  'PHẦN KIẾN THỨC — tra cứu khi khách hỏi tới. Mọi ranh giới ở trên vẫn áp dụng.',
  '='.repeat(72),
  '',
  rulesBlock,
  '',
  '-'.repeat(72),
  '',
  guardrailsBlock,
  '',
  '-'.repeat(72),
  '',
  handoverBlock,
  '',
  '-'.repeat(72),
  '',
  faqBlock,
  ...(compact ? [] : ['', '-'.repeat(72), '', playbookBlock]),
  '',
].join('\n')

writeFileSync(OUT, composed, 'utf8')

const kb = (n) => `${(n / 1024).toFixed(1)} KB (~${Math.round(n / 3)} token)`
console.log('')
console.log(`  Đã ghi prompts/${compact ? 'bot-prompt-compact.txt' : 'bot-prompt-full.txt'}`)
console.log('')
console.log(`  Prompt gốc      ${kb(Buffer.byteLength(base, 'utf8'))}`)
console.log(
  `  + kiến thức     ${kb(Buffer.byteLength(composed, 'utf8') - Buffer.byteLength(base, 'utf8'))}` +
    `   (${RECOMMENDATION_RULES.length} rule, ` +
    `${Object.keys(PRODUCT_GUARDRAILS).length} nhóm guardrail, ` +
    `${HANDOVER_REPORT_WORKFLOW.duDieuKienHandover.length} tiêu chí handover, ` +
    `${faqFact.length} FAQ trả lời được, ${faqDeflect.length} FAQ chuyển chuyên viên` +
    (compact ? ', bỏ playbook)' : `, ${Object.keys(PLAYBOOKS).length} ngành)`),
)
console.log(`  = tổng          ${kb(Buffer.byteLength(composed, 'utf8'))}`)
console.log('')
console.log(`  Dán FILE NÀY vào ô "Tính cách bot" của zClaw: prompts/${compact ? 'bot-prompt-compact.txt' : 'bot-prompt-full.txt'}`)
if (!compact) console.log('  Nếu ô đó cắt bớt nội dung, chạy lại với --compact để bỏ phần playbook.')
console.log('  Rồi chạy `npm run eval` để kiểm ranh giới còn giữ được ở độ dài mới.')
console.log('')
