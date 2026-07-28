/** Du lieu SME nhap o Man 1. Field name giu nguyen giua client <-> server. */
export interface DiscoveryInput {
  // Khoi lien he
  fullName: string
  companyName: string
  email: string
  phone: string
  region: string

  // Khoi kinh doanh - dau vao cho scoring
  industry: string
  companySize: string
  monthlyRevenue: string
  currentChannels: string[]
  goals: string[]
  budget: string
  timeline: string
  painPoint: string

  /** Buying intent - 20 diem, BAT BUOC theo doc */
  buyingIntent: string
  /** Vai tro nguoi tra loi - 10 diem, "nen co" (thieu thi gan co) */
  decisionRole: string
}

/** Mot giai phap Zalo da duoc cham diem cho SME nay. */
export interface ScoredSolution {
  id: string
  name: string
  tagline: string
  /** 0-100 */
  score: number
  /** 'core' = nen lam ngay, 'support' = bo tro, 'later' = chua can o giai doan nay */
  tier: 'core' | 'support' | 'later'
  /** Ly do phu hop, doc duoc boi nguoi khong ky thuat */
  reasons: string[]
  /** Ly do bi tru diem - giai thich vi sao giai phap nay khong xep cao hon */
  notes: string[]
  /** Use case cu the theo nganh cua SME */
  useCases: string[]
  estimate: {
    setupWeeks: string
    /**
     * CHI co o khu vuc noi bo. Never List dieu 5 cam agent neu con so chi phi
     * voi khach, nen `/api/analyze` cat truong nay o tang server.
     */
    costRange?: string
  }
  cta: string
}

/** Mot thanh phan trong mo hinh 100 diem. */
export interface ScoreComponent {
  key: string
  /** Ten thanh phan, dung y nhu bang trong tai lieu */
  label: string
  earned: number
  max: number
  /** Giai thich vi sao duoc so diem nay - hien khi mo lead tren dashboard */
  detail: string
}

/**
 * Ket qua qualification theo mo hinh 100 diem cua tai lieu.
 * Thay the cap payReadiness/potential cu (von tu suy ra tu ban brief dau).
 *
 * Nguyen tac quan trong nhat: agent CHI duoc de xuat toi muc 'SQL_CANDIDATE'.
 * SAL va SQL chinh thuc do account xac nhan, khong phai agent.
 */
export interface Qualification {
  /** 0-100, tong cua cac component */
  score: number
  classification: 'LEAD' | 'MQL' | 'SQL_CANDIDATE'
  classificationLabel: string
  /** Mau hien thi tren dashboard */
  tone: 'hot' | 'warm' | 'cool'
  components: ScoreComponent[]
  /**
   * Dat >= 70 diem nhung bi giu lai o MQL vi chua hoi du dieu kien cong
   * (Never List dieu 10: khong day len SQL candidate chi de dat chi tieu).
   */
  gateBlocks: string[]
  /** Truong "nen co" con thieu - bao gio cung phai gan co thay vi doan */
  missingFields: string[]
  /** Hanh dong tiep theo, map tu classification */
  nextAction: {
    label: string
    detail: string
  }
}

/**
 * Ket qua tra ve man SME (Actor 1).
 *
 * KHONG co `qualification`: diem, phan loai va cong thuc cham diem la du lieu
 * noi bo, chi di qua GET /api/leads cho man dashboard. Xem ghi chu o
 * server/src/index.js.
 */
export interface Recommendation {
  id: string
  createdAt: string
  input: DiscoveryInput
  solutions: ScoredSolution[]
  /** Tom tat 1-2 cau, dat o dau man ket qua */
  summary: string
  /** Lo trinh 30-60-90 ngay (Stage 2 teaser) */
  roadmap: { phase: string; title: string; items: string[] }[]
}

/**
 * Ket qua o khu vuc noi bo (/advisor) — cung engine nhung day du:
 * co qualification va co khoang chi phi.
 */
export interface InternalRecommendation extends Recommendation {
  qualification: Qualification
}

/** SME tu nhap, hay nhan su Zalo nhap ho. */
export type LeadSource = 'sme_self' | 'internal_advisor'

/**
 * Trang thai do ACCOUNT quyet dinh — tach hoan toan khoi phan loai cua agent.
 * ACCEPTED = SAL, QUALIFIED = SQL trong tai lieu.
 */
export type LeadStatus = 'NEW' | 'ACCEPTED' | 'QUALIFIED' | 'NURTURING' | 'REJECTED'

export interface StatusMeta {
  label: string
  tone: 'hot' | 'warm' | 'cool'
  detail: string
}

/** Mot lan chuyen trang thai. Tai lieu yeu cau ghi lai ai doi va khi nao. */
export interface StatusChange {
  at: string
  from: LeadStatus
  to: LeadStatus
  by: string
  note: string
  /** Phan loai cua agent tai thoi diem chuyen - de do ty le account dong y */
  agentSaid: string | null
}

export interface StatusConfig {
  statuses: Record<LeadStatus, StatusMeta>
  transitions: Record<LeadStatus, LeadStatus[]>
}

/** Ban ghi lead hien tren dashboard noi bo. */
export interface Lead {
  id: string
  createdAt: string
  source: LeadSource
  companyName: string
  contactName: string
  phone: string
  email: string
  industry: string
  companySize: string
  region: string
  painPoint: string
  topSolution: string
  topScore: number
  /** Do agent tinh — khong ai set duoc qua API */
  qualification: Qualification
  /** Do account quyet dinh */
  status: LeadStatus
  history: StatusChange[]
}
