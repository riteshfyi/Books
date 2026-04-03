import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function NewBookModal({ onClose }: { onClose: () => void }) {
  const { collections, createBook, getNextBookName } = useAppStore()
  const nav = useNavigate()
  const [mode, setMode] = useState<'standalone' | 'collection'>('standalone')
  const [name, setName] = useState('')
  const [colId, setColId] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const cols = Object.values(collections)

  const handleColChange = async (id: string) => {
    setColId(id)
    if (id) { const n = await getNextBookName(id); setPreview(n || '') }
    else setPreview('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalName = mode === 'collection' ? preview : name.trim()
    if (!finalName) return
    if (mode === 'collection' && !colId) return
    setLoading(true)
    try {
      const book = await createBook(finalName, mode === 'collection' ? colId : null)
      onClose()
      nav(`/book/${book.id}`)
    } finally { setLoading(false) }
  }

  const canSubmit = mode === 'standalone' ? name.trim().length > 0 : (colId !== '' && preview !== '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">New Book</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--rs)', padding: 3 }}>
          {(['standalone', 'collection'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 'var(--rs)', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .15s' }}>
              {m === 'standalone' ? '📄 Standalone' : '📁 In Collection'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'standalone' ? (
            <div className="form-group">
              <label className="form-label">Book Name</label>
              <input className="input" autoFocus placeholder="e.g. Lecture 1 Notes" value={name} onChange={e => setName(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Collection</label>
                {cols.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--text3)', padding: 8, background: 'var(--surface)', borderRadius: 'var(--rs)' }}>No collections yet — create one first in the Collections tab.</div>
                  : <select className="select" value={colId} onChange={e => handleColChange(e.target.value)} autoFocus>
                      <option value="">Select collection…</option>
                      {cols.map(c => <option key={c.id} value={c.id}>{c.prefix} (next: {c.prefix}_{c.nextCounter})</option>)}
                    </select>}
              </div>
              {preview && (
                <div className="form-group">
                  <label className="form-label">Book will be named</label>
                  <div style={{ padding: '7px 11px', background: 'var(--surface)', borderRadius: 'var(--rs)', fontSize: 13, color: 'var(--accent2)', fontWeight: 500 }}>{preview}</div>
                </div>
              )}
            </>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit || loading}>{loading ? 'Creating…' : 'Create Book'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
