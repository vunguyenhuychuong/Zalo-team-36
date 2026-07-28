/**
 * Vong doi lead va quy tac chuyen trang thai.
 *
 * Nguyen tac trung tam cua tai lieu: AGENT DE XUAT, ACCOUNT QUYET DINH.
 * File nay la cho cuong che nguyen tac do — khong phai prompt, khong phai UI.
 *
 * Hai nhom trang thai TACH BIET, khong duoc lan vao nhau:
 *
 *   1. Phan loai cua AGENT (LEAD / MQL / SQL_CANDIDATE)
 *      Do computeQualification() tinh ra tu diem. Khong ai set duoc qua API,
 *      ke ca nhan su noi bo. Muon doi thi phai doi du lieu dau vao.
 *
 *   2. Trang thai do ACCOUNT quyet dinh (NEW -> ACCEPTED -> QUALIFIED ...)
 *      ACCEPTED chinh la SAL, QUALIFIED chinh la SQL trong tai lieu.
 *      Chi con nguoi set duoc, va phai di dung thu tu.
 *
 * Never List dieu 1: "Never tu tuyen bo mot khach la SAL hoac SQL — agent chi
 * duoc de xuat muc toi da la SQL candidate."
 */

/** Phan loai do agent tinh. Liet ke o day de TU CHOI khi co ai gui len qua API. */
export const AGENT_CLASSIFICATIONS = ['LEAD', 'MQL', 'SQL_CANDIDATE']

export const HUMAN_STATUSES = {
  NEW: {
    label: 'Chờ account xem',
    tone: 'cool',
    detail: 'Agent đã bàn giao, chưa ai trong đội sales mở ra.',
  },
  ACCEPTED: {
    label: 'SAL — đã tiếp nhận',
    tone: 'warm',
    detail: 'Account đã đọc bản bàn giao và đồng ý tiếp nhận. Tạo task và SLA follow-up.',
  },
  QUALIFIED: {
    label: 'SQL — đã xác minh',
    tone: 'hot',
    detail:
      'Account đã xác minh trực tiếp nhu cầu, người ra quyết định và bước tiếp theo. Tạo opportunity trong CRM.',
  },
  NURTURING: {
    label: 'Đang nuôi dưỡng',
    tone: 'cool',
    detail: 'Chưa đủ điều kiện đi tiếp. Vào chuỗi nuôi dưỡng, hẹn kiểm tra lại.',
  },
  REJECTED: {
    label: 'Không theo tiếp',
    tone: 'cool',
    detail: 'Account quyết định không theo. Ghi lại lý do để hiệu chỉnh tiêu chí.',
  },
}

/**
 * Bang chuyen trang thai.
 *
 * Diem quan trong nhat: NEW KHONG di thang duoc sang QUALIFIED.
 * Phai qua ACCEPTED truoc. Day la cach ma hoa dung hai buoc rieng biet ma tai
 * lieu mo ta: "account doc ban ban giao va dong y tiep nhan" (SAL) roi moi toi
 * "account xac minh truc tiep nhu cau va nguoi ra quyet dinh" (SQL).
 * Bo qua buoc SAL nghia la tao opportunity CRM cho mot lead chua ai doc.
 */
export const TRANSITIONS = {
  NEW: ['ACCEPTED', 'NURTURING', 'REJECTED'],
  ACCEPTED: ['QUALIFIED', 'NURTURING', 'REJECTED'],
  QUALIFIED: ['REJECTED'],
  NURTURING: ['ACCEPTED', 'REJECTED'],
  REJECTED: [],
}

export const DEFAULT_STATUS = 'NEW'

/** Cac trang thai coi la "account da chap nhan lead" - dung de do metric. */
export const ACCEPTED_STATUSES = ['ACCEPTED', 'QUALIFIED']

/**
 * Kiem mot yeu cau chuyen trang thai.
 * Tra { ok: true } hoac { ok: false, code, message } de route dich ra HTTP status.
 */
export function checkTransition(from, to) {
  if (typeof to !== 'string' || to.length === 0) {
    return { ok: false, code: 400, message: 'Thiếu trường `to`.' }
  }

  // Chan viec set phan loai cua agent qua API — ranh gioi quan trong nhat.
  if (AGENT_CLASSIFICATIONS.includes(to)) {
    return {
      ok: false,
      code: 403,
      message:
        `"${to}" là phân loại do agent tính từ điểm qualification, không phải trạng thái ` +
        'account đặt được. Agent chỉ đề xuất tới mức SQL candidate; muốn đổi thì phải đổi dữ liệu đầu vào.',
    }
  }

  if (!HUMAN_STATUSES[to]) {
    return {
      ok: false,
      code: 400,
      message: `Trạng thái không hợp lệ: "${to}". Hợp lệ: ${Object.keys(HUMAN_STATUSES).join(', ')}.`,
    }
  }

  if (from === to) {
    return { ok: false, code: 409, message: `Lead đang ở trạng thái "${HUMAN_STATUSES[to].label}" rồi.` }
  }

  const allowed = TRANSITIONS[from] ?? []
  if (!allowed.includes(to)) {
    // Truong hop hay gap nhat va dang canh bao nhat: nhay thang len SQL
    if (from === 'NEW' && to === 'QUALIFIED') {
      return {
        ok: false,
        code: 409,
        message:
          'Không thể chuyển thẳng sang SQL. Account phải đọc bản bàn giao và tiếp nhận (SAL) ' +
          'trước, rồi mới xác minh trực tiếp với khách để lên SQL. Bỏ qua bước SAL nghĩa là tạo ' +
          'opportunity cho một lead chưa ai đọc.',
      }
    }
    return {
      ok: false,
      code: 409,
      message:
        `Không chuyển được từ "${HUMAN_STATUSES[from]?.label ?? from}" sang ` +
        `"${HUMAN_STATUSES[to].label}". Bước hợp lệ tiếp theo: ` +
        (allowed.length ? allowed.map((s) => HUMAN_STATUSES[s].label).join(', ') : 'không còn bước nào'),
    }
  }

  return { ok: true }
}

/** Cac buoc hop le tiep theo - client dung de render dung nut bam. */
export function nextSteps(from) {
  return (TRANSITIONS[from] ?? []).map((s) => ({ to: s, label: HUMAN_STATUSES[s].label }))
}
