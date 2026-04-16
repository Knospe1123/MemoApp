import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState([])
  const [lastCreatedId, setLastCreatedId] = useState(null)
  const textareaRefs = useRef({})

  const createNote = () => {
    const newNote = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      isEditing: true,
      updatedAt: Date.now(),
    }

    setNotes((prevNotes) => [newNote, ...prevNotes])
    setLastCreatedId(newNote.id)
  }

  const updateNote = (id, key, value) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, [key]: value, updatedAt: Date.now() } : note,
      ),
    )
  }

  const enterEditMode = (id) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, isEditing: true } : note,
      ),
    )
    setLastCreatedId(id)
  }

  const saveNote = (id) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, isEditing: false } : note,
      ),
    )
  }

  const deleteNote = (id) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id))
  }

  useEffect(() => {
    if (!lastCreatedId) return

    const targetTextarea = textareaRefs.current[lastCreatedId]
    if (targetTextarea) targetTextarea.focus()

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

  return (
    <main className="memo-app">
      <section className="memo-panel">
        <header className="memo-header">
          <div>
            <h1>메모 관리</h1>
            <p>최근 작성한 메모를 확인하고 관리하세요.</p>
          </div>
          <div className="header-actions">
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
