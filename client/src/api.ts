import type {
  ChatExtract,
  ChatMessage,
  DiscoveryInput,
  InternalRecommendation,
  Lead,
  LeadStatus,
  OpeningLine,
  Recommendation,
  StatusConfig,
} from './types'

/** Vite proxy /api -> http://localhost:4000 (xem client/vite.config.ts) */
const BASE = '/api'

/**
 * Token phien cho khu vuc noi bo.
 *
 * Dung sessionStorage chu khong phai localStorage: dong tab la mat phien.
 * Hop voi may demo dung chung — khong de lai quyen truy cap cho nguoi mo sau.
 */
const TOKEN_KEY = 'zalo-copilot-internal-token'

export const auth = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* private mode - chap nhan mat phien khi reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* khong lam gi */
    }
  },
}

/** Nem ra khi token het han / bi tu choi, de UI biet ma hien lai man dang nhap. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Phiên đăng nhập đã hết. Đăng nhập lại giúp mình nhé.')
    this.name = 'UnauthorizedError'
  }
}

async function request<T>(path: string, init: RequestInit = {}, internal = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...((init.headers as Record<string, string>) ?? {}),
  }

  if (internal) {
    const token = auth.get()
    if (!token) throw new UnauthorizedError()
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(BASE + path, { ...init, headers })
  } catch {
    throw new Error(
      'Không kết nối được tới server. Kiểm tra đã chạy `npm run dev` (server ở cổng 4000) chưa.',
    )
  }

  if (res.status === 401 && internal) {
    auth.clear()
    throw new UnauthorizedError()
  }

  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.ok) {
    throw new Error(body?.message ?? `Server trả về lỗi ${res.status}`)
  }
  return body.data as T
}

export const api = {
  /* ---------------- Man SME (cong khai) ---------------- */

  /** Khong tra ve qualification, khong tra ve khoang chi phi. */
  analyze(input: DiscoveryInput) {
    return request<Recommendation>('/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /* ---------------- Luong chat (cong khai) ---------------- */

  /** Một lượt hội thoại. LLM hỏi chuyện, trả lời dựa trên knowledge base. */
  chat(messages: ChatMessage[]) {
    return request<{ text: string; model: string; tokens: number | null }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })
  },

  /**
   * Rút thông tin đã thu được từ hội thoại. Việc quyết định "đủ chưa" nằm ở
   * server (danh sách REQUIRED trong chat.js), không để LLM tự phân xử.
   */
  chatExtract(messages: ChatMessage[]) {
    return request<ChatExtract>('/chat/extract', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })
  },

  /* ---------------- Khu vuc noi bo ---------------- */

  async login(password: string) {
    const data = await request<{ token: string; expiresIn: number }>('/internal/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    auth.set(data.token)
    return data
  },

  async logout() {
    try {
      await request('/internal/logout', { method: 'POST' }, true)
    } catch {
      /* het han roi thi thoi */
    }
    auth.clear()
  },

  /** Nhan su Zalo nhap ho khach — tra ve day du ca qualification va chi phi. */
  internalAnalyze(input: DiscoveryInput) {
    return request<InternalRecommendation>(
      '/internal/analyze',
      { method: 'POST', body: JSON.stringify(input) },
      true,
    )
  },

  leads() {
    return request<Lead[]>('/leads', {}, true)
  },

  /** Dinh nghia trang thai + bang chuyen, lay tu server de khong bi lech dinh nghia. */
  statusConfig() {
    return request<StatusConfig>('/lead-statuses', {}, true)
  },

  /**
   * Chuyen trang thai. Server tu choi neu nhay buoc (409) hoac neu co gang dat
   * phan loai cua agent (403) — loi nem ra day kem nguyen van ly do de hien len UI.
   */
  transitionLead(id: string, to: LeadStatus, note?: string) {
    return request<Lead>(
      `/leads/${id}/transition`,
      { method: 'POST', body: JSON.stringify({ to, note }) },
      true,
    )
  },

  /**
   * Sinh câu mở đầu cho account. Đã có rồi thì trả bản cũ, không gọi lại model —
   * truyền regenerate: true nếu muốn viết lại.
   */
  openingLine(id: string, regenerate = false) {
    return request<OpeningLine>(
      `/leads/${id}/opening-line`,
      { method: 'POST', body: JSON.stringify({ regenerate }) },
      true,
    )
  },

  resetLeads() {
    return request<Lead[]>('/leads/reset', { method: 'POST' }, true)
  },
}
