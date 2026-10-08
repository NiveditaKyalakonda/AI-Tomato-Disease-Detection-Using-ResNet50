import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  return (
    <div className="not-found-page" style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)',
      }} />

      <div className="fade-in" style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 80, marginBottom: 8, lineHeight: 1 }}>🍅</div>
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #ef4444, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{ui('pageNotFound')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 340, margin: '0 auto 28px' }}>
          {ui('notFoundDescription')}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard">
            <button className="btn btn-primary btn-lg">
              🏠 {ui('goDashboard')}
            </button>
          </Link>
          <Link to="/prediction">
            <button className="btn btn-ghost btn-lg">
              🔬 {ui('scanLeaf')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
