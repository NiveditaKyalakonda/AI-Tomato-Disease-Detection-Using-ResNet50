import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trash2, ChevronRight, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { historyAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

export default function History() {
  const { t } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [preds, setPreds]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all') // all | healthy | diseased

  const load = () => {
    setLoading(true)
    historyAPI.list({ limit: 100 })
      .then(res => setPreds(res.data.predictions || []))
      .catch(() => toast.error(ui('historyLoadFailed')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(ui('deleteScanConfirm'))) return
    try {
      await historyAPI.delete(id)
      setPreds(p => p.filter(x => x._id !== id))
      toast.success(ui('scanDeleted'))
    } catch {
      toast.error(ui('deleteFailed'))
    }
  }

  const filtered = preds.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || p.disease_name?.toLowerCase().includes(q)
      || p.disease?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all' ||
      (filter === 'healthy' && p.is_healthy) ||
      (filter === 'diseased' && !p.is_healthy)
    return matchSearch && matchFilter
  })

  return (
    <div className="fade-in history-page">
      <div className="page-header">
        <span className="section-kicker">{ui('historyKicker')}</span>
        <h1>{ui('scanHistory')}</h1>
        <p>{ui('historyDescription')}</p>
      </div>

      {/* Controls */}
      <div className="history-controls" style={{ display:'flex', gap: 12, marginBottom: 20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position:'absolute', left: 12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="input" aria-label={ui('searchDisease')} placeholder={ui('searchDisease')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display:'flex', gap: 6 }}>
          {['all','healthy','diseased'].map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setFilter(f)}>
              {ui(f)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔬</div>
          <h3 style={{ marginBottom: 8 }}>{ui('noScansFound')}</h3>
          <p style={{ fontSize: 14, marginBottom: 20 }}>{preds.length === 0 ? ui('noScansYet') : ui('noMatchFilters')}</p>
          {preds.length === 0 && (
            <Link to="/prediction"><button className="btn btn-primary">{ui('scanFirstLeaf')}</button></Link>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
          {filtered.map(p => <HistoryCard key={p._id} pred={p} onDelete={handleDelete} />)}
        </div>
      )}

      {preds.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', textAlign:'center' }}>
          {filtered.length} / {preds.length} {ui('scansCount')}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ pred, onDelete }) {
  const { t, language } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const isHealthy = pred.is_healthy
  const confColor = pred.confidence > 75 ? '#22c55e' : pred.confidence > 50 ? '#f59e0b' : '#ef4444'
  const name = pred.disease_name || pred.disease?.replace('Tomato_','').replace(/_/g,' ')
  const dateStr = pred.created_at ? new Date(pred.created_at).toLocaleDateString(({ en:'en-IN', kn:'kn-IN', hi:'hi-IN', te:'te-IN', ta:'ta-IN', ml:'ml-IN', mr:'mr-IN', bn:'bn-IN' })[language], { day:'numeric', month:'short', year:'numeric' }) : ''

  return (
    <Link to={`/history/${pred._id}`}>
      <div className="card card-sm" style={{
        display:'flex', alignItems:'center', gap: 14,
        cursor:'pointer', transition:'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: isHealthy ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22,
        }}>
          {isHealthy ? '✅' : '🍂'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color:'var(--text-primary)', marginBottom: 2 }}>{name}</div>
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
            <span style={{ fontSize: 11, color:'var(--text-muted)' }}>{dateStr}</span>
            {pred.location && <span style={{ fontSize: 11, color:'var(--text-muted)' }}>📍 {pred.location}</span>}
            {!isHealthy && pred.severity && (
              <span className={`badge ${pred.severity === 'Mild' ? 'badge-green' : pred.severity === 'Moderate' ? 'badge-amber' : 'badge-red'}`}
                style={{ fontSize: 10, padding: '1px 8px' }}>
                {ui(({ Mild:'severityMild', Moderate:'severityModerate', Severe:'severitySevere' })[pred.severity] || 'severity')}
              </span>
            )}
          </div>
        </div>

        {/* Confidence */}
        <div style={{ textAlign:'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: confColor }}>{pred.confidence?.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color:'var(--text-muted)' }}>{ui(pred.confidence_level === 'high' ? 'confidenceHigh' : pred.confidence_level === 'low' ? 'confidenceLow' : 'confidenceMedium')}</div>
        </div>

        {/* Delete */}
        <button aria-label={ui('deleteScan')} title={ui('deleteScan')} onClick={(e) => onDelete(pred._id, e)}
          style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--text-muted)', padding: 6, borderRadius: 6,
            display:'flex', alignItems:'center', flexShrink: 0,
          }}
          onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='none' }}
        >
          <Trash2 size={14} />
        </button>

        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </Link>
  )
}
