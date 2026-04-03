import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import NewBookModal from '../components/NewBookModal'

export default function HomeView() {
  const { books, collections, recentBookIds, isLoading, settings, setActiveBook, activeBookId, deleteBook } = useAppStore()
  const nav = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  if (isLoading) return <div className="empty-state" style={{ height: '100%' }}><span className="empty-icon">📚</span><h3>Loading…</h3></div>

  const allBooks = Object.values(books)
  const recent = recentBookIds.map(id => books[id]).filter(Boolean).slice(0, 6)
  const filtered = search ? allBooks.filter(b => b.name.toLowerCase().includes(search.toLowerCase())) : []

  const colPrefix = (b: { collectionId: string | null }) => b.collectionId ? collections[b.collectionId]?.prefix : undefined

  const handleDelete = (e: React.MouseEvent, bookId: string, bookName: string) => {
    e.stopPropagation()
    const book = books[bookId]
    if (confirm(`Delete "${bookName}"? All ${book.pages.length} pages will be removed.`)) deleteBook(bookId)
  }

  const BookGrid = ({ list }: { list: typeof allBooks }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
      {list.map(b => {
        const isActive = b.id === activeBookId
        const first = b.pages[0]
        return (
          <div key={b.id} className="card pointer" onClick={() => nav(`/book/${b.id}`)}
            style={{ display: 'flex', flexDirection: 'column', border: isActive ? '1px solid var(--accent)' : undefined }}>
            {/* Preview */}
            <div style={{ height: 120, background: 'var(--bg4,#0d1b3e)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              {first
                ? <img src={`file://${first.imagePath}`} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 28 }}>📷</div>}
              {isActive && <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--accent)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 600 }}>ACTIVE</div>}
            </div>
            {/* Info */}
            <div style={{ padding: '10px 12px 12px' }}>
              <div className="truncate fw-600" style={{ fontSize: 13, marginBottom: 4 }}>{b.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{b.pages.length}p{colPrefix(b) ? ` · ${colPrefix(b)}` : ''}</span>
                <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" title={isActive ? 'Deactivate' : 'Set active'} onClick={() => setActiveBook(isActive ? null : b.id)} style={{ fontSize: 12, color: isActive ? 'var(--success)' : undefined }}>
                    {isActive ? '●' : '○'}
                  </button>
                  <button className="btn-icon danger" onClick={e => handleDelete(e, b.id, b.name)} style={{ fontSize: 12 }}>🗑</button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      {/* Search + new */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>🔍</span>
          <input className="input" placeholder="Search books…" style={{ paddingLeft: 32 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Book</button>
      </div>

      {/* Shortcut hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--accent-dim)', border: '1px solid var(--accent-dim2)', borderRadius: 'var(--r)', marginBottom: 24 }}>
        <span style={{ fontSize: 18 }}>⌨️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Screenshot shortcut is active</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>
            Press <kbd style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border)', fontSize: 11 }}>{settings.shortcut.replace('CommandOrControl', '⌘').replace('Shift', '⇧').replace(/\+/g, '+')}</kbd> anytime to capture
          </div>
        </div>
      </div>

      {/* Content */}
      {search ? (
        <>
          <div className="section-title" style={{ marginBottom: 12 }}>Search Results ({filtered.length})</div>
          {filtered.length === 0
            ? <div className="empty-state"><h3>No books found</h3></div>
            : <BookGrid list={filtered} />}
        </>
      ) : recent.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <span className="empty-icon">📚</span>
          <h3>No books yet</h3>
          <p>Create your first book, set it as active, then use the shortcut to capture screenshots while watching lectures</p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Create First Book</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="section-title">Recent Books</span>
            {allBooks.length > 6 && <button className="btn btn-ghost btn-sm" onClick={() => setSearch(' ')}>View all ({allBooks.length}) →</button>}
          </div>
          <BookGrid list={recent} />

          {Object.values(collections).length > 0 && (
            <>
              <div className="sep" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="section-title">Collections</span>
                <button className="btn btn-ghost btn-sm" onClick={() => nav('/collections')}>Manage →</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.values(collections).map(c => (
                  <button key={c.id} onClick={() => nav('/collections')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                    📁 {c.prefix} <span className="badge">{c.bookIds.length}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {showNew && <NewBookModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
