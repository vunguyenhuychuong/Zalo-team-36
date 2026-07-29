import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyze } from './scoring.js'
import { DEFAULT_STATUS, checkTransition } from './leadStatus.js'
import { stamp } from './version.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'leads.json')

/** Lead giu trong bo nho, ghi de xuong file de mat server giua buoi demo khong mat data. */
let leads = []

/* ---------------------------------------------------------------------
   Du lieu mau: 3 doanh nghiep trong wireframe. Chay qua dung engine that
   nen con so hoan toan giai thich duoc, khong phai so hardcode.
   --------------------------------------------------------------------- */
const SEED_INPUTS = [
  {
    fullName: 'Nguyễn Thị Lá',
    companyName: 'Quán cà phê Lá',
    email: 'la@cafela.vn',
    phone: '0905123456',
    region: 'south',
    industry: 'fnb',
    companySize: 'micro',
    monthlyRevenue: 'r1',
    currentChannels: ['facebook', 'offline'],
    goals: ['care', 'loyalty', 'order'],
    budget: 'b2',
    timeline: 't3',
    buyingIntent: 'callback',
    decisionRole: 'owner',
    painPoint:
      'Khách quen hay đặt bàn qua tin nhắn Facebook nhưng bên em bỏ sót nhiều, tới giờ cao điểm không ai trả lời. Em cũng muốn có thẻ tích điểm cho khách quay lại mà chưa biết làm kiểu gì cho gọn.',
  },
  {
    fullName: 'Trần Mai Anh',
    companyName: 'Shop Mai Anh',
    email: 'maianh.shop@gmail.com',
    phone: '0912345678',
    region: 'north',
    industry: 'retail',
    companySize: 'micro',
    monthlyRevenue: 'r0',
    currentChannels: ['facebook'],
    goals: ['sales'],
    budget: 'b0',
    timeline: 't0',
    // Ca "Lead": mo ta so sai, chi 1 muc tieu, chua co y dinh mua, nhan vien
    // duoc giao tim hieu => diem thap, chua dang tieu nguon luc sales.
    buyingIntent: 'exploring',
    decisionRole: 'staff',
    painPoint: 'Mình bán quần áo online, muốn tìm hiểu Zalo thử.',
  },
  {
    // Lead nay co chu dich roi vao nhom "Nuoi duong": tiem nang cao nhung
    // ngan sach va moc thoi gian con xa => dashboard phu du 3 muc hanh dong.
    fullName: 'Phạm Hương',
    companyName: 'Spa Hương Sen',
    email: 'huong@spahuongsen.vn',
    phone: '0977456123',
    region: 'central',
    industry: 'beauty',
    companySize: 'small',
    monthlyRevenue: 'r1',
    currentChannels: ['facebook', 'pos'],
    goals: ['care', 'loyalty', 'order'],
    budget: 'b1',
    timeline: 't1',
    // Ca dang chu y nhat cho demo: du diem >= 70 nhung BI CHAN o cong SQL
    // candidate vi chi dang so sanh nha cung cap, chua yeu cau demo/bao gia/
    // goi lai. Minh hoa Never List dieu 10 - khong day len cho du chi tieu.
    buyingIntent: 'comparing',
    decisionRole: 'manager',
    painPoint:
      'Spa có 3 chi nhánh, khách đặt lịch qua điện thoại và Facebook nên hay trùng giờ giữa các cơ sở. Muốn khách tự chọn được giờ trống và nhớ lịch của mình, nhưng năm nay ngân sách còn hạn chế.',
  },
  {
    fullName: 'Lê Văn Bình',
    companyName: 'Xưởng may Bình Minh',
    email: 'binh@binhminhgarment.com.vn',
    phone: '0938777666',
    region: 'south',
    industry: 'manufacture',
    companySize: 'small',
    monthlyRevenue: 'r2',
    currentChannels: ['website', 'pos', 'zalo_oa'],
    goals: ['order', 'notify', 'cost', 'data'],
    budget: 'b3',
    timeline: 't2',
    buyingIntent: 'quote',
    decisionRole: 'owner',
    painPoint:
      'Xưởng có gần 40 đại lý đặt hàng qua điện thoại và Zalo cá nhân của nhân viên, đơn ghi tay nên hay sai số lượng. Cần một cổng để đại lý tự đặt và tự tra công nợ, đồng thời tự động nhắn xác nhận đơn.',
  },
]

let counter = 0

function newId(prefix) {
  counter += 1
  const stamp = Date.now().toString(36).slice(-5)
  return `${prefix}-${stamp}${counter.toString().padStart(2, '0')}`.toUpperCase()
}

/**
 * Ep ve Lead record de hien tren dashboard.
 *
 * `source` phan biet SME tu nhap voi nhan su Zalo nhap ho. Can thiet vi metric
 * chinh cua tai lieu la "ty le hoi thoai hoan chinh tro thanh SQL duoc account
 * xac nhan" — tron lead do chinh account tao vao thi con so mat y nghia.
 */
export function toLead(input, result, createdAt = new Date().toISOString(), source = 'sme_self') {
  const top = result.solutions[0]
  return {
    id: newId('LEAD'),
    createdAt,
    source,
    companyName: input.companyName,
    contactName: input.fullName,
    phone: input.phone,
    email: input.email,
    industry: input.industry,
    companySize: input.companySize,
    region: input.region,
    painPoint: input.painPoint,
    topSolution: top.name,
    topScore: top.score,
    qualification: result.qualification,

    /**
     * Cau mo dau goi y cho account — field cuoi trong ban ban giao cua tai lieu.
     * Sinh theo yeu cau (khong tu dong luc tao lead) de khong lam cham form SME
     * va de account chu dong quyet dinh khi nao tieu token.
     */
    openingLine: null,

    /**
     * Bo rule va prompt da dung de cham lead nay. Tai lieu yeu cau config
     * versioned; khong co no thi khong tra loi duoc "lead nay cham bang gi".
     */
    ...stamp(),

    /** Trang thai do account quyet dinh. Agent luon ban giao o muc NEW. */
    status: DEFAULT_STATUS,
    /**
     * Nhat ky chuyen trang thai. Tai lieu yeu cau "moi lan chuyen trang thai
     * deu ghi lai ai/agent nao doi va khi nao, de do ty le account chap nhan
     * phan loai cua agent".
     */
    history: [],
  }
}

/**
 * Trang thai ban dau cua tung lead mau, de dashboard the hien duoc ca vong doi
 * chu khong phai toan bo dung o NEW.
 */
const SEED_STATUS = {
  'Quán cà phê Lá': { to: 'ACCEPTED', note: 'Đã đọc bản bàn giao, nhận về đội SME miền Nam.' },
  'Spa Hương Sen': { to: 'NURTURING', note: 'Chờ khách chốt ngân sách năm sau, hẹn kiểm tra lại tháng 10.' },
}

function seed() {
  // Lui ngay tao cua seed ve truoc de danh sach nhin nhu da chay mot thoi gian
  const now = Date.now()
  // Gan them submissions/updatedAt nhu upsertLead lam, khong thi seed thieu
  // hai truong nay va type `Lead` noi doi (khai bao la bat buoc).
  leads = SEED_INPUTS.map((input, i) => {
    const createdAt = new Date(now - (i + 1) * 3600_000 * 7).toISOString()
    return { ...toLead(input, analyze(input), createdAt), submissions: 1, updatedAt: createdAt }
  })

  // Chay qua dung ham transition() de history hop le, khong gan tay
  for (const lead of leads) {
    const step = SEED_STATUS[lead.companyName]
    if (step) transition(lead.id, step.to, step.note)
  }
}

export function load() {
  try {
    if (existsSync(DATA_FILE)) {
      const parsed = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
      if (Array.isArray(parsed) && parsed.length) {
        leads = parsed
        return
      }
    }
  } catch (e) {
    console.warn('[store] Không đọc được leads.json, dùng dữ liệu mẫu:', e.message)
  }
  seed()
  persist()
}

function persist() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8')
  } catch (e) {
    // Khong ghi duoc file thi van chay bang bo nho, khong nen lam sap request
    console.warn('[store] Không ghi được leads.json:', e.message)
  }
}

/** Chuan hoa de so khop: email khong phan biet hoa thuong, sdt chi giu chu so. */
const normEmail = (s) => String(s ?? '').trim().toLowerCase()
const normPhone = (s) => String(s ?? '').replace(/\D/g, '')

/**
 * Tim lead cua cung mot doanh nghiep. Khop email HOAC so dien thoai la du —
 * khach quay lai co the go email khac nhung dung so cu, hoac nguoc lai.
 */
function findExisting(input) {
  const email = normEmail(input.email)
  const phone = normPhone(input.phone)
  return leads.find(
    (l) =>
      (email && normEmail(l.email) === email) || (phone && phone.length >= 9 && normPhone(l.phone) === phone),
  )
}

/**
 * Tao lead moi, HOAC cap nhat lead cu neu cung doanh nghiep gui lai.
 *
 * Tai lieu yeu cau ro: "Neu mot hoi thoai da ket thuc duoc mo lai (khach quay
 * lai sau vai ngay)... ban ban giao duoc CAP NHAT thay vi tao moi, de account
 * khong nhan hai ban trung cho cung mot lead."
 *
 * Giu nguyen nhung gi thuoc quyet dinh cua ACCOUNT (status, history) — khach
 * gui lai khong duoc phep reset viec account da xu ly. Xoa `openingLine` vi no
 * sinh ra tu painPoint va giai phap cu, gio hai thu do da doi.
 */
export function upsertLead(lead) {
  const existing = findExisting(lead)

  if (!existing) {
    leads.unshift({ ...lead, submissions: 1, updatedAt: lead.createdAt })
    persist()
    return { lead: leads[0], created: true }
  }

  Object.assign(existing, {
    // Du lieu moi tu lan gui nay
    companyName: lead.companyName,
    contactName: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    industry: lead.industry,
    companySize: lead.companySize,
    region: lead.region,
    painPoint: lead.painPoint,
    topSolution: lead.topSolution,
    topScore: lead.topScore,
    qualification: lead.qualification,
    source: lead.source,
    // Cham lai bang bo rule hien tai, nen dong lai version moi
    ...stamp(),

    // Meta
    updatedAt: new Date().toISOString(),
    submissions: (existing.submissions ?? 1) + 1,

    // Cau mo dau cu da lac hau vi painPoint va giai phap vua doi
    openingLine: null,

    // KHONG dung tay vao: createdAt, status, history
  })

  persist()
  return { lead: existing, created: false }
}

/** Giu lai cho seed — luon tao moi, khong can so khop. */
export function addLead(lead) {
  leads.unshift({ ...lead, submissions: 1, updatedAt: lead.createdAt })
  persist()
  return leads[0]
}

export function listLeads() {
  return leads
}

/**
 * Chuyen trang thai lead. Chi nhan trang thai thuoc quyen account.
 *
 * Tra ve { ok: false, code, message } neu bi tu choi — route dich thang sang
 * HTTP status. Quy tac nam o leadStatus.js chu khong rai trong ham nay, de
 * kiem thu duoc doc lap.
 */
export function transition(id, to, note = '') {
  const lead = leads.find((l) => l.id === id)
  if (!lead) return { ok: false, code: 404, message: 'Không tìm thấy lead.' }

  const check = checkTransition(lead.status, to)
  if (!check.ok) return check

  const from = lead.status
  lead.status = to
  lead.history.push({
    at: new Date().toISOString(),
    from,
    to,
    // Chua co danh tinh nguoi dung (mat khau dung chung cho ca team).
    // Ghi 'internal' de it nhat phan biet duoc voi thay doi do he thong.
    by: 'internal',
    note: typeof note === 'string' ? note.slice(0, 500) : '',
    // Chot lai phan loai cua agent tai thoi diem chuyen, de sau nay do duoc
    // "ty le account chap nhan phan loai cua agent" ma khong bi anh huong neu
    // rule scoring thay doi.
    agentSaid: lead.qualification?.classification ?? null,
  })

  persist()
  return { ok: true, lead }
}

/** Gan cau mo dau da sinh vao lead va ghi xuong file. */
export function setOpeningLine(id, openingLine) {
  const lead = leads.find((l) => l.id === id)
  if (!lead) return null
  lead.openingLine = openingLine
  persist()
  return lead
}

/** Dung khi muon reset ve dung 3 lead mau truoc luc demo. */
export function reset() {
  counter = 0
  seed()
  persist()
  return leads
}
