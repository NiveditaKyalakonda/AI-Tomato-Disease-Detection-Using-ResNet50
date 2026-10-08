import { useLocation, Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const routeTitles = {
  '/dashboard':    { title: 'Dashboard',     emoji: '🏠' },
  '/prediction':   { title: 'Scan Leaf',     emoji: '🔬' },
  '/predict':      { title: 'Scan Leaf',     emoji: '🔬' },
  '/history':      { title: 'Scan History',  emoji: '📋' },
  '/diseases':     { title: 'Disease Guide', emoji: '📚' },
  '/weather-risk': { title: 'Weather Risk',  emoji: '🌦️' },
  '/weather':      { title: 'Weather Risk',  emoji: '🌦️' },
  '/profile':      { title: 'My Profile',    emoji: '👤' },
  '/admin':        { title: 'Admin Panel',   emoji: '🛡️' },
}

export default function Header({ mobile = false }) {
  const { pathname } = useLocation()
  const { user }     = useAuth()

  const match = Object.entries(routeTitles).find(([k]) => pathname.startsWith(k))
  const { title = 'TomatoAI', emoji = '🍅' } = match?.[1] ?? {}

  return (
    <header style={{
      position: 'fixed',
      top: 0, right: 0,
      left: mobile ? 0 : 'var(--sidebar-w)',
      height: 'var(--header-h)',
      background: 'rgba(15,23,42,0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: mobile ? '0 16px 0 60px' : '0 24px',
      justifyContent: 'space-between',
      zIndex: 90,
    }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!mobile && (
          <Link to="/prediction">
            <button className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              <ScanLine size={13} />
              New Scan
            </button>
          </Link>
        )}

        {/* User chip */}
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer', transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--tomato), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!mobile && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
