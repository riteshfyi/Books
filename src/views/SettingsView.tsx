import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const SHORTCUTS = ['CommandOrControl+Alt+S', 'CommandOrControl+Alt+P', 'CommandOrControl+Shift+F11', 'CommandOrControl+Shift+F12', 'F9', 'F10']
const fmt = (s: string) => s.replace('CommandOrControl', '⌘').replace('Shift', '⇧').replace('Alt', '⌥').replace(/\+/g, ' + ')

export default function SettingsView() {
  const { settings, updateSettings } = useAppStore()
  const [shortcut, setShortcut] = useState(settings.shortcut)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await updateSettings({ shortcut }); setSaved(true); setTimeout(() => setSaved(false), 2000) } finally { setSaving(false) }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px', maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Settings</h2>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 28 }}>Configure the screenshot shortcut and preferences</p>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Screenshot Shortcut</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Works globally even when Books is in the background</div>
        <div className="form-group">
          <label className="form-label">Choose shortcut</label>
          <select className="select" value={shortcut} onChange={e => setShortcut(e.target.value)}>
            {SHORTCUTS.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
          <span className="form-hint">Current: <strong style={{ color: 'var(--accent2)' }}>{fmt(settings.shortcut)}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={shortcut === settings.shortcut || saving}>{saving ? 'Saving…' : 'Save Shortcut'}</button>
          {saved && <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Shortcut updated</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>How Books Works</div>
        {[['1️⃣', 'Create a Book', 'Go to Home and click + New Book. Choose a name or use a collection for auto-naming.'],
          ['2️⃣', 'Set it Active', 'Click "Set Active" on a book — the pill in the top-right shows which book is active.'],
          ['3️⃣', 'Capture Screenshots', `Use ${fmt(settings.shortcut)} while watching a lecture to add screenshots automatically.`],
          ['4️⃣', 'Export as PDF', 'Open a book, reorder/delete pages in Edit, then click Export PDF.']
        ].map(([icon, title, desc]) => (
          <div key={String(title)} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
            <div><div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</div></div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(255,200,100,.1)', border: '1px solid rgba(255,200,100,.3)', borderRadius: 'var(--r)', fontSize: 12, color: 'rgba(255,220,120,.9)', lineHeight: 1.5 }}>
        <strong>macOS Permissions:</strong> Books needs <em>Screen Recording</em> permission (System Settings → Privacy &amp; Security → Screen Recording). The global shortcut may also need <em>Accessibility</em> access.
      </div>
    </div>
  )
}
