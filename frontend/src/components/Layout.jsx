import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'

export default function Layout() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: mobile ? 0 : 'var(--sidebar-w)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header mobile={mobile} />
        <main style={{ paddingTop: 'var(--header-h)', flex: 1 }}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '12px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 12,
      color: 'var(--text-muted)',
      flexWrap: 'wrap',
      gap: 8,
    }}>
      <span>🍅 TomatoAI — AI-Based Disease Detection System</span>
      <span>ResNet50 · Grad-CAM · Smart Agriculture</span>
    </footer>
  )
}
