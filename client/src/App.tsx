import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { DiscoveryForm } from './screens/DiscoveryForm'
import { ChatDiscovery } from './screens/ChatDiscovery'
import { Recommendation } from './screens/Recommendation'
import { LeadDashboard } from './screens/LeadDashboard'
import { InternalLogin } from './screens/InternalLogin'
import { AdvisorResult } from './screens/AdvisorResult'
import { UnauthorizedError, api, auth } from './api'
import type { DiscoveryInput, InternalRecommendation, Recommendation as Rec } from './types'

/**
 * Bon be mat, mot engine:
 *   chat           — cua truoc dang hoi thoai. LLM hoi chuyen + trich xuat, code cham diem.
 *   form / result  — SME tu dien form. Cong khai. Khong thay diem, khong thay gia.
 *   advisor        — nhan su Zalo nhap ho khach. Can dang nhap.
 *   dashboard      — hang doi lead. Can dang nhap.
 */
export type View = 'chat' | 'form' | 'result' | 'advisor' | 'advisorResult' | 'dashboard'

const INTERNAL_VIEWS: View[] = ['advisor', 'advisorResult', 'dashboard']
export const isInternalView = (v: View) => INTERNAL_VIEWS.includes(v)

function Thinking({ company, internal }: { company: string; internal?: boolean }) {
  return (
    <div className="card fade-in">
      <div className="thinking">
        <div className="thinking__dots">
          <i />
          <i />
          <i />
        </div>
        <h3>
          {internal ? 'Đang chấm điểm qualification cho ' : 'Copilot đang phân tích nhu cầu của '}
          {company}
        </h3>
        <p>Đối chiếu ngành hàng · quy mô · mục tiêu với danh mục giải pháp Zalo…</p>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [authed, setAuthed] = useState(() => !!auth.get())
  /** View muon vao sau khi dang nhap xong */
  const [pendingView, setPendingView] = useState<View | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingName, setPendingName] = useState('')

  /**
   * Luong chat co dang bat khong. Tai lieu, muc Orchestration: phai co cach
   * "tam khoa luong do" khi agent noi sai — dat CHAT_ENABLED=false la xong.
   * Mac dinh true de neu goi /api/config that bai thi chat van chay.
   */
  const [chatOn, setChatOn] = useState(true)
  useEffect(() => {
    let alive = true
    api
      .config()
      .then((c) => {
        if (!alive) return
        setChatOn(c.chatEnabled)
        if (!c.chatEnabled) setView((v) => (v === 'chat' ? 'form' : v))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const [rec, setRec] = useState<Rec | null>(null)
  const [advisorRec, setAdvisorRec] = useState<InternalRecommendation | null>(null)

  function navigate(next: View) {
    if (next === 'chat' && !chatOn) return
    if (next === 'result' && !rec) return
    if (next === 'advisorResult' && !advisorRec) return

    // Chan o UI cho muot; server van chan doc lap o tang API.
    if (isInternalView(next) && !authed) {
      setPendingView(next)
      setError(null)
      window.scrollTo({ top: 0 })
      return
    }

    setPendingView(null)
    setError(null)
    setView(next)
    window.scrollTo({ top: 0 })
  }

  function onLoggedIn() {
    setAuthed(true)
    const target = pendingView ?? 'advisor'
    setPendingView(null)
    setView(target)
  }

  async function logout() {
    await api.logout()
    setAuthed(false)
    setAdvisorRec(null)
    setView('chat')
  }

  /** Xu ly token het han giua phien: quay lai man dang nhap thay vi bao loi kho hieu. */
  function handleError(e: unknown, retryView: View) {
    if (e instanceof UnauthorizedError) {
      setAuthed(false)
      setPendingView(retryView)
      setError(null)
      return
    }
    setError((e as Error).message)
  }

  async function submitSme(input: DiscoveryInput) {
    setSubmitting(true)
    setError(null)
    setPendingName(input.companyName)
    try {
      setRec(await api.analyze(input))
      setView('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAdvisor(input: DiscoveryInput) {
    setSubmitting(true)
    setError(null)
    setPendingName(input.companyName)
    try {
      setAdvisorRec(await api.internalAnalyze(input))
      setView('advisorResult')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      handleError(e, 'advisor')
    } finally {
      setSubmitting(false)
    }
  }

  const needsLogin = pendingView !== null && !authed

  return (
    <div className="app">
      <Header
        view={view}
        authed={authed}
        internalArea={needsLogin || isInternalView(view)}
        chatEnabled={chatOn}
        onNavigate={navigate}
        onLogout={logout}
      />

      <main className="stage">
        {needsLogin && <InternalLogin onDone={onLoggedIn} />}

        {!needsLogin && view === 'dashboard' && <LeadDashboard onUnauthorized={() => {
          setAuthed(false)
          setPendingView('dashboard')
        }} />}

        {/*
          Chat KHONG render co dieu kien: neu unmount thi useState bi xoa va ca
          cuoc hoi thoai mat sach khi nguoi dung bam sang tab khac roi quay lai.
          Giu mounted, chi an bang CSS.
        */}
        <div hidden={needsLogin || view !== 'chat' || !chatOn}>
          <ChatDiscovery onDone={submitSme} submitting={submitting} serverError={error} />
        </div>

        {!needsLogin && view === 'result' && rec && (
          <Recommendation rec={rec} onRestart={() => navigate('chat')} />
        )}

        {!needsLogin && view === 'advisorResult' && advisorRec && (
          <AdvisorResult
            rec={advisorRec}
            onRestart={() => navigate('advisor')}
            onUnauthorized={() => {
              setAuthed(false)
              setPendingView('advisorResult')
            }}
          />
        )}

        {!needsLogin &&
          (view === 'form' || view === 'advisor') &&
          (submitting ? (
            <Thinking
              company={pendingName || 'doanh nghiệp này'}
              internal={view === 'advisor'}
            />
          ) : (
            <DiscoveryForm
              onSubmit={view === 'advisor' ? submitAdvisor : submitSme}
              submitting={submitting}
              serverError={error}
              mode={view === 'advisor' ? 'internal' : 'sme'}
            />
          ))}
      </main>
    </div>
  )
}
