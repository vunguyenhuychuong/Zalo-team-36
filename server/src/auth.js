import { randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Auth cho khu vuc noi bo (advisor + dashboard).
 *
 * Muc dich: khu vuc noi bo hien khoang chi phi va toan bo cong thuc cham diem.
 * Neu khong co auth thi ai mo domain cung thanh "nhan su Zalo", va Never List
 * dieu 11 (khong lo quy tac cham diem, nguong phan loai) bi vo ngay.
 *
 * Mo hinh: mot mat khau dung chung cho ca team -> doi lay token phien.
 * Du cho hackathon. KHONG du cho production thuc te: khong phan biet duoc ai
 * dang dang nhap, ma tai lieu lai yeu cau "ghi lai ai/agent nao doi trang thai".
 * Muon dung that thi thay bang SSO cua Zalo va luu user id vao lead record.
 */

const DEFAULT_PASSWORD = 'zalo-copilot-2026'
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 tieng, du mot ngay demo

const PASSWORD = process.env.INTERNAL_PASSWORD ?? DEFAULT_PASSWORD
export const usingDefaultPassword = PASSWORD === DEFAULT_PASSWORD

/** token -> thoi diem het han (ms) */
const sessions = new Map()

/** So sanh chuoi theo thoi gian hang so de khong ro ri do dai qua thoi gian phan hoi. */
function sameSecret(a, b) {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function sweep() {
  const now = Date.now()
  for (const [token, exp] of sessions) {
    if (exp <= now) sessions.delete(token)
  }
}

/** Tra token neu mat khau dung, nguoc lai tra null. */
export function login(password) {
  if (typeof password !== 'string' || password.length === 0) return null
  if (!sameSecret(password, PASSWORD)) return null

  sweep()
  const token = randomBytes(24).toString('hex')
  sessions.set(token, Date.now() + TOKEN_TTL_MS)
  return { token, expiresIn: TOKEN_TTL_MS }
}

export function logout(token) {
  return sessions.delete(token)
}

function tokenFrom(req) {
  const h = req.get('authorization') ?? ''
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m ? m[1] : null
}

export function isAuthed(req) {
  const token = tokenFrom(req)
  if (!token) return false
  const exp = sessions.get(token)
  if (!exp) return false
  if (exp <= Date.now()) {
    sessions.delete(token)
    return false
  }
  return true
}

/**
 * Middleware chan cac route noi bo.
 * Day la "lop cung" ma tai lieu noi toi: khong cap du lieu o tang API, chu
 * khong phai chi an tren giao dien.
 */
export function requireInternal(req, res, next) {
  if (isAuthed(req)) return next()
  return res.status(401).json({
    ok: false,
    message: 'Khu vực nội bộ — cần đăng nhập.',
  })
}

export function sessionCount() {
  sweep()
  return sessions.size
}
