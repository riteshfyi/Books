import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ActiveBookPill from './ActiveBookPill'

export default function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()
  const loc = useLocation()
  const at = (p: string) => loc.pathname === p || (p !== '/' && loc.pathname.startsWith(p))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Titlebar */}
      <div className="titlebar-drag" style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px 0 80px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 4 }}>
        <div className="no-drag" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className={`nav-btn brand ${at('/') && !at('/book') ? 'active' : ''}`} onClick={() => nav('/')}>📚 Books</button>
          <button className={`nav-btn ${at('/collections') ? 'active' : ''}`} onClick={() => nav('/collections')}>Collections</button>
          <button className={`nav-btn ${at('/settings') ? 'active' : ''}`} onClick={() => nav('/settings')}>Settings</button>
        </div>
        <div className="no-drag" style={{ marginLeft: 'auto' }}>
          <ActiveBookPill />
        </div>
      </div>

      {/* Page */}
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
