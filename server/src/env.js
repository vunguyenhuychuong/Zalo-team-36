import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Nap file .env vao process.env. Khong dung dotenv de khoi them dependency.
 *
 * Module nay chay boi TAC DUNG PHU luc import, va phai duoc import DAU TIEN
 * trong index.js. Ly do: auth.js doc process.env.INTERNAL_PASSWORD ngay luc
 * module do duoc danh gia, ma ESM danh gia import theo dung thu tu khai bao.
 * Nap env trong than ham cua index.js thi da muon.
 *
 * Bien da co san trong moi truong thi KHONG bi ghi de - de pm2/systemd hoac
 * bien cua platform (Render/Railway) van thang file.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const CANDIDATES = [
  join(HERE, '..', '..', '.env'), // goc repo, khi chay o may local
  join(HERE, '..', '.env'), // trong server/, khi deploy chi day thu muc server
]

function parse(text) {
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq <= 0) continue

    const key = line.slice(0, eq).trim()
    // Ten bien khong hop le thi bo qua - vd file chi co key tran khong co ten bien
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

    let value = line.slice(eq + 1).trim()
    // Bo dau nhay bao quanh neu co
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

let loadedFrom = null

for (const path of CANDIDATES) {
  if (!existsSync(path)) continue
  try {
    const vars = parse(readFileSync(path, 'utf8'))
    for (const [k, v] of Object.entries(vars)) {
      if (process.env[k] === undefined) process.env[k] = v
    }
    loadedFrom = path
    break
  } catch (e) {
    console.warn('[env] Không đọc được', path, '-', e.message)
  }
}

export const envFile = loadedFrom
