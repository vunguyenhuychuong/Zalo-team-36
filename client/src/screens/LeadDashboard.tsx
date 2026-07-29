import { useEffect, useMemo, useState } from 'react'
import { UnauthorizedError, api } from '../api'
import { COMPANY_SIZES, INDUSTRIES, REGIONS, labelOf } from '../data/options'
import type { Lead, LeadStatus, StatusConfig } from '../types'
import { IconAlert, IconCheck, IconChevronDown, IconInbox, IconLock } from '../components/icons'
import { OpeningLineBox } from '../components/OpeningLineBox'

/** Thu tu hien nut, khop voi vong doi trong tai lieu. */
const STATUS_ORDER: LeadStatus[] = ['ACCEPTED', 'QUALIFIED', 'NURTURING', 'REJECTED']

type Filter = 'all' | 'SQL_CANDIDATE' | 'MQL' | 'LEAD'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'SQL_CANDIDATE', label: 'SQL candidate' },
  { key: 'MQL', label: 'MQL' },
  { key: 'LEAD', label: 'Lead' },
]

/** Thang diem 100 - hien to hon 2 thanh % cu vi day la con so chinh. */
function ScoreDial({ score, tone }: { score: number; tone: 'hot' | 'warm' | 'cool' }) {
  const color = tone === 'hot' ? 'var(--warn)' : tone === 'warm' ? 'var(--brand)' : 'var(--muted-2)'
  return (
    <div className="dial">
      <span className="dial__label">Điểm qualification</span>
      <div className="dial__row">
        <b style={{ color }}>{score}</b>
        <i>/100</i>
      </div>
      <div className="meter__bar">
        <div className="meter__fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

export function LeadDashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [cfg, setCfg] = useState<StatusConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  /** Loi tu choi chuyen trang thai, hien ngay tren the lead do */
  const [rejectMsg, setRejectMsg] = useState<{ id: string; text: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([api.leads(), api.statusConfig()])
      .then(([d, c]) => {
        if (!alive) return
        setLeads(d)
        setCfg(c)
      })
      .catch((e: Error) => {
        if (!alive) return
        // Token het han giua phien => quay ve man dang nhap, khong bao loi kho hieu
        if (e instanceof UnauthorizedError) onUnauthorized()
        else setError(e.message)
      })
    return () => {
      alive = false
    }
  }, [onUnauthorized])

  async function move(lead: Lead, to: LeadStatus) {
    setBusy(lead.id)
    setRejectMsg(null)
    try {
      const updated = await api.transitionLead(lead.id, to)
      setLeads((prev) => (prev ?? []).map((l) => (l.id === updated.id ? updated : l)))
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized()
      // Hien nguyen van ly do tu choi cua server - do la phan dang xem nhat
      else setRejectMsg({ id: lead.id, text: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  const kpis = useMemo(() => {
    const list = leads ?? []
    const by = (c: Lead['qualification']['classification']) =>
      list.filter((l) => l.qualification.classification === c).length
    return {
      total: list.length,
      sql: by('SQL_CANDIDATE'),
      mql: by('MQL'),
      // Metric chinh cua tai lieu do tren hoi thoai voi SME. Tach rieng so lead
      // do nhan su nhap ho de khong lam loang con so do.
      internal: list.filter((l) => l.source === 'internal_advisor').length,
      avg: list.length
        ? Math.round(list.reduce((s, l) => s + l.qualification.score, 0) / list.length)
        : 0,
    }
  }, [leads])

  const shown = useMemo(() => {
    const list = leads ?? []
    const filtered =
      filter === 'all' ? list : list.filter((l) => l.qualification.classification === filter)
    return [...filtered].sort((a, b) => b.qualification.score - a.qualification.score)
  }, [leads, filter])

  return (
    <div className="card card--wide fade-in">
      <div className="dash-head">
        <div>
          <h1>Lead mới từ agent</h1>
          <p>
            Doanh nghiệp đã qua luồng tư vấn của Copilot, kèm điểm qualification theo mô hình 100
            điểm và phân loại đề xuất. Agent chỉ đề xuất tới mức SQL candidate — SAL và SQL do
            account xác nhận.
          </p>
        </div>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted-2)',
          }}
        >
          Zalo internal · view nhân sự
        </span>
      </div>

      {error && (
        <div className="banner banner--error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="kpis">
        <div className="kpi">
          <span>Tổng lead</span>
          <b>{kpis.total}</b>
        </div>
        <div className="kpi kpi--hot">
          <span>SQL candidate</span>
          <b>{kpis.sql}</b>
        </div>
        <div className="kpi kpi--warm">
          <span>MQL</span>
          <b>{kpis.mql}</b>
        </div>
        <div className="kpi">
          <span>Điểm TB · {kpis.internal} nhân sự nhập</span>
          <b>{kpis.avg}</b>
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="chip"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {leads === null && !error && (
        <div className="empty">
          <p>Đang tải danh sách lead…</p>
        </div>
      )}

      {leads !== null && shown.length === 0 && (
        <div className="empty">
          <IconInbox size={36} />
          <p>Chưa có lead nào ở nhóm này. Thử gửi một form ở trang SME để xem lead chạy vào đây.</p>
        </div>
      )}

      <div className="lead-list">
        {shown.map((l) => {
          const q = l.qualification
          const isOpen = open === l.id
          return (
            <div className="lead" key={l.id}>
              <button
                type="button"
                className="lead__row"
                onClick={() => setOpen(isOpen ? null : l.id)}
              >
                <div className="lead__name">
                  <b>
                    {l.companyName}
                    {l.source === 'internal_advisor' && (
                      <span className="src-tag" title="Do nhân sự Zalo nhập hộ, không phải SME tự gửi">
                        nhân sự nhập
                      </span>
                    )}
                    {l.submissions > 1 && (
                      <span
                        className="src-tag src-tag--return"
                        title={`Đã gửi ${l.submissions} lần. Bản bàn giao được cập nhật, không tạo bản trùng.`}
                      >
                        quay lại · {l.submissions}
                      </span>
                    )}
                  </b>
                  <span>
                    {labelOf(INDUSTRIES, l.industry).split('—')[0].trim()} · {l.topSolution}{' '}
                    {l.topScore}%
                  </span>
                </div>

                <div className="lead__meta">
                  {labelOf(COMPANY_SIZES, l.companySize)}
                  <br />
                  {labelOf(REGIONS, l.region)}
                </div>

                <ScoreDial score={q.score} tone={q.tone} />

                <div className="lead__action">
                  <span className={'pill pill--' + q.tone}>
                    <span className="pill__dot" />
                    {q.classificationLabel}
                  </span>
                  {cfg && (
                    <span className={'status-chip status-chip--' + cfg.statuses[l.status].tone}>
                      {cfg.statuses[l.status].label}
                    </span>
                  )}
                  {q.gateBlocks.length > 0 && <span className="flag-gate">bị chặn ở cổng SQL</span>}
                </div>

                <span className={'lead__chev' + (isOpen ? ' lead__chev--open' : '')}>
                  <IconChevronDown size={17} />
                </span>
              </button>

              {isOpen && (
                <div className="lead__detail">
                  <div className="detail-block">
                    <div className="mini-label">Vấn đề doanh nghiệp nêu</div>
                    <p>{l.painPoint}</p>

                    <div className="action-note">
                      <b>Next best action · {q.nextAction.label}</b>
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

                    {q.missingFields.length > 0 && (
                      <div className="action-note action-note--missing">
                        <b>Thông tin còn thiếu</b>
                        {q.missingFields.join(' · ')}
                      </div>
                    )}

                    <div className="action-note">
                      <b>Liên hệ</b>
                      {l.contactName} · {l.phone} · {l.email}
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <OpeningLineBox
                        leadId={l.id}
                        initial={l.openingLine}
                        onUnauthorized={onUnauthorized}
                      />
                    </div>

                    {/* ---- Quyet dinh cua account ---- */}
                    {cfg && (
                      <>
                        <div className="mini-label" style={{ marginTop: 20 }}>
                          Quyết định của account
                        </div>
                        <p className="status-now">{cfg.statuses[l.status].detail}</p>

                        <div className="status-actions">
                          {STATUS_ORDER.map((s) => {
                            const allowed = cfg.transitions[l.status]?.includes(s)
                            const isNow = l.status === s
                            if (isNow) return null
                            return (
                              <button
                                key={s}
                                type="button"
                                className={'status-btn' + (allowed ? '' : ' status-btn--locked')}
                                disabled={!allowed || busy === l.id}
                                onClick={() => move(l, s)}
                                title={
                                  allowed
                                    ? undefined
                                    : l.status === 'NEW' && s === 'QUALIFIED'
                                      ? 'Phải tiếp nhận (SAL) trước khi xác minh lên SQL'
                                      : 'Không phải bước hợp lệ từ trạng thái hiện tại'
                                }
                              >
                                {!allowed && <IconLock size={11} />}
                                {cfg.statuses[s].label}
                              </button>
                            )
                          })}
                        </div>

                        {rejectMsg?.id === l.id && (
                          <div className="banner banner--error" style={{ marginTop: 12 }}>
                            <IconAlert size={16} />
                            <span>{rejectMsg.text}</span>
                          </div>
                        )}

                        {l.history.length > 0 && (
                          <>
                            <div className="mini-label" style={{ marginTop: 20 }}>
                              Nhật ký chuyển trạng thái
                            </div>
                            <ul className="hist">
                              {l.history.map((h, i) => (
                                <li key={i}>
                                  <IconCheck size={11} />
                                  <div>
                                    <b>
                                      {cfg.statuses[h.from].label} → {cfg.statuses[h.to].label}
                                    </b>
                                    <span>
                                      {new Date(h.at).toLocaleString('vi-VN')} · {h.by} · agent xếp{' '}
                                      {h.agentSaid}
                                    </span>
                                    {h.note && <em>{h.note}</em>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="detail-block">
                    <div className="mini-label">Điểm tính từ đâu — mô hình 100 điểm</div>
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
                                    pct >= 80
                                      ? 'var(--good)'
                                      : pct >= 40
                                        ? 'var(--brand)'
                                        : 'var(--muted-2)',
                                }}
                              />
                            </div>
                            <p className="comp__detail">{c.detail}</p>
                          </div>
                        )
                      })}
                      <div className="comp comp--total">
                        <div className="comp__head">
                          <span>Tổng</span>
                          <b>
                            {q.score}
                            <i>/100</i>
                          </b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
