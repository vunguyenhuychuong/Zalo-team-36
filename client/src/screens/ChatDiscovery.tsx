import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { GOALS, REGIONS } from '../data/options'
import type { ChatExtract, ChatMessage, DiscoveryInput } from '../types'
import { ChipGroup, Field, SelectInput, TextInput } from '../components/ui'
import { IconAlert, IconArrowRight, IconCheck, IconSparkles } from '../components/icons'

/**
 * Cua truoc dang hoi thoai.
 *
 * Phan cong giu dung nguyen tac tai lieu:
 *   LLM  -> hoi chuyen, tra loi dua tren knowledge base, trich xuat ra JSON
 *   CODE -> quyet dinh khi nao du thong tin, roi goi rule engine cham diem
 *
 * Buoc xac nhan o cuoi khong phai cho dep: `goals` va thong tin lien he do
 * NGUOI DUNG tu dien. Bat model suy ra muc tieu tu van la doan, con so dien
 * thoai va email thi tuyet doi khong bao gio tin model trich xuat.
 */

const GREETING =
  'Chào anh/chị, em là Copilot của Zalo for Business. Anh/chị kể em nghe doanh nghiệp mình đang làm gì và đang vướng chỗ nào, em xem có giải pháp Zalo nào phù hợp không ạ.'

const GOI_Y = [
  'Quán cà phê, 5 nhân viên, khách nhắn Facebook đặt bàn hay bị bỏ sót',
  'Shop quần áo bán Shopee, muốn có kênh riêng để giữ khách',
  'Phòng khám, khách hay quên lịch hẹn',
]

interface Props {
  onDone: (input: DiscoveryInput) => void
  submitting: boolean
  serverError: string | null
}

export function ChatDiscovery({ onDone, submitting, serverError }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: GREETING },
  ])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ex, setEx] = useState<ChatExtract | null>(null)
  const [checking, setChecking] = useState(false)
  const [confirming, setConfirming] = useState(false)

  /** Phan nguoi dung tu dien o buoc xac nhan */
  const [goals, setGoals] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [region, setRegion] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking, confirming])

  const userTurns = messages.filter((m) => m.role === 'user').length

  async function send(text: string) {
    const t = text.trim()
    if (!t || thinking) return

    const next = [...messages, { role: 'user' as const, content: t }]
    setMessages(next)
    setDraft('')
    setThinking(true)
    setError(null)

    try {
      const r = await api.chat(next)
      setMessages([...next, { role: 'assistant', content: r.text }])
    } catch (e) {
      setError((e as Error).message)
      // Bo lai luot vua gui de nguoi dung khong mat cong go
      setMessages(messages)
      setDraft(t)
    } finally {
      setThinking(false)
    }
  }

  async function check() {
    setChecking(true)
    setError(null)
    try {
      const r = await api.chatExtract(messages)
      setEx(r)
      if (r.ready) {
        setCompanyName((prev) => prev || r.collected.companyName || '')
        setFullName((prev) => prev || r.collected.fullName || '')
        setConfirming(true)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setChecking(false)
    }
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const PHONE_RE = /^(0\d{9}|(\+?84)\d{9})$/

  function finish() {
    if (!ex) return
    if (!goals.length) return setFormError('Chọn ít nhất một mục tiêu')
    if (!fullName.trim()) return setFormError('Nhập họ tên')
    if (!companyName.trim()) return setFormError('Nhập tên doanh nghiệp')
    if (!EMAIL_RE.test(email.trim())) return setFormError('Email chưa đúng định dạng')
    if (!PHONE_RE.test(phone.replace(/[\s.-]/g, ''))) return setFormError('Số điện thoại chưa đúng')
    if (!region) return setFormError('Chọn khu vực')
    setFormError(null)

    // Ghep phan LLM rut ra voi phan nguoi dung tu dien.
    // Truong nao thieu thi de rong — scoring.js tu gan co, khong doan.
    onDone({
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.replace(/[\s.-]/g, ''),
      region,
      industry: ex.collected.industry ?? '',
      companySize: ex.collected.companySize ?? '',
      monthlyRevenue: ex.collected.monthlyRevenue ?? '',
      currentChannels: ex.collected.currentChannels ?? [],
      goals,
      budget: ex.collected.budget ?? '',
      timeline: ex.collected.timeline ?? '',
      painPoint: ex.collected.painPoint ?? '',
      buyingIntent: ex.collected.buyingIntent ?? '',
      decisionRole: ex.collected.decisionRole ?? '',
    })
  }

  return (
    <div className="card fade-in">
      <div className="chat-head">
        <span className="chat-head__mark">
          <IconSparkles size={16} />
        </span>
        <div>
          <h1>Trò chuyện với Copilot</h1>
          <p>
            Kể bằng lời của mình, không cần điền form. Copilot trả lời dựa trên danh mục sản phẩm
            Zalo đã kiểm chứng — và không bao giờ tự báo giá.
          </p>
        </div>
      </div>

      {(error || serverError) && (
        <div className="banner banner--error">
          <IconAlert size={16} />
          <span>{error ?? serverError}</span>
        </div>
      )}

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble bubble--' + m.role}>
            {m.content}
          </div>
        ))}

        {thinking && (
          <div className="bubble bubble--assistant bubble--thinking">
            <span />
            <span />
            <span />
          </div>
        )}

        {confirming && ex && (
          <div className="confirm">
            <div className="mini-label">Copilot đã ghi nhận</div>
            <ul className="confirm__list">
              {ex.collected.painPoint && (
                <li>
                  <IconCheck size={11} /> {ex.collected.painPoint}
                </li>
              )}
              {ex.collected.industry && (
                <li>
                  <IconCheck size={11} /> Ngành: {ex.collected.industry}
                </li>
              )}
              {ex.collected.companySize && (
                <li>
                  <IconCheck size={11} /> Quy mô: {ex.collected.companySize}
                </li>
              )}
              {!!ex.collected.currentChannels?.length && (
                <li>
                  <IconCheck size={11} /> Kênh: {ex.collected.currentChannels.join(', ')}
                </li>
              )}
            </ul>

            <p className="confirm__note">
              Còn hai thứ Copilot không tự đoán: mục tiêu là lựa chọn của anh/chị, còn số điện thoại
              và email thì phải anh/chị tự điền cho chính xác.
            </p>

            <div className="grid" style={{ marginTop: 4 }}>
              <Field label="Mục tiêu chính" required full>
                <ChipGroup
                  options={GOALS}
                  selected={goals}
                  onToggle={(v) =>
                    setGoals((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
                  }
                />
              </Field>

              <Field label="Họ và tên" required htmlFor="c-name">
                <TextInput id="c-name" value={fullName} onChange={setFullName} placeholder="Nhập tên" />
              </Field>
              <Field label="Tên doanh nghiệp" required htmlFor="c-co">
                <TextInput
                  id="c-co"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Nhập tên cửa hàng"
                />
              </Field>
              <Field label="Số điện thoại" required htmlFor="c-phone">
                <TextInput
                  id="c-phone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="0905123456"
                />
              </Field>
              <Field label="Email" required htmlFor="c-mail">
                <TextInput
                  id="c-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="ten@congty.vn"
                />
              </Field>
              <Field label="Khu vực" required htmlFor="c-region">
                <SelectInput
                  id="c-region"
                  value={region}
                  onChange={setRegion}
                  options={REGIONS}
                  placeholder="Chọn khu vực"
                />
              </Field>
            </div>

            {formError && (
              <div className="field__error" style={{ marginTop: 12 }}>
                <IconAlert size={13} /> {formError}
              </div>
            )}

            <button
              type="button"
              className="btn btn--primary"
              style={{ marginTop: 18 }}
              disabled={submitting}
              onClick={finish}
            >
              {submitting ? (
                <>
                  <span className="btn__spin" /> Đang chấm điểm
                </>
              ) : (
                <>
                  Xem gợi ý giải pháp <IconArrowRight />
                </>
              )}
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {!confirming && (
        <>
          {userTurns === 0 && (
            <div className="chat-hints">
              {GOI_Y.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
          >
            <input
              className="control"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Kể cho Copilot nghe…"
              disabled={thinking}
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={thinking || !draft.trim()}>
              Gửi
            </button>
          </form>

          {userTurns >= 1 && (
            <div className="chat-foot">
              <button type="button" className="link-cta" disabled={checking} onClick={check}>
                {checking ? 'Đang xem lại hội thoại…' : 'Kể đủ rồi, xem gợi ý giải pháp →'}
              </button>
              {ex && !ex.ready && (
                <span className="chat-foot__missing">
                  Copilot còn cần biết: {ex.missing.map((m) => MISSING_LABEL[m] ?? m).join(', ')}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const MISSING_LABEL: Record<string, string> = {
  industry: 'ngành hàng',
  companySize: 'quy mô nhân sự',
  painPoint: 'vấn đề đang gặp',
  buyingIntent: 'anh/chị đang ở bước nào (tìm hiểu, muốn demo, cần báo giá…)',
}
