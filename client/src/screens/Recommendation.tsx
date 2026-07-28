import { INDUSTRIES, labelOf } from '../data/options'
import type { Recommendation as Rec, ScoredSolution } from '../types'
import { Steps } from '../components/ui'
import { IconArrowUpRight, IconBack, IconCheck, IconSparkles } from '../components/icons'

function badgeClass(s: ScoredSolution) {
  if (s.tier === 'core') return 'badge badge--good'
  if (s.tier === 'support') return 'badge badge--warn'
  return 'badge badge--cool'
}

function SolutionCard({ s, rank }: { s: ScoredSolution; rank: number }) {
  return (
    <article className={'sol sol--' + s.tier}>
      <div className="sol__head">
        <span className="sol__rank">{rank}</span>
        <div className="sol__title">
          <h3>{s.name}</h3>
          <p>{s.tagline}</p>
        </div>
        <span className={badgeClass(s)}>{s.score}%</span>
      </div>

      <div className="sol__body">
        <div>
          <div className="mini-label">
            {s.tier === 'later' ? 'Điểm cộng ghi nhận được' : 'Vì sao phù hợp với bạn'}
          </div>

          {s.reasons.length > 0 ? (
            <ul className="reasons">
              {s.reasons.map((r, i) => (
                <li key={i}>
                  <IconCheck size={12} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="reasons-empty">
              Chưa có tín hiệu nào trong thông tin bạn cung cấp cho thấy giải pháp này cần thiết ở
              giai đoạn hiện tại.
            </p>
          )}

          {s.notes.length > 0 && (
            <div className="notes">
              <div className="mini-label" style={{ marginBottom: 7 }}>
                Lưu ý
              </div>
              {s.notes.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mini-label">Bạn có thể làm gì</div>
          <div className="usecases">
            {s.useCases.map((u) => (
              <span className="tag" key={u}>
                {u}
              </span>
            ))}
          </div>

          <div className="estimate">
            <div>
              <span>Thời gian setup</span>
              <b>{s.estimate.setupWeeks}</b>
            </div>
            <div>
              <span>Chi phí</span>
              {/* costRange chi co o khu vuc noi bo - server cat truong nay
                  khoi response cua man SME theo Never List dieu 5. */}
              <b>{s.estimate.costRange ?? 'Chuyên viên Zalo báo giá'}</b>
            </div>
          </div>
        </div>
      </div>

      {s.tier !== 'later' && (
        <div className="sol__foot">
          <button type="button" className="link-cta">
            {s.cta} <IconArrowUpRight size={13} />
          </button>
        </div>
      )}
    </article>
  )
}

interface Props {
  rec: Rec
  onRestart: () => void
  /** Man advisor da co header rieng, khong can lai thanh buoc cua luong SME. */
  hideSteps?: boolean
}

export function Recommendation({ rec, onRestart, hideSteps }: Props) {
  const industry = labelOf(INDUSTRIES, rec.input.industry)

  return (
    <div className="card card--wide fade-in">
      {!hideSteps && <Steps current={2} />}

      <div className="result-head">
        <div>
          <h1 className="card__title" style={{ marginBottom: 6 }}>
            Giải pháp Zalo phù hợp với {rec.input.companyName}
          </h1>
          <p className="card__lead" style={{ marginBottom: 0 }}>
            {industry.split('—')[0].trim()} · {rec.input.fullName} · Xếp hạng theo mức độ phù hợp
            với hiện trạng và mục tiêu bạn vừa mô tả.
          </p>
        </div>
      </div>

      <div className="summary">
        <span className="summary__icon">
          <IconSparkles size={17} />
        </span>
        <div className="summary__body">
          <h4>Copilot nhận định</h4>
          <p>{rec.summary}</p>
        </div>
      </div>

      <div className="sol-list">
        {rec.solutions.map((s, i) => (
          <SolutionCard key={s.id} s={s} rank={i + 1} />
        ))}
      </div>

      <section className="roadmap">
        <div className="mini-label" style={{ fontSize: 10 }}>
          Lộ trình đề xuất
        </div>
        <h2 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 650, letterSpacing: '-0.3px' }}>
          30 – 60 – 90 ngày đầu
        </h2>
        <div className="roadmap__grid">
          {rec.roadmap.map((p) => (
            <div className="phase" key={p.phase}>
              <span className="phase__tag">{p.phase}</span>
              <h4>{p.title}</h4>
              <ul>
                {p.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="result-foot">
        <button type="button" className="btn btn--primary">
          Liên hệ tư vấn triển khai <IconArrowUpRight size={14} />
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRestart}>
          <IconBack size={13} /> Nhập lại thông tin
        </button>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 'auto' }}>
          Đề xuất đã được gửi vào hệ thống lead của Zalo · mã {rec.id}
        </span>
      </div>
    </div>
  )
}
