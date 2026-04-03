import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { Collection } from '../types'

export default function CollectionsView() {
  const { collections, books, createCollection, updateCollection, deleteCollection } = useAppStore()
  const nav = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [newPrefix, setNewPrefix] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editPrefix, setEditPrefix] = useState('')
  const [loading, setLoading] = useState(false)

  const cols = Object.values(collections).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = newPrefix.trim().replace(/\s+/g, '_')
    if (!p) return
    setLoading(true)
    try { await createCollection(p); setNewPrefix(''); setShowNew(false) } finally { setLoading(false) }
  }

  const handleEdit = async (col: Collection) => {
    const p = editPrefix.trim().replace(/\s+/g, '_')
    if (!p || p === col.prefix) { setEditId(null); return }
    await updateCollection(col.id, p)
    setEditId(null)
  }

  const handleDelete = async (col: Collection) => {
    const msg = col.bookIds.length > 0 ? `Delete "${col.prefix}"? Its ${col.bookIds.length} book(s) will become standalone.` : `Delete "${col.prefix}"?`
    if (!confirm(msg)) return
    await deleteCollection(col.id)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Collections</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Group books with a prefix. New books auto-name as <code style={{ background: 'var(--surface)', padding: '1px 4px', borderRadius: 3 }}>prefix_1</code>, <code style={{ background: 'var(--surface)', padding: '1px 4px', borderRadius: 3 }}>prefix_2</code>…
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>+ New Collection</button>
      </div>

      {showNew && (
        <div className="card" style={{ padding: 16, marginBottom: 20, border: '1px solid var(--accent-dim2)' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Prefix</label>
              <input className="input" autoFocus placeholder="e.g. nptel_owc" value={newPrefix} onChange={e => setNewPrefix(e.target.value)} />
              <span className="form-hint">Books will be named: {newPrefix.trim() || 'prefix'}_1, {newPrefix.trim() || 'prefix'}_2, …</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!newPrefix.trim() || loading}>{loading ? 'Creating…' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          </form>
        </div>
      )}

      {cols.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <span className="empty-icon">📁</span>
          <h3>No collections yet</h3>
          <p>Collections let you organize books with a prefix like <em>nptel_owc_1</em>, <em>nptel_owc_2</em></p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>Create First Collection</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cols.map(col => {
            const colBooks = col.bookIds.map(id => books[id]).filter(Boolean)
            return (
              <div key={col.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>📁</span>
                  {editId === col.id ? (
                    <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="input" autoFocus value={editPrefix} onChange={e => setEditPrefix(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(col); if (e.key === 'Escape') setEditId(null) }} style={{ maxWidth: 240 }} />
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(col)}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{col.prefix}</span>
                        <span className="badge">{colBooks.length} book{colBooks.length !== 1 ? 's' : ''}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>· Next: {col.prefix}_{col.nextCounter}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(col.id); setEditPrefix(col.prefix) }}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(col)}>🗑 Delete</button>
                  </div>
                </div>
                {colBooks.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {colBooks.map(b => (
                      <button key={b.id} onClick={() => nav(`/book/${b.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                        📄 {b.name} <span style={{ fontSize: 10, color: 'var(--text3)' }}>{b.pages.length}p</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
