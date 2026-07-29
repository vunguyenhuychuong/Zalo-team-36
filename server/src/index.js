// PHAI dat truoc moi import khac: auth.js doc process.env ngay luc no duoc
// danh gia, va ESM danh gia import theo dung thu tu khai bao o day.
import './env.js'

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { analyze } from './scoring.js'
import { listLeads, load, reset, setOpeningLine, toLead, transition, upsertLead } from './store.js'
import { HUMAN_STATUSES, TRANSITIONS } from './leadStatus.js'
import { generateOpeningLine } from './openingLine.js'
import { LlmError, isConfigured as llmConfigured, modelName } from './llm.js'
import { extract, reply, systemPromptInfo } from './chat.js'
import { login, logout, requireInternal, sessionCount, usingDefaultPassword } from './auth.js'

/**
 * Thu tu uu tien: --port <n>  >  API_PORT  >  PORT  >  4000
 *
 * Vi sao can --port: khi chay chung voi Vite, moi truong da co bien PORT tro
 * vao cong cua Vite (5173). Neu doc PORT truoc thi API se dinh EADDRINUSE.
 * Bien PORT van duoc giu lai cho luc deploy (Render/Railway tu set bien nay).
 */
function resolvePort() {
  // lastIndexOf, khong phai indexOf: script `npm run start` da truyen san
  // `--port 4000`, nen khi nguoi dung them `-- --port 4001` thi argv co hai cap.
  // Lay cap cuoi de cai nguoi dung go de len duoc cai mac dinh.
  const i = process.argv.lastIndexOf('--port')
  if (i !== -1) {
    const n = Number(process.argv[i + 1])
    if (Number.isInteger(n) && n > 0) return n
  }
  return Number(process.env.API_PORT ?? process.env.PORT ?? 4000)
}

const PORT = resolvePort()

/**
 * Dia chi bind. Mac dinh 127.0.0.1 - app CHI nghe tu trong may.
 *
 * Vi sao mac dinh la localhost chu khong phai 0.0.0.0: khi deploy sau nginx,
 * neu bind 0.0.0.0 thi cong 4000 lo thang ra internet, di vong qua nginx va
 * qua ca HTTPS. Dashboard noi bo chua co dang nhap nen luc do bat ky ai cung
 * doc duoc danh sach lead (ten, email, so dien thoai) qua HTTP thuong.
 *
 * Can mo cho may khac trong LAN (vd test tu dien thoai) thi thu:
 *   node server/src/index.js --port 4000 --host 0.0.0.0
 */
function resolveHost() {
  const i = process.argv.lastIndexOf('--host')
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  return process.env.API_HOST ?? '127.0.0.1'
}

const HOST = resolveHost()

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

/**
 * Tieng Viet co dau => ep UTF-8 cho response JSON.
 *
 * Chi ap cho '/api', KHONG ap toan bo app: express bo qua viec set Content-Type
 * neu header da co san, nen neu ap tat ca thi file tinh (html/css/js) se bi gan
 * nhan application/json va trinh duyet khong render duoc.
 */
app.use('/api', (_req, res, next) => {
  res.set('Content-Type', 'application/json; charset=utf-8')
  next()
})

const ok = (res, data) => res.json({ ok: true, data })
const fail = (res, code, message) => res.status(code).json({ ok: false, message })

/* ---------------------------------------------------------------------
   Validate dau vao. Client da validate roi nhung server khong duoc tin client.
   --------------------------------------------------------------------- */
/**
 * `buyingIntent` la truong BAT BUOC theo tai lieu: cung voi doanh nghiep/nganh
 * va van de kinh doanh, ba nhom nay chiem 70/100 diem. Thieu thi khong cham
 * diem co y nghia duoc.
 *
 * `decisionRole` thuoc nhom "nen co" - khong bat buoc, thieu thi scoring.js
 * gan vao `missingFields` thay vi suy doan.
 */
const REQUIRED_TEXT = [
  'fullName',
  'companyName',
  'email',
  'phone',
  'region',
  'industry',
  'companySize',
  'buyingIntent',
]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(body) {
  if (typeof body !== 'object' || body === null) return 'Body phải là JSON object'

  for (const key of REQUIRED_TEXT) {
    if (typeof body[key] !== 'string' || body[key].trim() === '') {
      return `Thiếu trường bắt buộc: ${key}`
    }
  }
  if (!EMAIL_RE.test(body.email.trim())) return 'Email không đúng định dạng'
  if (typeof body.painPoint !== 'string' || body.painPoint.trim().length < 20) {
    return 'Trường painPoint cần ít nhất 20 ký tự'
  }
  if (!Array.isArray(body.goals) || body.goals.length === 0) {
    return 'Cần chọn ít nhất 1 mục tiêu (goals)'
  }
  return null
}

/** Chuan hoa: chan field la, ep array ve dung kieu. */
function normalize(body) {
  const str = (v) => (typeof v === 'string' ? v.trim() : '')
  const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
  return {
    fullName: str(body.fullName),
    companyName: str(body.companyName),
    email: str(body.email),
    phone: str(body.phone),
    region: str(body.region),
    industry: str(body.industry),
    companySize: str(body.companySize),
    monthlyRevenue: str(body.monthlyRevenue),
    currentChannels: list(body.currentChannels),
    goals: list(body.goals),
    budget: str(body.budget),
    timeline: str(body.timeline),
    painPoint: str(body.painPoint),
    buyingIntent: str(body.buyingIntent),
    decisionRole: str(body.decisionRole),
  }
}

/* ---------------------------------------------------------------------
   Routes
   --------------------------------------------------------------------- */

app.get('/api/health', (_req, res) =>
  ok(res, { status: 'up', leads: listLeads().length, sessions: sessionCount() }),
)

/* ---------------------------------------------------------------------
   Auth khu vuc noi bo
   --------------------------------------------------------------------- */
app.post('/api/internal/login', (req, res) => {
  const result = login(req.body?.password)
  if (!result) return fail(res, 401, 'Mật khẩu không đúng.')
  return ok(res, result)
})

app.post('/api/internal/logout', (req, res) => {
  const m = /^Bearer\s+(.+)$/i.exec(req.get('authorization')?.trim() ?? '')
  if (m) logout(m[1])
  return ok(res, { done: true })
})

/**
 * Bo khoang chi phi khoi du lieu gui ra ngoai.
 *
 * Never List dieu 5: agent khong duoc neu bat ky con so chi phi nao voi khach.
 * Spec tool cung ghi ro: search_product_catalog "khong gom gia".
 * Nhan su noi bo van xem duoc qua /api/internal/analyze - ho la nguoi bao gia.
 *
 * Cat o tang server chu khong phai an tren UI: cung bai hoc voi vu
 * `qualification` truoc day nam trong response ma man 2 khong hien thi.
 */
function stripCost(solutions) {
  return solutions.map((s) => ({
    ...s,
    estimate: { setupWeeks: s.estimate.setupWeeks },
  }))
}

/** Man 1 -> Man 2, dong thoi tao lead cho Man 3 */
app.post('/api/analyze', (req, res) => {
  const problem = validate(req.body)
  if (problem) return fail(res, 400, problem)

  const input = normalize(req.body)

  try {
    const result = analyze(input)
    // Cung doanh nghiep gui lai thi CAP NHAT lead cu, khong tao ban trung
    const { lead, created } = upsertLead(toLead(input, result, undefined, 'sme_self'))

    /**
     * KHONG tra `qualification` ve day.
     *
     * Endpoint nay phuc vu man SME (Actor 1). Diem qualification, phan loai
     * Lead/MQL/SQL candidate va cong thuc 6 thanh phan la du lieu NOI BO -
     * Never List dieu 11 cam lo "quy tac cham diem, nguong phan loai".
     *
     * Truoc day cac truong nay nam trong response: man 2 khong hien thi nhung
     * mo DevTools la doc duoc, va SME biet nguong thi dien lai form cho khop
     * de duoc sales goi.
     *
     * Nhan su Zalo doc qualification qua GET /api/leads (man dashboard).
     */
    return ok(res, {
      id: lead.id,
      createdAt: lead.createdAt,
      isReturning: !created,
      submissions: lead.submissions,
      input,
      solutions: stripCost(result.solutions),
      summary: result.summary,
      roadmap: result.roadmap,
    })
  } catch (e) {
    console.error('[analyze] lỗi:', e)
    return fail(res, 500, 'Agent gặp lỗi khi phân tích. Thử lại giúp mình nhé.')
  }
})

/* ---------------------------------------------------------------------
   Luong chat tu van — cua truoc dang hoi thoai, cong khai nhu man SME.

   Phan cong: LLM hoi chuyen va trich xuat, CODE quyet dinh du chua va cham diem.
   LLM khong bao gio tu ket luan khach la SQL candidate.
   --------------------------------------------------------------------- */

/** Mot luot hoi thoai. */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body ?? {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return fail(res, 400, 'Cần mảng `messages` với ít nhất một tin nhắn.')
  }
  if (messages.length > 60) return fail(res, 400, 'Hội thoại quá dài.')

  try {
    const r = await reply(messages)
    return ok(res, r)
  } catch (e) {
    if (e instanceof LlmError) {
      console.warn('[chat] LLM lỗi:', e.message)
      return fail(res, 503, 'Trợ lý đang không phản hồi được. Thử lại sau ít giây giúp mình nhé.')
    }
    console.error('[chat] lỗi:', e)
    return fail(res, 500, 'Có lỗi khi xử lý hội thoại.')
  }
})

/**
 * Trich xuat thong tin da thu duoc tu hoi thoai.
 *
 * Tra ve { collected, missing, ready }. Client dung `missing` de biet con thieu
 * gi, va CHI khi ready moi cho bam xem ket qua. Viec quyet dinh "du chua" nam o
 * code (danh sach REQUIRED trong chat.js), khong de LLM tu phan xu.
 */
app.post('/api/chat/extract', async (req, res) => {
  const { messages } = req.body ?? {}
  if (!Array.isArray(messages)) return fail(res, 400, 'Cần mảng `messages`.')

  try {
    return ok(res, await extract(messages))
  } catch (e) {
    console.error('[chat/extract] lỗi:', e)
    return fail(res, 500, 'Không rút được thông tin từ hội thoại.')
  }
})

/**
 * Cung engine, nhung danh cho nhan su Zalo nhap ho khach (man /advisor).
 *
 * Khac /api/analyze o ba diem:
 *  - Tra ve `qualification` day du (diem, phan loai, breakdown 6 thanh phan)
 *  - Giu khoang chi phi trong `estimate` de account bao gia nhat quan
 *  - Lead duoc danh dau `source: 'internal_advisor'` => khong lam loang metric
 *    "ty le hoi thoai hoan chinh thanh SQL" cua tai lieu
 */
app.post('/api/internal/analyze', requireInternal, (req, res) => {
  const problem = validate(req.body)
  if (problem) return fail(res, 400, problem)

  const input = normalize(req.body)

  try {
    const result = analyze(input)
    const { lead, created } = upsertLead(toLead(input, result, undefined, 'internal_advisor'))

    return ok(res, {
      id: lead.id,
      isReturning: !created,
      submissions: lead.submissions,
      createdAt: lead.createdAt,
      input,
      solutions: result.solutions,
      summary: result.summary,
      roadmap: result.roadmap,
      qualification: result.qualification,
    })
  } catch (e) {
    console.error('[internal/analyze] lỗi:', e)
    return fail(res, 500, 'Agent gặp lỗi khi phân tích.')
  }
})

/** Man 3 — toan bo khu vuc lead la noi bo */
app.get('/api/leads', requireInternal, (_req, res) => ok(res, listLeads()))

/**
 * Chuyen trang thai lead — nguyen tac "agent de xuat, account quyet dinh"
 * duoc cuong che o day.
 *
 * Tu choi hai loai yeu cau:
 *   403 — dat phan loai cua agent (LEAD/MQL/SQL_CANDIDATE). Do la ket qua
 *         tinh tu diem, khong ai set duoc, ke ca nhan su noi bo.
 *   409 — nhay buoc, dien hinh la NEW -> QUALIFIED (bo qua SAL).
 *
 * Endpoint cu `PATCH /api/leads/:id` da bo: no nhan bat ky chuoi nao trong
 * danh sach cung va khong kiem thu tu, tuc la khong cuong che gi ca.
 */
app.post('/api/leads/:id/transition', requireInternal, (req, res) => {
  const { to, note } = req.body ?? {}
  const result = transition(req.params.id, to, note)

  if (!result.ok) return fail(res, result.code, result.message)
  return ok(res, result.lead)
})

/**
 * Sinh "cau mo dau goi y cho account" bang LLM.
 *
 * Day la CHO DUY NHAT trong app goi model. Phan cong ro rang:
 *   rule engine tinh diem va chon giai phap  ->  model chi dien dat lai
 *
 * Sinh theo yeu cau chu khong tu dong luc tao lead: khong lam cham form SME,
 * va account chu dong quyet dinh khi nao tieu token.
 *
 * Da co roi thi tra ban cu (khong goi lai model) tru khi ?regenerate=1.
 */
app.post('/api/leads/:id/opening-line', requireInternal, async (req, res) => {
  const lead = listLeads().find((l) => l.id === req.params.id)
  if (!lead) return fail(res, 404, 'Không tìm thấy lead.')

  const regenerate = req.query.regenerate === '1' || req.body?.regenerate === true
  if (lead.openingLine && !regenerate) {
    return ok(res, { ...lead.openingLine, cached: true })
  }

  try {
    const result = await generateOpeningLine(lead)
    setOpeningLine(lead.id, result)
    return ok(res, { ...result, cached: false })
  } catch (e) {
    console.error('[opening-line] lỗi:', e)
    return fail(res, 500, 'Không sinh được câu mở đầu.')
  }
})

/** Cho client biet nhan nut nao va y nghia tung trang thai. */
app.get('/api/lead-statuses', requireInternal, (_req, res) =>
  ok(res, { statuses: HUMAN_STATUSES, transitions: TRANSITIONS }),
)

/** Reset ve 4 lead mau - tien khi chay lai demo nhieu lan. Xoa du lieu nen phai auth. */
app.post('/api/leads/reset', requireInternal, (_req, res) => ok(res, reset()))

/* ---------------------------------------------------------------------
   Phuc vu ban build cua client (neu da chay `npm run build`).

   Vi sao can: duong dan '/api' trong client chi hoat dong nho proxy cua Vite,
   ma proxy la tinh nang cua dev server — khong co trong `dist`. Neu deploy
   `dist` len host tinh rieng thi moi loi goi API se 404.
   De server nay phuc vu luon file tinh => client va API cung mot origin,
   deploy 1 service duy nhat (Render/Railway) la chay.
   --------------------------------------------------------------------- */
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist')
const hasBuild = existsSync(join(DIST, 'index.html'))

if (hasBuild) {
  app.use(express.static(DIST))

  // SPA fallback: moi duong dan khong phai /api deu tra ve index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(DIST, 'index.html')))
}

// Den day thi chi con /api khong khop route nao, hoac chua co ban build
app.use((_req, res) => fail(res, 404, 'Endpoint không tồn tại'))

load()

const server = app.listen(PORT, HOST, () => {
  console.log(`\n  Zalo Copilot API  ->  http://localhost:${PORT}/api/health`)
  if (hasBuild) console.log(`  Web (bản build)   ->  http://localhost:${PORT}`)
  else console.log('  Chưa có client/dist — chạy `npm run build` nếu muốn server phục vụ web luôn')
  console.log(`  Bind              ->  ${HOST}:${PORT}${HOST === '127.0.0.1' ? ' (chỉ trong máy)' : ' (mở ra ngoài)'}`)
  console.log(`  Đã nạp ${listLeads().length} lead`)
  const p = systemPromptInfo()
  console.log(
    llmConfigured()
      ? `  LLM               ->  ${modelName()}` +
          (p ? ` · prompt chat ${(p.bytes / 1024).toFixed(1)} KB` : ' · CHƯA có prompt chat')
      : '  LLM               ->  chưa cấu hình FPT_API_KEY, câu mở đầu dùng mẫu dựng sẵn',
  )
  if (llmConfigured() && !p) {
    console.log('    ⚠ Thiếu prompts/bot-prompt-full.txt — chạy: node scripts/build-bot-prompt.mjs')
  }
  if (usingDefaultPassword) {
    console.log('  ⚠ Khu vực nội bộ đang dùng mật khẩu mặc định.')
    console.log('    Đặt INTERNAL_PASSWORD trong .env để đổi.')
  }
  console.log('')
})

// Cong bi chiem la loi thuong gap nhat (quen tat `npm run dev` o cua so khac).
// Bao thanh mot dong doc duoc thay vi de Node in stack trace 20 dong.
server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err

  console.error(`\n  Cổng ${PORT} đang bị chiếm.`)
  console.error('  Thường là do `npm run dev` vẫn chạy ở cửa sổ khác — tắt cửa sổ đó rồi thử lại.')
  console.error(`  Hoặc dùng cổng khác:  npm run start -- --port ${PORT + 1}\n`)
  process.exit(1)
})
