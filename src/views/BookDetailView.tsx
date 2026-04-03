import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function BookDetailView() {
  const { bookId } = useParams<{ bookId: string }>()
  const nav = useNavigate()
  const { books, activeBookId, setActiveBook, collections, loadData } = useAppStore()
  const [exporting, setExporting] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)

  const book = bookId ? books[bookId] : null
  if (!book) return <div className="empty-state" style={{ height: '100%' }}><span className="empty-icon">❌</span><h3>Book not found</h3><button className="btn btn-secondary" onClick={() => nav('/')}>Go Home</button></div>

  const isActive = book.id === activeBookId
  const pages = [...book.pages].sort((a, b) => a.order - b.order)
  const col = book.collectionId ? collections[book.collectionId] : null

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await window.booksAPI.exportBookPdf(book.id)
      if (result.error) alert(`Export failed: ${result.error}`)
    } finally { setExporting(false) }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (!bookId) return

    const files = Array.from(e.dataTransfer.files)
    const imagePaths = files
      .filter(f => f.type.startsWith('image/'))
      .map(f => f.path)
      .filter(Boolean)

    if (imagePaths.length === 0) return

    setImporting(true)
    try {
      await window.booksAPI.importImages(bookId, imagePaths)
      await loadData()
    } finally { setImporting(false) }
  }, [bookId, loadData])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--bg2)' }}>
        <button className="btn-icon" onClick={() => nav('/')}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 16, fontWeight: 600 }}>{book.name}</h1>
            {isActive && <span className="badge badge-green" style={{ fontSize: 10 }}>● ACTIVE</span>}
            {col && <span className="badge" style={{ fontSize: 10 }}>📁 {col.prefix}</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{pages.length} page{pages.length !== 1 ? 's' : ''} · Created {new Date(book.createdAt).toLocaleDateString()}</div>
        </div>
        <button className={`btn ${isActive ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setActiveBook(isActive ? null : book.id)}>
          {isActive ? '● Active' : '○ Set Active'}
        </button>
        <button className="btn btn-secondary" onClick={() => nav(`/book/${book.id}/edit`)}>✏️ Edit</button>
        <button className="btn btn-primary" onClick={handleExport} disabled={exporting || pages.length === 0}>
          {exporting ? '⏳ Exporting…' : '📄 Export PDF'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Grid with drop zone */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: 20, position: 'relative' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Drop overlay */}
          {dragging && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(108,99,255,.15)', border: '3px dashed var(--accent)',
              borderRadius: 'var(--r)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 8,
              pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 40 }}>📥</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent2)' }}>Drop images to add pages</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>They'll be added to the end in order</span>
            </div>
          )}

          {importing && (
            <div style={{ padding: '10px 14px', background: 'var(--accent-dim)', border: '1px solid var(--accent-dim2)', borderRadius: 'var(--r)', marginBottom: 16, fontSize: 13, color: 'var(--accent2)' }}>
              ⏳ Importing images…
            </div>
          )}

          {pages.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 60 }}>
              <span className="empty-icon">📷</span>
              <h3>No pages yet</h3>
              <p>{isActive ? 'Use the shortcut to add screenshots, or drag & drop images here' : 'Set this book as active, then use the shortcut'}</p>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>You can also drag & drop image files from Finder</p>
              {!isActive && <button className="btn btn-primary" onClick={() => setActiveBook(book.id)}>Set as Active Book</button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
              {pages.map((page, i) => (
                <div key={page.id} onClick={() => setSelected(selected === i ? null : i)} style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
                  <div style={{ position: 'relative', background: 'var(--bg4,#0d1b3e)', borderRadius: 'var(--rs)', overflow: 'hidden', border: selected === i ? '2px solid var(--accent)' : '2px solid transparent', aspectRatio: '16/10', transition: 'border-color .15s' }}>
                    <img
                      src={`file://${page.imagePath}`}
                      alt={`Page ${i+1}`}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 10, padding: '2px 5px', borderRadius: 3, fontWeight: 600 }}>{i+1}</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center' }}>{new Date(page.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview panel */}
        {selected !== null && pages[selected] && (
          <div style={{ width: 380, borderLeft: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Page {selected + 1}</span>
              <button className="btn-icon" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <img src={`file://${pages[selected].imagePath}`} alt={`Page ${selected+1}`} style={{ maxWidth: '100%', borderRadius: 'var(--rs)', boxShadow: 'var(--shadow)' }} />
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>
              Captured {new Date(pages[selected].capturedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
