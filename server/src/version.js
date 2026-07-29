import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Version cho ruleset va prompt.
 *
 * Tai lieu yeu cau: "Dinh nghia trang thai nen versioned vi Sales/Product/AI
 * hieu chinh hang tuan trong pilot." Khong co version thi khong truy duoc mot
 * lead da duoc cham bang bo rule nao — ma do la cau hoi se bi hoi.
 *
 * RULESET_VERSION tang tay khi doi trong so trong catalog.js, doi nguong trong
 * scoring.js, hoac doi bang chuyen trong leadStatus.js.
 *
 * PROMPT_VERSION thi DOC TU FILE, khong khai lai. Truoc day so phien ban nam o
 * ba cho (hai dong trong bot-personality.txt va mot hang so trong eval.mjs) nen
 * de lech nhau — day chinh la loi tung xay ra.
 */

export const RULESET_VERSION = 'ruleset-2026.07.29'

const HERE = dirname(fileURLToPath(import.meta.url))
const PROMPT_FILE = join(HERE, '..', '..', 'prompts', 'bot-personality.txt')

let cached = null

/**
 * Rut phien ban tu dong "PHIÊN BẢN PROMPT: prompt-vN" o dau file prompt,
 * va kiem no khop voi dong o muc KIEM PHIEN BAN. Lech nhau la loi that:
 * bot se tra ve mot so, con eval mong doi so khac.
 */
export function promptVersion() {
  if (cached) return cached

  try {
    const text = readFileSync(PROMPT_FILE, 'utf8')
    const header = /PHIÊN BẢN PROMPT:\s*(\S+)/.exec(text)?.[1]
    if (!header) throw new Error('không thấy dòng "PHIÊN BẢN PROMPT:"')

    // Dong cuoi muc KIEM PHIEN BAN — thu bot se doc ra khi go /zbc-version
    const marker = /KIỂM PHIÊN BẢN:[\s\S]*?\n(\S+)\s*$/m.exec(text)?.[1]
    if (marker && marker !== header) {
      console.warn(
        `[version] LỆCH phiên bản trong prompt: header là "${header}" nhưng mục ` +
          `KIỂM PHIÊN BẢN ghi "${marker}". Sửa cho khớp, không thì /zbc-version báo sai.`,
      )
    }

    cached = { version: header, mismatch: marker && marker !== header ? marker : null }
  } catch (e) {
    console.warn('[version] Không đọc được phiên bản prompt:', e.message)
    cached = { version: 'unknown', mismatch: null }
  }

  return cached
}

/** Dong vao moi lead de biet no duoc cham bang bo rule / prompt nao. */
export function stamp() {
  return { rulesetVersion: RULESET_VERSION, promptVersion: promptVersion().version }
}
