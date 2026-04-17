import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { apiJson } from './api.js'

function mapNoteFromServer(note) {
  return {
    id: note.id,
    title: note.title ?? '',
    content: note.content ?? '',
    updatedAt: new Date(note.updatedAt).getTime(),
    isEditing: false,
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState([])
  const [lastCreatedId, setLastCreatedId] = useState(null)
  const textareaRefs = useRef({})

  const loadNotes = useCallback(async () => {
    const { notes: rows } = await apiJson('/api/notes')
    setNotes(rows.map((n) => ({ ...mapNoteFromServer(n) })))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { user: u } = await apiJson('/api/auth/me')
        if (cancelled) return
        setUser(u)
        if (u) await loadNotes()
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadNotes])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthSubmitting(true)
    try {
      const path =
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const { user: u } = await apiJson(path, {
        method: 'POST',
        body: { email: authEmail, password: authPassword },
      })
      setUser(u)
      setAuthPassword('')
      await loadNotes()
    } catch (e) {
      setAuthError(e.message)
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiJson('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setUser(null)
    setNotes([])
    setSearchTerm('')
  }

  const createNote = async () => {
    const { note } = await apiJson('/api/notes', {
      method: 'POST',
      body: { title: '', content: '' },
    })
    const mapped = { ...mapNoteFromServer(note), isEditing: true }
    setNotes((prev) => [mapped, ...prev])
    setLastCreatedId(mapped.id)
  }

  const updateNote = (id, key, value) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, [key]: value, updatedAt: Date.now() } : note,
      ),
    )
  }

  const enterEditMode = (id) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, isEditing: true } : note,
      ),
    )
    setLastCreatedId(id)
  }

  const saveNote = async (id) => {
    const note = notes.find((n) => n.id === id)
    if (!note) return
    const { note: updated } = await apiJson(`/api/notes/${id}`, {
      method: 'PATCH',
      body: { title: note.title, content: note.content },
    })
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...mapNoteFromServer(updated), isEditing: false }
          : n,
      ),
    )
  }

  const deleteNote = async (id) => {
    await apiJson(`/api/notes/${id}`, { method: 'DELETE' })
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  useEffect(() => {
    if (!lastCreatedId) return
    const el = textareaRefs.current[lastCreatedId]
    if (el) el.focus()
    setLastCreatedId(null)
  }, [notes, lastCreatedId])

  const filteredNotes = notes.filter((note) => {
    const searchable = `${note.title ?? ''} ${note.content ?? ''}`.toLowerCase()
    return searchable.includes(searchTerm.toLowerCase())
  })

  const formatDate = (timestamp) =>
    new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp))

  if (bootstrapping) {
    return (
      <main className="memo-app">
        <p className="loading-text">불러오는 중...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="memo-app">
        <section className="auth-panel memo-panel">
          <header className="auth-header">
            <h1>메모 관리</h1>
            <p>로그인 후 메모를 저장할 수 있습니다.</p>
          </header>
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === 'login' ? 'tab active' : 'tab'}
                onClick={() => {
                  setAuthMode('login')
                  setAuthError('')
                }}
              >
                로그인
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'tab active' : 'tab'}
                onClick={() => {
                  setAuthMode('register')
                  setAuthError('')
                }}
              >
                회원가입
              </button>
            </div>
            <label className="auth-label">
              이메일
              <input
                type="email"
                autoComplete="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </label>
            <label className="auth-label">
              비밀번호
              <input
                type="password"
                autoComplete={
                  authMode === 'register' ? 'new-password' : 'current-password'
                }
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            {authError ? (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            ) : null}
            <button
              type="submit"
              className="primary-btn auth-submit"
              disabled={authSubmitting}
            >
              {authMode === 'register' ? '가입하기' : '로그인'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="memo-app">
      <section className="memo-panel">
        <header className="memo-header">
          <div>
            <h1>메모 관리</h1>
            <p>최근 작성한 메모를 확인하고 관리하세요.</p>
          </div>
          <div className="header-actions">
            <span className="user-email" title={user.email}>
              {user.email}
            </span>
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              로그아웃
            </button>
            <input
              id="memo-search"
              type="text"
              placeholder="메모 검색"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="button" className="primary-btn" onClick={createNote}>
              새 메모
            </button>
          </div>
        </header>

        <section className="memo-list">
          {filteredNotes.length === 0 && (
            <p className="empty-message">
              검색 결과가 없습니다. 새 메모를 작성해보세요.
            </p>
          )}

          {filteredNotes.map((note) => {
            const title = (note.title ?? '').trim() || '제목 없는 메모'
            const content = (note.content ?? '').trim()
            const summary = content
              ? `${content.slice(0, 48)}${content.length > 48 ? '...' : ''}`
              : '메모 내용을 입력해 주세요.'

            return (
              <article key={note.id} className="memo-row">
                <div className="memo-main">
                  <strong>{title}</strong>
                  <p>{summary}</p>
                </div>

                <div className="memo-meta">
                  <div className="memo-date">작성일: {formatDate(note.updatedAt)}</div>
                  <div className="memo-actions">
                    {!note.isEditing && (
                      <button type="button" onClick={() => enterEditMode(note.id)}>
                        수정
                      </button>
                    )}
                    {note.isEditing && (
                      <button
                        type="button"
                        className="save-btn"
                        onClick={() => saveNote(note.id)}
                      >
                        저장
                      </button>
                    )}
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteNote(note.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {note.isEditing && (
                  <div className="editor-wrap">
                    <input
                      type="text"
                      value={note.title ?? ''}
                      onChange={(event) =>
                        updateNote(note.id, 'title', event.target.value)
                      }
                      placeholder="메모 제목을 입력하세요."
                    />
                    <textarea
                      ref={(element) => {
                        if (element) textareaRefs.current[note.id] = element
                      }}
                      value={note.content ?? ''}
                      onChange={(event) =>
                        updateNote(note.id, 'content', event.target.value)
                      }
                      placeholder="메모 내용을 입력하세요."
                    />
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}

export default App
