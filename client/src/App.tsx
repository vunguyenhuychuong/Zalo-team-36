import { useState } from 'react'
import { Header } from './components/Header'
import { DiscoveryForm } from './screens/DiscoveryForm'
import { Recommendation } from './screens/Recommendation'
import { LeadDashboard } from './screens/LeadDashboard'
import { InternalLogin } from './screens/InternalLogin'
import { AdvisorResult } from './screens/AdvisorResult'
import { UnauthorizedError, api, auth } from './api'
import type { DiscoveryInput, InternalRecommendation, Recommendation as Rec } from './types'

/**
 * Ba be mat, mot engine:
 *   form / result  — SME tu phuc vu. Cong khai. Khong thay diem, khong thay gia.
 *   advisor        — nhan su Zalo nhap ho khach. Can dang nhap.
 *   dashboard      — hang doi lead. Can dang nhap.
 */
export type View = 'form' | 'result' | 'advisor' | 'advisorResult' | 'dashboard'

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
  const [view, setView] = useState<View>('form')
  const [authed, setAuthed] = useState(() => !!auth.get())
  /** View muon vao sau khi dang nhap xong */
  const [pendingView, setPendingView] = useState<View | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingName, setPendingName] = useState('')

  const [rec, setRec] = useState<Rec | null>(null)
  const [advisorRec, setAdvisorRec] = useState<InternalRecommendation | null>(null)

  function navigate(next: View) {
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
    setView('form')
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
        onNavigate={navigate}
        onLogout={logout}
      />

      <main className="stage">
        {needsLogin && <InternalLogin onDone={onLoggedIn} />}

        {!needsLogin && view === 'dashboard' && <LeadDashboard onUnauthorized={() => {
          setAuthed(false)
          setPendingView('dashboard')
        }} />}

        {!needsLogin && view === 'result' && rec && (
          <Recommendation rec={rec} onRestart={() => navigate('form')} />
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
