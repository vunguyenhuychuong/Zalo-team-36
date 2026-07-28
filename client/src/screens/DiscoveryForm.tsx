import { useState } from 'react'
import {
  BUDGETS,
  BUYING_INTENTS,
  CHANNELS,
  COMPANY_SIZES,
  DECISION_ROLES,
  GOALS,
  INDUSTRIES,
  REGIONS,
  REVENUES,
  TIMELINES,
} from '../data/options'
import type { DiscoveryInput } from '../types'
import { ChipGroup, Field, SelectInput, Steps, TextArea, TextInput } from '../components/ui'
import { IconAlert, IconArrowRight, IconLock } from '../components/icons'

const EMPTY: DiscoveryInput = {
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  region: '',
  industry: '',
  companySize: '',
  monthlyRevenue: '',
  currentChannels: [],
  goals: [],
  budget: '',
  timeline: '',
  painPoint: '',
  buyingIntent: '',
  decisionRole: '',
}

/** Du lieu dien san - bam "Điền nhanh để demo" de khoi go 12 field truoc mat ban giam khao. */
const DEMO: DiscoveryInput = {
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
}

type Errors = Partial<Record<keyof DiscoveryInput, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** SDT VN: 10 so bat dau bang 0, hoac dang +84/84 */
const PHONE_RE = /^(0\d{9}|(\+?84)\d{9})$/

function validate(v: DiscoveryInput): Errors {
  const e: Errors = {}
  if (!v.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên'
  if (!v.companyName.trim()) e.companyName = 'Vui lòng nhập tên doanh nghiệp'

  if (!v.email.trim()) e.email = 'Vui lòng nhập email'
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Email chưa đúng định dạng'

  if (!v.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại'
  else if (!PHONE_RE.test(v.phone.replace(/[\s.-]/g, '')))
    e.phone = 'Số điện thoại chưa đúng (VD: 0905123456)'

  if (!v.region) e.region = 'Chọn khu vực'
  if (!v.industry) e.industry = 'Chọn ngành hàng'
  if (!v.companySize) e.companySize = 'Chọn quy mô'
  if (!v.goals.length) e.goals = 'Chọn ít nhất 1 mục tiêu'

  // Buying intent bat buoc: cung voi nganh va van de, ba nhom nay chiem
  // 70/100 diem qualification. Thieu thi khong cham diem co y nghia duoc.
  if (!v.buyingIntent) e.buyingIntent = 'Cho chúng tôi biết bạn đang ở bước nào'

  if (!v.painPoint.trim()) e.painPoint = 'Mô tả giúp chúng tôi vấn đề bạn đang gặp'
  else if (v.painPoint.trim().length < 20)
    e.painPoint = 'Viết thêm một chút để agent hiểu đúng nhu cầu (tối thiểu 20 ký tự)'

  return e
}

interface Props {
  onSubmit: (input: DiscoveryInput) => void
  submitting: boolean
  serverError: string | null
  /**
   * 'sme'      — SME tu dien, doc giong tu van.
   * 'internal' — nhan su Zalo dien ho khach trong luc goi dien / gap mat.
   * Cung mot form, chi khac cach dien dat va nhan nut.
   */
  mode?: 'sme' | 'internal'
}

export function DiscoveryForm({ onSubmit, submitting, serverError, mode = 'sme' }: Props) {
  const internal = mode === 'internal'
  const [v, setV] = useState<DiscoveryInput>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)

  /** Sau lan submit dau tien thi validate lai ngay khi user sua - do bi kho chiu */
  function set<K extends keyof DiscoveryInput>(key: K, value: DiscoveryInput[K]) {
    const next = { ...v, [key]: value }
    setV(next)
    if (touched) setErrors(validate(next))
  }

  function toggle(key: 'currentChannels' | 'goals', value: string) {
    const list = v[key]
    set(key, list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const found = validate(v)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      // Cuon tới field loi dau tien
      const first = document.querySelector('.control--invalid') as HTMLElement | null
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      first?.focus({ preventScroll: true })
      return
    }
    onSubmit({ ...v, email: v.email.trim(), phone: v.phone.replace(/[\s.-]/g, '') })
  }

  function fillDemo() {
    setV(DEMO)
    setErrors({})
    setTouched(false)
  }

  return (
    <form className="card fade-in" onSubmit={handleSubmit} noValidate>
      {!internal && <Steps current={1} />}

      {internal ? (
        <>
          <div className="mini-label">Tư vấn cho khách</div>
          <h1 className="card__title" style={{ fontSize: 22, marginTop: 8 }}>
            Nhập thông tin khách hàng để chấm điểm qualification
          </h1>
          <p className="card__lead">
            Dùng trong lúc gọi điện hoặc gặp trực tiếp. Kết quả gồm điểm 100 và phân loại
            Lead&nbsp;/&nbsp;MQL&nbsp;/&nbsp;SQL candidate, kèm gợi ý câu nên hỏi thêm cho những
            thông tin còn thiếu. Lead được đánh dấu là do nhân sự nhập, không lẫn với lead SME tự
            gửi.
          </p>
        </>
      ) : (
        <>
          <h1 className="card__title">
            Bạn đang muốn đưa doanh nghiệp lên Zalo nhưng chưa biết bắt đầu từ đâu? Trả lời vài câu
            dưới đây, Copilot sẽ chỉ ra giải pháp phù hợp nhất với bạn.
          </h1>
          <p className="card__lead">
            Mất khoảng 2 phút. Bạn sẽ nhận được danh sách giải pháp Zalo kèm điểm phù hợp, lý do cụ
            thể theo ngành của bạn, và lộ trình triển khai 30 – 60 – 90 ngày.
          </p>
        </>
      )}

      {serverError && (
        <div className="banner banner--error">
          <IconAlert size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid">
        {/* ---------------- Khoi 1: lien he ---------------- */}
        <div className="section-label section-label--first">Thông tin liên hệ</div>

        <Field label="Họ và tên" required error={errors.fullName} htmlFor="fullName">
          <TextInput
            id="fullName"
            value={v.fullName}
            onChange={(x) => set('fullName', x)}
            placeholder="Nhập tên của bạn"
            invalid={!!errors.fullName}
          />
        </Field>

        <Field label="Tên doanh nghiệp" required error={errors.companyName} htmlFor="companyName">
          <TextInput
            id="companyName"
            value={v.companyName}
            onChange={(x) => set('companyName', x)}
            placeholder="Nhập tên công ty / cửa hàng"
            invalid={!!errors.companyName}
          />
        </Field>

        <Field label="Địa chỉ email" required error={errors.email} htmlFor="email">
          <TextInput
            id="email"
            type="email"
            inputMode="email"
            value={v.email}
            onChange={(x) => set('email', x)}
            placeholder="Nhập email"
            invalid={!!errors.email}
          />
        </Field>

        <Field label="Số điện thoại" required error={errors.phone} htmlFor="phone">
          <TextInput
            id="phone"
            type="tel"
            inputMode="tel"
            value={v.phone}
            onChange={(x) => set('phone', x)}
            placeholder="Nhập số điện thoại"
            invalid={!!errors.phone}
          />
        </Field>

        <Field label="Khu vực" required error={errors.region} htmlFor="region">
          <SelectInput
            id="region"
            value={v.region}
            onChange={(x) => set('region', x)}
            options={REGIONS}
            placeholder="Chọn khu vực"
            invalid={!!errors.region}
          />
        </Field>

        <Field label="Ngành hàng" required error={errors.industry} htmlFor="industry">
          <SelectInput
            id="industry"
            value={v.industry}
            onChange={(x) => set('industry', x)}
            options={INDUSTRIES}
            placeholder="Chọn ngành hàng"
            invalid={!!errors.industry}
          />
        </Field>

        {/* ---------------- Khoi 2: quy mo & nhu cau ---------------- */}
        <div className="section-label">Quy mô &amp; hiện trạng</div>

        <Field label="Quy mô doanh nghiệp" required error={errors.companySize} htmlFor="companySize">
          <SelectInput
            id="companySize"
            value={v.companySize}
            onChange={(x) => set('companySize', x)}
            options={COMPANY_SIZES}
            placeholder="Chọn quy mô"
            invalid={!!errors.companySize}
          />
        </Field>

        <Field
          label="Doanh thu trung bình"
          hint="Dùng để ước tính ngân sách phù hợp, không bắt buộc."
          htmlFor="monthlyRevenue"
        >
          <SelectInput
            id="monthlyRevenue"
            value={v.monthlyRevenue}
            onChange={(x) => set('monthlyRevenue', x)}
            options={REVENUES}
            placeholder="Chọn mức doanh thu"
          />
        </Field>

        <Field
          label="Kênh bán / chăm sóc khách đang dùng"
          hint="Chọn tất cả kênh bạn đang dùng."
          full
        >
          <ChipGroup
            options={CHANNELS}
            selected={v.currentChannels}
            onToggle={(x) => toggle('currentChannels', x)}
          />
        </Field>

        {/* ---------------- Khoi 3: muc tieu ---------------- */}
        <div className="section-label">Điều bạn muốn đạt được</div>

        <Field label="Mục tiêu chính" required error={errors.goals} full>
          <ChipGroup options={GOALS} selected={v.goals} onToggle={(x) => toggle('goals', x)} />
        </Field>

        <Field label="Ngân sách dự kiến" htmlFor="budget">
          <SelectInput
            id="budget"
            value={v.budget}
            onChange={(x) => set('budget', x)}
            options={BUDGETS}
            placeholder="Chọn ngân sách"
          />
        </Field>

        <Field label="Thời điểm muốn triển khai" htmlFor="timeline">
          <SelectInput
            id="timeline"
            value={v.timeline}
            onChange={(x) => set('timeline', x)}
            options={TIMELINES}
            placeholder="Chọn thời điểm"
          />
        </Field>

        <Field
          label="Bạn đang ở bước nào"
          required
          error={errors.buyingIntent}
          hint="Giúp chúng tôi biết nên gửi tài liệu hay để chuyên viên liên hệ ngay."
          htmlFor="buyingIntent"
        >
          <SelectInput
            id="buyingIntent"
            value={v.buyingIntent}
            onChange={(x) => set('buyingIntent', x)}
            options={BUYING_INTENTS}
            placeholder="Chọn tình trạng hiện tại"
            invalid={!!errors.buyingIntent}
          />
        </Field>

        <Field
          label="Vai trò của bạn"
          hint="Không bắt buộc. Biết được thì chuyên viên chuẩn bị đúng nội dung hơn."
          htmlFor="decisionRole"
        >
          <SelectInput
            id="decisionRole"
            value={v.decisionRole}
            onChange={(x) => set('decisionRole', x)}
            options={DECISION_ROLES}
            placeholder="Chọn vai trò"
          />
        </Field>

        <Field
          label="Vấn đề đang quan tâm"
          required
          error={errors.painPoint}
          hint="Càng cụ thể, gợi ý càng sát. VD: khách hay hỏi giá qua tin nhắn nhưng nhân viên trả lời không kịp."
          full
          htmlFor="painPoint"
        >
          <TextArea
            id="painPoint"
            value={v.painPoint}
            onChange={(x) => set('painPoint', x)}
            placeholder="Mô tả bài toán bạn đang gặp phải…"
            invalid={!!errors.painPoint}
            rows={5}
          />
        </Field>

        {/* ---------------- Footer ---------------- */}
        <div className="form-foot">
          <p className="form-foot__note">
            <IconLock size={14} />
            <span>
              {internal
                ? 'Thiếu trường "nên có" thì vẫn chấm được — hệ thống sẽ gắn cờ chứ không suy đoán. Bấm '
                : 'Thông tin của bạn chỉ dùng để tư vấn giải pháp Zalo phù hợp. Bấm '}
              <button
                type="button"
                className="link-cta"
                style={{ fontSize: 12.5 }}
                onClick={fillDemo}
              >
                điền nhanh để demo
              </button>{' '}
              {internal ? 'nếu chỉ muốn thử.' : 'nếu bạn chỉ muốn xem thử.'}
            </span>
          </p>

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="btn__spin" /> {internal ? 'Đang chấm điểm' : 'Đang phân tích'}
              </>
            ) : (
              <>
                {internal ? 'Chấm điểm qualification' : 'Xem gợi ý giải pháp'} <IconArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
