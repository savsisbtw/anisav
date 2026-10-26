import { useState, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../lib/AuthContext'

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { login, error, clearError } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(loginValue, password, remember)
      onClose()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="overlay fade-in" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Вход в AniLiberty</h2>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 12.5 }}>
          Логин и пароль от аккаунта на aniliberty.top
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <input
            value={loginValue}
            onChange={(e) => {
              setLoginValue(e.target.value)
              clearError()
            }}
            placeholder="Логин или email"
            autoFocus
            className="input"
          />
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearError()
            }}
            type="password"
            placeholder="Пароль"
            className="input"
          />
          <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Запомнить меня
          </label>
        </div>

        {error && <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting || !loginValue || !password}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {submitting ? '...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
