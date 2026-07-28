import type { InternalRecommendation } from '../types'
import { Recommendation } from './Recommendation'
import { IconAlert, IconBack, IconCheck } from '../components/icons'

/**
 * Cau nen hoi them, sinh tu `missingFields`.
 *
 * Tai lieu: thieu truong thi GAN CO, khong suy doan. Nhung account thi can biet
 * PHAI HOI GI de lap cho trong do — nen map thang sang cau hoi cu the.
 */
const QUESTION_FOR: Record<string, string> = {
  'Vai trò / người ra quyết định':
    'Ngoài anh/chị thì còn ai tham gia quyết định việc này không ạ?',
  'Thời gian dự kiến triển khai':
    'Anh/chị đang tính triển khai trong khoảng thời gian nào ạ?',
  'Ngân sách dự kiến':
    'Bên mình đã có khoảng ngân sách dự kiến cho việc này chưa ạ?',
  'Quy mô doanh thu':
    'Trung bình mỗi tháng bên mình phục vụ khoảng bao nhiêu khách / đơn ạ?',
}

export function AdvisorResult({
  rec,
  onRestart,
}: {
  rec: InternalRecommendation
  onRestart: () => void
}) {
  const q = rec.qualification

  return (
    <>
      <div className="card card--wide fade-in" style={{ marginBottom: 18 }}>
        <div className="advisor-head">
          <div>
            <div className="mini-label">Bản qualification nội bộ</div>
            <h2 className="advisor-head__title">{rec.input.companyName}</h2>
            <p className="advisor-head__sub">
              Mã lead {rec.id} · nguồn: nhân sự Zalo nhập hộ
            </p>
          </div>

          <div className={'verdict verdict--' + q.tone}>
            <span className="verdict__score">
              {q.score}
              <i>/100</i>
            </span>
            <span className="verdict__class">{q.classificationLabel}</span>
          </div>
        </div>

        <div className="advisor-grid">
          <div>
            <div className="mini-label">Điểm tính từ đâu</div>
            <div className="breakdown">
              {q.components.map((c) => {
                const pct = c.max ? Math.round((c.earned / c.max) * 100) : 0
                return (
                  <div key={c.key} className="comp">
                    <div className="comp__head">
                      <span>{c.label}</span>
                      <b>
                        {c.earned}
                        <i>/{c.max}</i>
                      </b>
                    </div>
                    <div className="comp__bar">
                      <div
                        className="comp__fill"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 80 ? 'var(--good)' : pct >= 40 ? 'var(--brand)' : 'var(--muted-2)',
                        }}
                      />
                    </div>
                    <p className="comp__detail">{c.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mini-label">Next best action</div>
            <div className="action-note">
              <b>{q.nextAction.label}</b>
              {q.nextAction.detail}
            </div>

            {q.gateBlocks.length > 0 && (
              <div className="action-note action-note--gate">
                <b>Đạt {q.score} điểm nhưng chưa lên SQL candidate</b>
                <ul>
                  {q.gateBlocks.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {q.missingFields.length > 0 ? (
              <>
                <div className="mini-label" style={{ marginTop: 20 }}>
                  Nên hỏi thêm
                </div>
                <ul className="ask-list">
                  {q.missingFields.map((f) => (
                    <li key={f}>
                      <span className="ask-list__tag">{f}</span>
                      <span className="ask-list__q">
                        {QUESTION_FOR[f] ?? `Hỏi thêm về: ${f.toLowerCase()}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="action-note" style={{ marginTop: 16 }}>
                <b>Thông tin còn thiếu</b>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconCheck size={12} /> Đã thu thập đủ các trường cần thiết.
                </span>
              </div>
            )}

            <div className="banner banner--info" style={{ marginTop: 20, marginBottom: 0 }}>
              <IconAlert size={16} />
              <span>
                Agent chỉ đề xuất tới mức <b>SQL candidate</b>. Việc chuyển sang SAL hoặc SQL do
                account xác nhận sau khi trao đổi trực tiếp với khách.
              </span>
            </div>
          </div>
        </div>

        <div className="result-foot" style={{ marginTop: 26, paddingTop: 22 }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRestart}>
            <IconBack size={13} /> Nhập khách khác
          </button>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 'auto' }}>
            Lead đã vào hàng đợi — xem ở tab Hàng đợi lead
          </span>
        </div>
      </div>

      {/* Phan duoi la dung thu khach se thay, de account biet minh dang noi gi
          voi khach. Khac ban SME o mot diem: co hien khoang chi phi. */}
      <Recommendation rec={rec} onRestart={onRestart} hideSteps />
    </>
  )
}
