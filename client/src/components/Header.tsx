import { IconArrowRight, IconBack, IconLock } from './icons'
import type { View } from '../App'

/**
 * Chi liet ke nhung muc DAN TOI mot man that.
 *
 * Truoc day co them "Sản phẩm Zalo" va "Tài nguyên" — hai muc trang tri copy
 * theo anh mau FPT.AI, ca hai cung tro ve view 'chat'. Chung gay hai loi thay
 * duoc: bam vao thi nhay sang man chat chang lien quan gi, va vi `aria-current`
 * so theo view nen ba muc cung sang mot luc.
 */
const PUBLIC_NAV: { label: string; view: View }[] = [
  { label: 'Trò chuyện', view: 'chat' },
  { label: 'Điền form', view: 'form' },
]

const INTERNAL_NAV: { label: string; view: View }[] = [
  { label: 'Tư vấn cho khách', view: 'advisor' },
  { label: 'Hàng đợi lead', view: 'dashboard' },
]

interface Props {
  view: View
  authed: boolean
  /** Dang o khu vuc noi bo (hoac dang o man dang nhap de vao đó) */
  internalArea: boolean
  onNavigate: (v: View) => void
  onLogout: () => void
  /** Luong chat bi khoa thi an tab do di, khong de nguoi dung bam vao roi bao loi */
  chatEnabled?: boolean
}

export function Header({ view, authed, internalArea, onNavigate, onLogout, chatEnabled = true }: Props) {
  const nav = (internalArea ? INTERNAL_NAV : PUBLIC_NAV).filter(
    (i) => chatEnabled || i.view !== 'chat',
  )

  return (
    <header className={'header' + (internalArea ? ' header--internal' : '')}>
      <div className="header__inner">
        <button className="logo" onClick={() => onNavigate('form')} type="button">
          <span className="logo__mark">Z</span>
          <span className="logo__text">
            <b>Business Copilot</b>
            <span>{internalArea ? 'Khu vực nội bộ' : 'Zalo for Business'}</span>
          </span>
        </button>

        <nav className="nav">
          {nav.map((item) => (
            <button
              key={item.label}
              type="button"
              className="nav__item"
              aria-current={
                internalArea
                  ? item.view === view ||
                    (item.view === 'advisor' && view === 'advisorResult')
                    ? 'true'
                    : 'false'
                  : item.view === view
                    ? 'true'
                    : 'false'
              }
              onClick={() => onNavigate(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {internalArea ? (
          <div className="header__actions">
            {authed && (
              <button type="button" className="btn-text" onClick={onLogout}>
                Đăng xuất
              </button>
            )}
            <button type="button" className="btn-ghost-pill" onClick={() => onNavigate('form')}>
              <IconBack size={13} /> Về trang SME
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost-pill" onClick={() => onNavigate('advisor')}>
            <IconLock size={12} /> Zalo Internal <IconArrowRight size={13} />
          </button>
        )}
      </div>
    </header>
  )
}
