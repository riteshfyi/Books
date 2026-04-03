import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export default function ActiveBookPill() {
  const { books, activeBookId, setActiveBook } = useAppStore()
  const [open, setOpen] = useState(false)
  const active = activeBookId ? books[activeBookId] : null
  const all = Object.values(books)

  return (
    <div style={{ position: 'relative' }}>
      <div className="active-pill" onClick={() => setOpen(v => !v)}>
        <span className="dot" />
        <span className="truncate" style={{ maxWidth: 160 }}>{active ? active.name : 'No active book'}</span>
        <span style={{ fontSize: 10, opacity: .7 }}>▼</span>
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 50, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', minWidth: 220, maxHeight: 300, overflowY: 'auto', boxShadow: 'var(--shadow)', padding: 6 }}>
            <div style={{ padding: '4px 8px 6px', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Switch active book</div>
            {all.length === 0 && <div style={{ padding: 8, fontSize: 12, color: 'var(--text3)' }}>No books yet</div>}
            {all.map(b => (
              <button key={b.id} onClick={() => { setActiveBook(b.id); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', background: b.id === activeBookId ? 'var(--accent-dim)' : 'transparent', border: 'none', borderRadius: 'var(--rs)', color: b.id === activeBookId ? 'var(--accent2)' : 'var(--text)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
                <span style={{ fontSize: 10 }}>{b.id === activeBookId ? '●' : '○'}</span>
                <span className="truncate">{b.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{b.pages.length}p</span>
              </button>
            ))}
            {activeBookId && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <button onClick={() => { setActiveBook(null); setOpen(false) }}
                  style={{ display: 'flex', width: '100%', padding: '7px 8px', background: 'transparent', border: 'none', borderRadius: 'var(--rs)', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}>
                  Clear active book
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
