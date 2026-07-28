import { useState } from 'react'
import { UnauthorizedError, api } from '../api'
import type { OpeningLine } from '../types'
import { IconAlert, IconCheck, IconSparkles } from './icons'

/**
 * Cau mo dau goi y cho account — field cuoi trong ban ban giao.
 *
 * Day la cho DUY NHAT trong app dung LLM. Diem so va giai phap do rule engine
 * quyet dinh, model chi dien dat lai thanh mot cau doc duoc. Neu model loi hoac
 * chua co key thi server roi ve mau dung san, nen o nay khong bao gio trong.
 */
export function OpeningLineBox({
  leadId,
  initial,
  onUnauthorized,
}: {
  leadId: string
  initial: OpeningLine | null
  onUnauthorized: () => void
}) {
  const [line, setLine] = useState<OpeningLine | null>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate(regenerate: boolean) {
    setBusy(true)
    setError(null)
    try {
      setLine(await api.openingLine(leadId, regenerate))
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized()
      else setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!line) return
    try {
      await navigator.clipboard.writeText(line.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Trình duyệt không cho copy. Bạn chọn tay giúp mình nhé.')
    }
  }

  return (
    <div className="opening">
      <div className="opening__head">
        <span className="mini-label" style={{ margin: 0 }}>
          Câu mở đầu gợi ý cho account
        </span>
        {line && (
          <span className={'opening__src opening__src--' + line.source}>
            {line.source === 'llm' ? `${line.model} viết` : 'mẫu dựng sẵn'}
          </span>
        )}
      </div>

      {!line && (
        <>
          <p className="opening__empty">
            Điểm số và giải pháp do rule engine quyết định. Phần này để model viết lại thành một câu
            mở đầu — không chèn con số, không nhắc điểm qualification.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={busy}
            onClick={() => generate(false)}
          >
            {busy ? (
              <>
                <span className="btn__spin" /> Đang soạn
              </>
            ) : (
              <>
                <IconSparkles size={14} /> Soạn câu mở đầu
              </>
            )}
          </button>
        </>
      )}

      {line && (
        <>
          <blockquote className="opening__text">{line.text}</blockquote>

          {line.reason && (
            <p className="opening__reason">
              <IconAlert size={13} /> {line.reason}
            </p>
          )}

          <div className="opening__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
              {copied ? (
                <>
                  <IconCheck size={12} /> Đã copy
                </>
              ) : (
                'Copy'
              )}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={busy}
              onClick={() => generate(true)}
            >
              {busy ? <span className="btn__spin" /> : 'Viết lại'}
            </button>
            {line.tokens != null && <span className="opening__meta">{line.tokens} token</span>}
          </div>
        </>
      )}

      {error && (
        <div className="banner banner--error" style={{ marginTop: 12, marginBottom: 0 }}>
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
