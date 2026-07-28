/**
 * Chay toan bo ho so mau qua engine that va in bang ket qua.
 *
 *   node scripts/run-personas.mjs
 *
 * Dung de: xem nhanh moi loai SME ra ket qua gi, va lam kiem thu hoi quy moi
 * khi sua rule trong catalog.js hoac scoring.js.
 */
import { analyze } from '../server/src/scoring.js'
import { DEMO_PERSONAS } from '../server/src/demoPersonas.js'

const pad = (s, n) => String(s).padEnd(n)

for (const p of DEMO_PERSONAS) {
  const r = analyze(p.input)
  const q = r.qualification
  const top3 = r.solutions.slice(0, 3).map((s) => `${s.id} ${s.score}%`).join('  ')

  console.log('\n' + '─'.repeat(78))
  console.log(p.title)
  console.log('─'.repeat(78))
  console.log(`  Điểm        ${q.score}/100  →  ${q.classificationLabel}`)
  console.log(`  Top 3       ${top3}`)
  console.log(
    '  Thành phần  ' +
      q.components.map((c) => `${c.key} ${c.earned}/${c.max}`).join('  '),
  )
  if (q.gateBlocks.length) console.log(`  Bị chặn     ${q.gateBlocks.join(' ; ')}`)
  if (q.missingFields.length) console.log(`  Thiếu       ${q.missingFields.join(' · ')}`)
  console.log(`  Hành động   ${q.nextAction.label}`)
}

console.log('\n' + '═'.repeat(78))
console.log('TỔNG HỢP')
console.log('═'.repeat(78))
console.log(pad('Hồ sơ', 34) + pad('Điểm', 7) + pad('Phân loại', 16) + 'Giải pháp đứng đầu')
for (const p of DEMO_PERSONAS) {
  const r = analyze(p.input)
  const q = r.qualification
  const gate = q.gateBlocks.length ? ' *' : ''
  console.log(
    pad(p.title.split('—')[0].trim(), 34) +
      pad(q.score, 7) +
      pad(q.classificationLabel + gate, 16) +
      `${r.solutions[0].name} ${r.solutions[0].score}%`,
  )
}
console.log('\n  * = đủ điểm nhưng bị chặn ở cổng SQL candidate\n')
