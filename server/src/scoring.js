import { SOLUTIONS, useCasesFor } from './catalog.js'

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)))
const has = (arr, v) => Array.isArray(arr) && arr.includes(v)

const INDUSTRY_NAME = {
  fnb: 'F&B',
  retail: 'bán lẻ',
  beauty: 'làm đẹp',
  health: 'y tế',
  education: 'giáo dục',
  travel: 'du lịch',
  realestate: 'bất động sản',
  finance: 'tài chính',
  manufacture: 'sản xuất – phân phối',
  service: 'dịch vụ',
}

const GOAL_NAME = {
  sales: 'tăng doanh số online',
  care: 'chăm sóc khách hàng',
  loyalty: 'giữ chân khách cũ',
  order: 'cho khách tự đặt hàng / đặt lịch',
  notify: 'tự động gửi thông báo',
  cost: 'giảm chi phí vận hành',
  brand: 'xây kênh chính danh',
  data: 'thu thập dữ liệu khách hàng',
}

/* =====================================================================
   1. Cham diem tung giai phap
   ===================================================================== */
function tierOf(score) {
  if (score >= 75) return 'core'
  if (score >= 50) return 'support'
  return 'later'
}

function scoreSolution(sol, input) {
  let score = sol.base
  const reasons = []
  const notes = []

  for (const rule of sol.rules) {
    let matched = false
    try {
      matched = rule.when(input)
    } catch {
      matched = false // rule loi thi coi nhu khong khop, khong lam sap request
    }
    if (!matched) continue

    score += rule.points
    if (rule.points > 0 && rule.reason) reasons.push(rule.reason)
    if (rule.points < 0 && rule.note) notes.push(rule.note)
  }

  /**
   * Tran 97 chu khong phai 100.
   *
   * Tong rule cua vai nganh vuot 100 (vd nha khoa: OA cong toi 106) roi bi cat
   * xuong dung 100 — doc ra thanh "phu hop tuyet doi", ma mot agent tu van thi
   * khong bao gio nen tuyen bo nhu vay. Con so tron 100 cung la dau hieu dien
   * hinh cua diem bia ra.
   */
  const final = clamp(score, 0, 97)

  return {
    id: sol.id,
    name: sol.name,
    tagline: sol.tagline,
    score: final,
    tier: tierOf(final),
    reasons: reasons.slice(0, 4),
    notes,
    useCases: useCasesFor(sol.id, input.industry),
    estimate: sol.estimate,
    cta: sol.cta,
  }
}

/* =====================================================================
   2. Qualification — mo hinh 100 diem

   Sau thanh phan va diem toi da lay nguyen tu bang trong tai lieu:

     Muc do phu hop voi san pham va ICP ........ 25
     Van de kinh doanh ro rang ................. 25
     Buying intent ............................. 20
     Thoi gian trien khai ...................... 15
     Vai tro va quy trinh quyet dinh ........... 10
     Muc do san sang ve du lieu/ky thuat ....... 5
                                          Tong = 100

   Nguong: <40 Lead | 40-69 MQL | >=70 SQL candidate.

   Luu y ve ngan sach: mo hinh nay KHONG co thanh phan ngan sach. Field
   `budget` van thu thap (doc xep vao nhom du lieu "muc do san sang") nhung
   khong con trong so rieng trong diem qualification.

   Moi thanh phan tra ve kem `detail` de nhan su doc duoc vi sao ra so do.
   ===================================================================== */

const HIGH_FIT_INDUSTRIES = ['fnb', 'retail', 'beauty', 'health', 'education', 'travel']
const MID_FIT_INDUSTRIES = ['realestate', 'finance', 'service']

/** Buying intent -> diem (max 20). demo/quote/callback la tin hieu san sang ban. */
const INTENT_POINTS = { exploring: 3, comparing: 8, demo: 15, quote: 20, callback: 20 }
const INTENT_LABEL = {
  exploring: 'Mới tìm hiểu',
  comparing: 'Đang so sánh nhà cung cấp',
  demo: 'Muốn xem demo',
  quote: 'Cần báo giá',
  callback: 'Muốn được gọi lại',
}
/** Nhung intent duoc coi la "mot hanh dong ban hang cu the" (dieu kien cong SQL candidate) */
const SALES_ACTION_INTENTS = ['demo', 'quote', 'callback']

/** Vai tro -> diem (max 10) */
const ROLE_POINTS = { owner: 10, manager: 7, staff: 3 }
const ROLE_LABEL = {
  owner: 'Chủ doanh nghiệp, tự quyết định',
  manager: 'Quản lý, tham gia quyết định',
  staff: 'Nhân viên được giao tìm hiểu',
}

/** Thoi gian trien khai -> diem (max 15) */
const TIMELINE_POINTS = { t0: 2, t1: 6, t2: 11, t3: 15 }
const TIMELINE_LABEL = {
  t0: 'Chưa có kế hoạch thời gian',
  t1: 'Dự kiến 3 – 6 tháng',
  t2: 'Dự kiến 1 – 3 tháng',
  t3: 'Muốn triển khai ngay tháng này',
}

function componentFit(input, solutions) {
  const top = solutions[0]
  let earned = 0
  const why = []

  // Do khop cua giai phap dan dau (max 15)
  const s = top?.score ?? 0
  if (s >= 85) { earned += 15; why.push(`${top.name} đạt ${s}% phù hợp`) }
  else if (s >= 75) { earned += 12; why.push(`${top.name} đạt ${s}%`) }
  else if (s >= 60) { earned += 9; why.push(`${top.name} đạt ${s}%, chưa nổi trội`) }
  else if (s >= 50) { earned += 6; why.push(`Giải pháp dẫn đầu chỉ ${s}%`) }
  else { earned += 3; why.push(`Không giải pháp nào vượt 50%`) }

  // Nganh co nam trong ICP Zalo uu tien (max 10)
  const ind = INDUSTRY_NAME[input.industry] ?? 'ngành khác'
  if (HIGH_FIT_INDUSTRIES.includes(input.industry)) { earned += 10; why.push(`${ind} thuộc nhóm ICP Zalo ưu tiên`) }
  else if (MID_FIT_INDUSTRIES.includes(input.industry)) { earned += 6; why.push(`${ind} phù hợp mức trung bình`) }
  else { earned += 3; why.push(`${ind} nằm ngoài nhóm ICP chính`) }

  return { key: 'fit', label: 'Phù hợp sản phẩm và ICP', earned, max: 25, detail: why.join('. ') + '.' }
}

function componentProblem(input) {
  let earned = 0
  const why = []

  // So muc tieu khach chon (max 13)
  const n = input.goals?.length ?? 0
  if (n >= 3) { earned += 13; why.push(`Nêu ${n} mục tiêu cụ thể`) }
  else if (n === 2) { earned += 10; why.push('Nêu 2 mục tiêu') }
  else if (n === 1) { earned += 6; why.push('Chỉ nêu 1 mục tiêu') }
  else { why.push('Chưa nêu mục tiêu nào') }

  // Do chi tiet cua phan mo ta van de (max 8)
  // Do dai chi la proxy cho "do ro rang" - tho, nhung kiem thu duoc va
  // khong phu thuoc vao suy dien cua model.
  const len = (input.painPoint ?? '').trim().length
  if (len >= 150) { earned += 8; why.push('Mô tả vấn đề chi tiết') }
  else if (len >= 80) { earned += 6; why.push('Mô tả vấn đề tương đối rõ') }
  else if (len >= 40) { earned += 4; why.push('Mô tả vấn đề còn ngắn') }
  else if (len > 0) { earned += 2; why.push('Mô tả vấn đề rất ngắn') }

  // Co so lieu cu the trong mo ta (max 4)
  if (/\d/.test(input.painPoint ?? '')) { earned += 4; why.push('Có số liệu cụ thể trong mô tả') }

  return { key: 'problem', label: 'Vấn đề kinh doanh rõ ràng', earned, max: 25, detail: why.join('. ') + '.' }
}

function componentIntent(input) {
  const earned = INTENT_POINTS[input.buyingIntent] ?? 0
  const label = INTENT_LABEL[input.buyingIntent] ?? 'Chưa xác định ý định'
  return { key: 'intent', label: 'Buying intent', earned, max: 20, detail: label + '.' }
}

function componentTimeline(input) {
  const earned = TIMELINE_POINTS[input.timeline] ?? 0
  const label = TIMELINE_LABEL[input.timeline] ?? 'Chưa cho biết thời gian triển khai'
  return { key: 'timeline', label: 'Thời gian triển khai', earned, max: 15, detail: label + '.' }
}

function componentRole(input) {
  const earned = ROLE_POINTS[input.decisionRole] ?? 0
  const label = ROLE_LABEL[input.decisionRole] ?? 'Chưa biết vai trò người trả lời'
  return { key: 'role', label: 'Vai trò và quy trình quyết định', earned, max: 10, detail: label + '.' }
}

function componentReadiness(input) {
  let earned = 0
  const why = []
  if (has(input.currentChannels, 'zalo_oa')) { earned += 2; why.push('đã có Zalo OA') }
  if (has(input.currentChannels, 'pos')) { earned += 2; why.push('đã dùng POS/phần mềm bán hàng') }
  if (has(input.currentChannels, 'website') || has(input.currentChannels, 'ecom')) {
    earned += 1
    why.push('đã bán online')
  }
  earned = Math.min(5, earned)

  const detail = why.length
    ? 'Hạ tầng sẵn có: ' + why.join(', ') + '.'
    : 'Chưa có hạ tầng số nào để nối vào — cần hỗ trợ nhiều hơn khi triển khai.'

  return { key: 'readiness', label: 'Sẵn sàng dữ liệu và kỹ thuật', earned, max: 5, detail }
}

function computeQualification(input, solutions) {
  const components = [
    componentFit(input, solutions),
    componentProblem(input),
    componentIntent(input),
    componentTimeline(input),
    componentRole(input),
    componentReadiness(input),
  ]

  const score = clamp(components.reduce((sum, c) => sum + c.earned, 0))

  /* ---------- Truong "nen co" con thieu ----------
     Doc: thieu thi GAN CO, khong duoc suy doan de lap cho trong. */
  const missingFields = []
  if (!input.decisionRole) missingFields.push('Vai trò / người ra quyết định')
  if (!input.timeline) missingFields.push('Thời gian dự kiến triển khai')
  if (!input.budget || input.budget === 'b0') missingFields.push('Ngân sách dự kiến')
  if (!input.monthlyRevenue || input.monthlyRevenue === 'unknown') missingFields.push('Quy mô doanh thu')

  /* ---------- Dieu kien cong de len SQL candidate ----------
     Doc: "Tu 70: SQL candidate, nhung CHI KHI da co nhu cau ro, thoi gian du
     kien va mot hanh dong ban hang cu the."
     Never List dieu 10: khong day len SQL candidate chi de dat chi tieu. */
  const gateBlocks = []
  if (!SALES_ACTION_INTENTS.includes(input.buyingIntent)) {
    gateBlocks.push('Chưa có hành động bán hàng cụ thể (chưa yêu cầu demo, báo giá hay gọi lại)')
  }
  if (!input.timeline || input.timeline === 't0') {
    gateBlocks.push('Chưa có mốc thời gian triển khai dự kiến')
  }
  const problem = components.find((c) => c.key === 'problem')
  if (problem.earned < 15) {
    gateBlocks.push('Vấn đề kinh doanh chưa đủ rõ để bàn giao cho sales')
  }

  /* ---------- Phan loai ----------
     Agent chi duoc de xuat toi muc SQL_CANDIDATE. SAL va SQL chinh thuc do
     account xac nhan — cuong che o tang API, khong phai o day. */
  /**
   * San cho MQL: tai lieu dinh nghia MQL la "co nhu cau RO", con Lead la "chi
   * hoi chung, chua ro doanh nghiep, nhu cau hoac use case".
   *
   * Chi dua vao nguong 40 diem thi mot khach ho hang van len duoc MQL nho diem
   * nganh va diem vai tro — vd tap hoa chi viet "nghe noi ban tren Zalo duoc,
   * muon tim hieu xem sao" van duoc 44. Dua vao nurture la lang phi.
   *
   * Doi xung voi cong SQL candidate: dat dinh nghia len tren con so.
   */
  const MQL_MIN_PROBLEM = 12
  const problemTooVague = problem.earned < MQL_MIN_PROBLEM

  let classification, classificationLabel, tone, nextAction

  if (score >= 70 && gateBlocks.length === 0) {
    classification = 'SQL_CANDIDATE'
    classificationLabel = 'SQL candidate'
    tone = 'hot'
    nextAction = {
      label: 'Chuyển ngay cho account',
      detail:
        'Đủ điểm và hội đủ điều kiện cộng. Đưa vào hàng đợi account kèm bản bàn giao. Account xác nhận thì mới lên SAL.',
    }
  } else if (score >= 40 && !problemTooVague) {
    classification = 'MQL'
    classificationLabel = 'MQL'
    tone = 'warm'
    nextAction = {
      label: 'Nuôi dưỡng',
      // Khong nhac lai ly do bi chan o day - da co muc rieng ngay ben duoi.
      // Cho o day la viec CAN LAM de lead nay di tiep.
      detail:
        gateBlocks.length && score >= 70
          ? 'Điểm đã đủ, chỉ thiếu điều kiện cộng ở mục dưới. Gửi case study cùng ngành và mời xem demo — khách nhận demo là đủ điều kiện lên SQL candidate.'
          : 'Phù hợp với ít nhất một sản phẩm Zalo nhưng chưa sẵn sàng mua. Gửi tài liệu và case study, theo dõi tiếp.',
    }
  } else {
    classification = 'LEAD'
    classificationLabel = 'Lead'
    tone = 'cool'
    nextAction = {
      label: 'Tiếp tục tư vấn',
      detail: problemTooVague
        ? `Đạt ${score} điểm nhưng vấn đề khách nêu còn quá chung để gọi là "có nhu cầu rõ". Agent hỏi thêm về bài toán cụ thể trước, chưa chuyển sang nuôi dưỡng.`
        : 'Chưa rõ doanh nghiệp, nhu cầu hoặc use case. Agent tiếp tục hỏi thêm hoặc đưa vào luồng nurture tự động, chưa tiêu nguồn lực sales.',
    }
  }

  return {
    score,
    classification,
    classificationLabel,
    tone,
    components,
    // Chi lo dieu kien cong khi da dat nguong 70. Duoi nguong thi lead con
    // thieu diem la ly do chinh, liet ca ba dieu kien chi lam nhieu dashboard.
    gateBlocks: score >= 70 ? gateBlocks : [],
    missingFields,
    nextAction,
  }
}

/* =====================================================================
   3. Summary + roadmap 30-60-90
   ===================================================================== */
function buildSummary(input, solutions) {
  const top = solutions[0]
  const second = solutions[1]
  const industry = INDUSTRY_NAME[input.industry] ?? 'ngành của bạn'
  const mainGoal = GOAL_NAME[input.goals?.[0]] ?? 'mục tiêu bạn nêu'

  let s

  if (top.tier === 'core') {
    s = `Với một doanh nghiệp ${industry} đang muốn ${mainGoal}, ${top.name} là nơi bạn nên bắt đầu — đạt ${top.score}% phù hợp.`
  } else {
    // Khong co giai phap nao noi troi: noi thang thay vi ep mot con so trung binh
    // thanh khuyen nghi chac chan.
    s =
      `Hiện trạng của bạn chưa nghiêng rõ về một giải pháp nào. Sát nhất là ${top.name} ` +
      `(${top.score}%), nhưng khoảng cách với các phương án còn lại không lớn — nên trao đổi thêm ` +
      `với chuyên viên Zalo trước khi chốt hướng đầu tư.`
  }

  if (second && second.tier !== 'later') {
    s +=
      top.tier === 'core'
        ? ` Sau khi kênh đầu chạy ổn, ${second.name} (${second.score}%) là bước mở rộng hợp lý tiếp theo.`
        : ` ${second.name} (${second.score}%) cũng đáng cân nhắc song song.`
  }

  const later = solutions.filter((x) => x.tier === 'later')
  if (later.length) {
    s += ` Riêng ${vietnameseList(later.map((x) => x.name), 3)} chưa cần thiết ở giai đoạn này — làm sớm sẽ tốn chi phí mà chưa thấy hiệu quả.`
  }

  return s
}

/**
 * Noi danh sach theo dung kieu tieng Viet: "A, B và C".
 * Truoc day dung join(' và ') nen ra "A và B và C và D" khi co 4 muc.
 * Qua `max` muc thi gop phan con lai thanh "và N giai phap khac".
 */
function vietnameseList(items, max = 3) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]

  // Chi gop khi con tu 2 muc tro len. Gop dung 1 muc thanh "va 1 giai phap khac"
  // thi te hon la neu thang ten no ra.
  const rest = items.length - max
  if (rest >= 2) {
    return `${items.slice(0, max).join(', ')} và ${rest} giải pháp khác`
  }

  return `${items.slice(0, -1).join(', ')} và ${items[items.length - 1]}`
}

function buildRoadmap(input, solutions) {
  const top = solutions[0]
  const second = solutions[1]
  const industry = INDUSTRY_NAME[input.industry] ?? 'ngành của bạn'
  const hasOA = has(input.currentChannels, 'zalo_oa')

  return [
    {
      phase: '30 NGÀY',
      title: hasOA ? `Tối ưu OA hiện có, chuẩn bị ${top.name}` : `Dựng ${top.name} và chạy thật`,
      items: [
        hasOA
          ? 'Rà lại OA đang có: bộ câu trả lời, người trực chat, thời gian phản hồi'
          : `Tạo ${top.name}, hoàn tất xác thực doanh nghiệp`,
        hasOA
          ? `Chốt phạm vi bản ${top.name} đầu tiên: làm đúng 1 việc, chưa làm hết tính năng`
          : 'Dựng bộ tin nhắn chào và câu trả lời cho 10 câu hỏi khách hay hỏi nhất',
        'Đưa mã QR OA lên cửa hàng, hoá đơn, fanpage hiện có',
        'Chốt 1 người phụ trách trực chat và thời gian phản hồi cam kết',
      ],
    },
    {
      phase: '60 NGÀY',
      title: 'Đo và tự động hoá phần lặp lại',
      items: [
        'Theo dõi số người quan tâm, thời gian phản hồi, tỷ lệ chốt qua chat',
        'Bật tin nhắn tự động cho các câu hỏi lặp lại',
        second && second.tier !== 'later'
          ? `Bắt đầu triển khai ${second.name}`
          : `Chuẩn hoá quy trình chăm sóc khách theo đặc thù ${industry}`,
        'Nối dữ liệu khách về file/CRM đang dùng',
      ],
    },
    {
      phase: '90 NGÀY',
      title: 'Mở rộng và giữ khách quay lại',
      items: [
        'So sánh chi phí có được một khách qua Zalo với các kênh cũ',
        'Chạy chiến dịch chăm sóc lại tệp khách đã có',
        'Quyết định mở rộng: thêm giải pháp hoặc nâng cấp gói đang dùng',
        'Rà lại: mục tiêu ban đầu đã cải thiện được bao nhiêu phần trăm',
      ],
    },
  ]
}

/* =====================================================================
   4. Entry point
   ===================================================================== */
export function analyze(input) {
  const solutions = SOLUTIONS.map((s) => scoreSolution(s, input)).sort((a, b) => b.score - a.score)

  return {
    solutions,
    summary: buildSummary(input, solutions),
    roadmap: buildRoadmap(input, solutions),
    qualification: computeQualification(input, solutions),
  }
}

/* ---------------------------------------------------------------------
   Ghi chu: gan LLM vao sau nay
   ---------------------------------------------------------------------
   Rule engine o tren lo diem va ly do. Neu muon van van tu nhien hon,
   gui `solutions` + `input.painPoint` cho LLM va chi yeu cau viet lai
   phan `summary`/`reasons` — KHONG de LLM tu quyet dinh diem so.
   Nhu vay demo van on dinh, con phan chu thi muot hon.
   Xem huong dan API tai claude.com/docs.
   --------------------------------------------------------------------- */
