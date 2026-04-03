import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverlay, DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '../store/useAppStore'
import { Page } from '../types'

function SortablePage({ page, index, onDelete }: { page: Page; index: number; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'grab' }} {...attributes} {...listeners}>
        <div style={{ position: 'relative', background: 'var(--bg4,#0d1b3e)', borderRadius: 'var(--rs)', overflow: 'hidden', border: '2px solid var(--border)', aspectRatio: '16/10' }}>
          <img src={`file://${page.imagePath}`} alt={`Page ${index+1}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,.5)', color: '#ccc', fontSize: 10, padding: '2px 4px', borderRadius: 3 }}>⠿</div>
          <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 10, padding: '2px 5px', borderRadius: 3, fontWeight: 600 }}>{index+1}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{new Date(page.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button className="btn-icon danger" style={{ fontSize: 11, padding: '2px 4px' }}
            onClick={e => { e.stopPropagation(); onDelete(page.id) }}
            onPointerDown={e => e.stopPropagation()} title="Delete page">🗑</button>
        </div>
      </div>
    </div>
  )
}

export default function EditBookView() {
  const { bookId } = useParams<{ bookId: string }>()
  const nav = useNavigate()
  const { books, reorderPages, deletePage } = useAppStore()
  const book = bookId ? books[bookId] : null
  const [pages, setPages] = useState<Page[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (book) { setPages([...book.pages].sort((a, b) => a.order - b.order)); setHasChanges(false) }
  }, [book])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  if (!book) return <div className="empty-state" style={{ height: '100%' }}><span className="empty-icon">❌</span><h3>Book not found</h3><button className="btn btn-secondary" onClick={() => nav('/')}>Go Home</button></div>

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    if (e.over && e.active.id !== e.over.id) {
      setPages(items => {
        const old = items.findIndex(p => p.id === e.active.id)
        const next = items.findIndex(p => p.id === e.over!.id)
        return arrayMove(items, old, next)
      })
      setHasChanges(true)
    }
  }

  const handleDelete = async (pageId: string) => {
    if (!confirm('Delete this page permanently?')) return
    if (!bookId) return
    await deletePage(bookId, pageId)
    setPages(prev => prev.filter(p => p.id !== pageId))
  }

  const handleSave = async () => {
    if (!bookId) return
    setSaving(true)
    try { await reorderPages(bookId, pages.map(p => p.id)); setHasChanges(false); nav(`/book/${bookId}`) } finally { setSaving(false) }
  }

  const activePage = activeId ? pages.find(p => p.id === activeId) : null
  const activeIdx = activeId ? pages.findIndex(p => p.id === activeId) : -1

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--bg2)' }}>
        <button className="btn-icon" onClick={() => nav(`/book/${bookId}`)}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600 }}>Edit: {book.name}</h1>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Drag pages to reorder · 🗑 to delete</p>
        </div>
        <button className="btn btn-secondary" onClick={() => nav(`/book/${bookId}`)}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? 'Saving…' : hasChanges ? '💾 Save Order' : '✓ Saved'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {pages.length === 0
          ? <div className="empty-state" style={{ marginTop: 60 }}><span className="empty-icon">📷</span><h3>No pages</h3></div>
          : (
            <>
              <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--text3)' }}>{pages.length} page{pages.length !== 1 ? 's' : ''} · Drag to reorder</div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
                <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
                    {pages.map((p, i) => <SortablePage key={p.id} page={p} index={i} onDelete={handleDelete} />)}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activePage && (
                    <div style={{ background: 'var(--bg4,#0d1b3e)', borderRadius: 'var(--rs)', overflow: 'hidden', border: '2px solid var(--accent)', aspectRatio: '16/10', boxShadow: 'var(--shadow)', cursor: 'grabbing', position: 'relative' }}>
                      <img src={`file://${activePage.imagePath}`} alt={`Page ${activeIdx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </>
          )}
      </div>
    </div>
  )
}
