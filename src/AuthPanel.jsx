import { useState } from 'react'
import { apiJson } from './api'

export function AuthPanel({ onLoggedIn }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (mode === 'signup' && password !== password2) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }
    setPending(true)
    try {
      if (mode === 'signup') {
        const data = await apiJson('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        onLoggedIn(data.user)
      } else {
        const data = await apiJson('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        onLoggedIn(data.user)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <h1>메모 관리</h1>
        <p className="auth-lead">계정으로 로그인하거나 새로 가입하세요.</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            회원가입
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-email">이메일</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="auth-password">비밀번호</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {mode === 'signup' && (
            <>
              <label htmlFor="auth-password2">비밀번호 확인</label>
              <input
                id="auth-password2"
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={6}
              />
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="primary-btn auth-submit" disabled={pending}>
            {pending ? '처리 중…' : mode === 'signup' ? '가입하기' : '로그인'}
          </button>
        </form>
      </div>
    </section>
  )
}
