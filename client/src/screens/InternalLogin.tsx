import { useState } from 'react'
import { api } from '../api'
import { Field, TextInput } from '../components/ui'
import { IconAlert, IconArrowRight, IconLock } from '../components/icons'

export function InternalLogin({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      setError('Nhập mật khẩu nội bộ')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.login(password)
      onDone()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card card--narrow fade-in" onSubmit={submit} noValidate>
      <div className="login-mark">
        <IconLock size={20} />
      </div>

      <h1 className="card__title" style={{ fontSize: 22, marginBottom: 6 }}>
        Khu vực nội bộ Zalo
      </h1>
      <p className="card__lead" style={{ marginBottom: 26 }}>
        Phần này hiển thị điểm qualification, công thức chấm điểm và khoảng chi phí — chỉ dành cho
        nhân sự Zalo.
      </p>

      {error && (
        <div className="banner banner--error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <Field label="Mật khẩu nội bộ" required htmlFor="internal-password">
        <TextInput
          id="internal-password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu"
          invalid={!!error}
        />
      </Field>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={busy}
        style={{ marginTop: 22, width: '100%', justifyContent: 'center' }}
      >
        {busy ? (
          <>
            <span className="btn__spin" /> Đang kiểm tra
          </>
        ) : (
          <>
            Đăng nhập <IconArrowRight />
          </>
        )}
      </button>
    </form>
  )
}
