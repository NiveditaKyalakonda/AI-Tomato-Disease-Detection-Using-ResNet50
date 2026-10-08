import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, CheckCircle, AlertTriangle, TrendingUp, CloudRain, Clock, ChevronRight } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import DiseaseTag from '../components/DiseaseTag'
import { SkeletonDashboard } from '../components/Skeleton'
import { useLanguage } from '../context/LanguageContext'

const COLORS = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4']

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonDashboard />

  const stats = data?.stats || {}
  const recent = data?.recent_predictions || []
  const weather = data?.weather_risk || {}
  const trends = data?.trends || []

  const healthPct = stats.total_scans > 0
    ? Math.round((stats.healthy_count / stats.total_scans) * 100)
    : 0

  const topDiseases = (stats.disease_breakdown || [])
    .filter(d => !d._id?.includes('healthy'))
    .slice(0, 5)
    .map((d, i) => ({ name: d._id?.replace('Tomato_','').replace(/_/g,' '), value: d.count, color: COLORS[i] }))

  return (
    <div className="fade-in dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          {ui(getGreeting())}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14 }}>{ui("fieldOverview")}</p>
      </div>

      {/* Weather alert */}
      {weather.overall && (
        <div style={{
          marginBottom: 24,
          padding: '14px 18px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${weather.overall === 'High' ? 'rgba(239,68,68,0.3)' : weather.overall === 'Medium' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
          background: weather.overall === 'High' ? 'rgba(239,68,68,0.07)' : weather.overall === 'Medium' ? 'rgba(245,158,11,0.07)' : 'rgba(34,197,94,0.07)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <CloudRain size={20} color={weather.overall === 'High' ? '#ef4444' : weather.overall === 'Medium' ? '#f59e0b' : '#22c55e'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
              {ui("diseaseRisk")}: <span style={{ color: weather.overall === 'High' ? '#ef4444' : weather.overall === 'Medium' ? '#f59e0b' : '#22c55e' }}>{localizedRisk(weather.overall, ui)}</span>
              {weather.weather?.city && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — {weather.weather.city}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{weather.alert}</div>
          </div>
          <Link to="/weather-risk"><button className="btn btn-ghost btn-sm">Details</button></Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="🔬" label={ui("totalScans")} value={stats.total_scans || 0} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
        <StatCard icon="✅" label={ui("healthyLeaves")} value={stats.healthy_count || 0} color="#22c55e" bg="rgba(34,197,94,0.1)" />
        <StatCard icon="⚠️" label={ui("diseasesFound")} value={stats.diseased_count || 0} color="#ef4444" bg="rgba(239,68,68,0.1)" />
        <StatCard icon="📊" label={ui("healthRate")} value={`${healthPct}%`} color="#a855f7" bg="rgba(168,85,247,0.1)" />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Health donut */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{ui("healthOverview")}</h3>
          {stats.total_scans > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap: 24 }}>
              <div style={{ width: 140, height: 140 }}>
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="60%" outerRadius="90%"
                    data={[{ value: healthPct, fill: '#22c55e' }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#1e293b' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#22c55e' }}>{healthPct}%</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ui("healthy")}</div>
                <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 6 }}>
                  <LegendItem color="#22c55e" label={`${ui("healthy")} (${stats.healthy_count})`} />
                  <LegendItem color="#ef4444" label={`${ui("diseased")} (${stats.diseased_count})`} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState text={ui("noScans")} icon="🔬" />
          )}
        </div>

        {/* Top diseases */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{ui("topDiseases")}</h3>
          {topDiseases.length > 0 ? (
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={topDiseases} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    formatter={v => [`${v} ${ui("scansCount")}`]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {topDiseases.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text={ui("noDiseaseData")} icon="🌿" />
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <QuickAction to="/prediction" icon="🔬" title={ui("scanNewLeaf")} desc={ui("scanNewDescription")} color="#ef4444" />
        <QuickAction to="/diseases" icon="📚" title={ui("diseaseGuide")} desc={ui("diseaseGuideDescription")} color="#3b82f6" />
        <QuickAction to="/weather-risk" icon="🌦️" title={ui("weatherRisk")} desc={ui("weatherRiskDescription")} color="#a855f7" />
      </div>

      {trends.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>{ui("weatherTrend")}</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {trends.map((item, index) => (
              <div key={`${item.date || index}-${item.disease}`} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>{item.disease}</span>
                <span>{item.temperature ?? '—'}°C / {item.humidity ?? '—'}%</span>
                <span>{item.rainfall ?? 0} mm rain</span>
                <strong style={{ color: item.risk_level === 'High' || item.risk_level === 'Very High' ? '#ef4444' : '#f59e0b' }}>{item.risk_level || '—'} ({item.risk_score ?? 0})</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent scans */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
          <h3>{ui("recentScans")}</h3>
          <Link to="/history"><button className="btn btn-ghost btn-sm">{ui("viewAll")}</button></Link>
        </div>
        {recent.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
            {recent.map(p => <RecentItem key={p._id} pred={p} />)}
          </div>
        ) : (
          <EmptyState text={ui("noScans")} icon="🌿" />
        )}
      </div>
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

function LegendItem({ color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      {label}
    </div>
  )
}

function QuickAction({ to, icon, title, desc, color }) {
  return (
    <Link to={to}>
      <div className="card" style={{
        cursor: 'pointer', transition: 'all 0.2s',
        borderColor: 'transparent',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
        <h4 style={{ marginBottom: 4, color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ fontSize: 12 }}>{desc}</p>
      </div>
    </Link>
  )
}

function RecentItem({ pred }) {
  const isHealthy = pred.is_healthy
  return (
    <Link to={`/history/${pred._id}`}>
      <div style={{
        display:'flex', alignItems:'center', gap: 12,
        padding: '10px 12px', borderRadius: 'var(--radius)',
        transition: 'background 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: isHealthy ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18, flexShrink: 0,
        }}>
          {isHealthy ? '✅' : '⚠️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
            {pred.disease_name || pred.disease?.replace('Tomato_','').replace(/_/g,' ')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {pred.created_at ? new Date(pred.created_at).toLocaleDateString() : 'Unknown date'}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: pred.confidence > 75 ? '#22c55e' : pred.confidence > 50 ? '#f59e0b' : '#ef4444' }}>
            {pred.confidence?.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pred.severity || 'N/A'}</div>
        </div>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </Link>
  )
}

function EmptyState({ text, icon }) {
  return (
    <div style={{ textAlign:'center', padding: '32px 0', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{text}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'goodMorning' : h < 18 ? 'goodAfternoon' : 'goodEvening'
}

function localizedRisk(level, ui) {
  return ui(({ Low: "riskLow", Moderate: "riskMedium", Medium: "riskMedium", High: "riskHigh", "Very High": "riskVeryHigh" })[level] || "riskLow")
}
