import { useEffect, useState } from 'react'
import { Users, ScanLine, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react'
import { adminAPI } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useLanguage } from '../context/LanguageContext'

const COLORS = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4']

export default function Admin() {
  const { t, language } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [reqs, setReqs]     = useState([])
  const [tab, setTab]       = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.users(), adminAPI.expertRequests()])
      .then(([s, u, r]) => {
        setStats(s.data.stats || {})
        setUsers(u.data.users || [])
        setReqs(r.data.requests || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop: 80 }}><div className="spinner" /></div>

  const topDiseases = (stats?.top_diseases || [])
    .filter(d => d._id)
    .map((d, i) => ({
      name: d._id?.replace('Tomato_','').replace(/_/g,' '),
      count: d.count,
      color: COLORS[i % COLORS.length],
    }))

  return (
    <div className="fade-in admin-page">
      <div className="page-header">
        <span className="section-kicker">{ui('systemManagement')}</span>
        <h1>{ui('administration')}</h1>
        <p>{ui('adminDescription')}</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 6, marginBottom: 24, borderBottom:'1px solid var(--border)', paddingBottom: 12 }}>
        {['overview','users','expert-requests'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t)}>
            {t === 'overview' ? `📊 ${ui('overview')}` : t === 'users' ? `👥 ${ui('users')}` : `💬 ${ui('expertRequests')}`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="fade-in">
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <StatCard icon="👥" label={ui('totalUsers')} value={stats?.total_users || 0} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
            <StatCard icon="🔬" label={ui('totalPredictions')} value={stats?.total_predictions || 0} color="#ef4444" bg="rgba(239,68,68,0.1)" />
            <StatCard icon="💬" label={ui('expertRequests')} value={reqs.length} color="#a855f7" bg="rgba(168,85,247,0.1)" />
          </div>

          {topDiseases.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>{ui('topDiseases')} ({ui('users')})</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={topDiseases} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill:'#94a3b8' }} />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill:'#94a3b8' }} />
                    <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [`${v} scans`]} />
                    <Bar dataKey="count" radius={[0,4,4,0]}>
                      {topDiseases.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="fade-in">
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>{ui('registeredUsers')} ({users.length})</h3>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {[ui('fullName'),ui('email'),ui('role'),ui('language'),ui('joined')].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'10px 12px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding:'10px 12px', color:'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role || 'user'}</span>
                      </td>
                      <td style={{ padding:'10px 12px', color:'var(--text-muted)' }}>{u.language || 'en'}</td>
                      <td style={{ padding:'10px 12px', color:'var(--text-muted)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(({ en:'en-IN',kn:'kn-IN',hi:'hi-IN',te:'te-IN',ta:'ta-IN',ml:'ml-IN',mr:'mr-IN',bn:'bn-IN' })[language]) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontSize: 14 }}>{ui('noUsers')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'expert-requests' && (
        <div className="fade-in">
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>{ui('consultationRequests')} ({reqs.length})</h3>
            {reqs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>
                <MessageCircle size={32} style={{ marginBottom: 8, display:'block', margin:'0 auto 8px' }} />
                {ui('noExpertRequests')}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                {reqs.map((r, i) => (
                  <div key={i} className="card card-sm" style={{ background:'var(--bg-primary)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color:'var(--text-muted)' }}>{ui('request')} #{i+1}</span>
                      <span className={`badge ${r.status === 'pending' ? 'badge-amber' : r.status === 'resolved' ? 'badge-green' : 'badge-gray'}`}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color:'var(--text-secondary)', marginBottom: 4 }}>
                      {ui('predictionId')}: <code style={{ fontSize: 11 }}>{r.prediction_id}</code>
                    </div>
                    {r.message && <p style={{ fontSize: 13 }}>{r.message}</p>}
                    <div style={{ fontSize: 11, color:'var(--text-muted)', marginTop: 6 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString(({ en:'en-IN',kn:'kn-IN',hi:'hi-IN',te:'te-IN',ta:'ta-IN',ml:'ml-IN',mr:'mr-IN',bn:'bn-IN' })[language]) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
