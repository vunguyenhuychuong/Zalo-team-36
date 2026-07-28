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

import { FAQ, PLAYBOOKS } from '../server/src/knowledgeBase.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = join(ROOT, 'prompts', 'bot-personality.txt')
const OUT = join(ROOT, 'prompts', 'bot-prompt-full.txt')

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
  faqBlock,
  '',
  '-'.repeat(72),
  '',
  playbookBlock,
  '',
].join('\n')

writeFileSync(OUT, composed, 'utf8')

const kb = (n) => `${(n / 1024).toFixed(1)} KB (~${Math.round(n / 3)} token)`
console.log('')
console.log('  Đã ghi prompts/bot-prompt-full.txt')
console.log('')
console.log(`  Prompt gốc      ${kb(Buffer.byteLength(base, 'utf8'))}`)
console.log(
  `  + kiến thức     ${kb(Buffer.byteLength(composed, 'utf8') - Buffer.byteLength(base, 'utf8'))}` +
    `   (${faqFact.length} FAQ trả lời được, ${faqDeflect.length} FAQ chuyển chuyên viên, ` +
    `${Object.keys(PLAYBOOKS).length} ngành)`,
)
console.log(`  = tổng          ${kb(Buffer.byteLength(composed, 'utf8'))}`)
console.log('')
console.log('  Dán FILE NÀY vào ô "Tính cách bot" của zClaw, không phải bot-personality.txt.')
console.log('  Rồi chạy `npm run eval` để kiểm ranh giới còn giữ được ở độ dài mới.')
console.log('')
