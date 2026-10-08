import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ScanLine, History, Leaf,
  CloudRain, ShieldCheck, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    emoji: '🏠' },
  { to: '/prediction',  icon: ScanLine,        label: 'Scan Leaf',    emoji: '🔬' },
  { to: '/history',     icon: History,         label: 'My Scans',     emoji: '📋' },
  { to: '/diseases',    icon: Leaf,            label: 'Disease Guide', emoji: '📚' },
  { to: '/weather-risk', icon: CloudRain,      label: 'Weather Risk', emoji: '🌦️' },
]

export default function Sidebar() {
  const { user, logout }     = useAuth()
  const navigate             = useNavigate()
  const location             = useLocation()
  const [open, setOpen]      = useState(false)
  const [mobile, setMobile]  = useState(window.innerWidth < 768)

  // Close mobile drawer on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Track viewport size
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <aside style={{
      position: 'fixed', top: 0, left: mobile ? (open ? 0 : '-100%') : 0,
      bottom: 0, width: 'var(--sidebar-w)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 200,
      overflowY: 'auto',
      transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Logo row */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
          }}>🍅</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              TomatoAI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
              Smart Disease Detection
            </div>
          </div>
        </div>
        {/* Close btn on mobile */}
        {mobile && (
          <button onClick={() => setOpen(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 6,
          }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        <div className="section-title" style={{ padding: '0 8px', marginBottom: 6, marginTop: 4 }}>
          Main Menu
        </div>

        {navItems.map(({ to, icon: Icon, label, emoji }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px',
            borderRadius: 'var(--radius)',
            marginBottom: 2, fontSize: 14, fontWeight: isActive ? 600 : 500,
            color: isActive ? '#fff' : 'var(--text-secondary)',
            background: isActive
              ? 'linear-gradient(135deg, var(--tomato), var(--tomato-d))'
              : 'transparent',
            transition: 'all 0.15s', textDecoration: 'none',
            boxShadow: isActive ? '0 2px 10px rgba(239,68,68,0.25)' : 'none',
          })}>
            {({ isActive }) => (
              <>
                <Icon size={17} style={{ flexShrink: 0 }} />
                {label}
                {isActive && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 8, background: 'rgba(255,255,255,0.25)',
                    padding: '2px 6px', borderRadius: 999, fontWeight: 700,
                  }}>•</span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="section-title" style={{ padding: '0 8px', marginTop: 14, marginBottom: 6 }}>
              Admin
            </div>
            <NavLink to="/admin" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius)',
              marginBottom: 2, fontSize: 14, fontWeight: isActive ? 600 : 500,
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'linear-gradient(135deg, var(--purple), #9333ea)' : 'transparent',
              transition: 'all 0.15s', textDecoration: 'none',
              boxShadow: isActive ? '0 2px 10px rgba(168,85,247,0.25)' : 'none',
            })}>
              <ShieldCheck size={17} />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px' }}>
        <NavLink to="/profile" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 'var(--radius)',
          marginBottom: 4, fontSize: 14, fontWeight: 500,
          color: 'var(--text-secondary)',
          background: isActive ? 'var(--bg-hover)' : 'transparent',
          textDecoration: 'none', transition: 'background 0.15s',
        })}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--tomato), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontWeight: 600, color: 'var(--text-primary)', fontSize: 13,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {user?.role === 'admin' ? '🛡️ Admin' : '🌱 Farmer'}
            </div>
          </div>
        </NavLink>

        <button onClick={handleLogout} className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13, padding: '8px 12px' }}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      {!mobile && sidebarContent}

      {/* Mobile: hamburger button */}
      {mobile && (
        <>
          <button
            onClick={() => setOpen(true)}
            style={{
              position: 'fixed', top: 14, left: 16, zIndex: 300,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-primary)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Drawer */}
          {sidebarContent}

          {/* Overlay */}
          {open && (
            <div
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 190,
                backdropFilter: 'blur(2px)',
              }}
            />
          )}
        </>
      )}
    </>
  )
}
