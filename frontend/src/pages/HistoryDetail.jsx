import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { historyAPI, expertAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

export default function HistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [expertMsg, setExpertMsg] = useState('')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    historyAPI.detail(id)
      .then(res => setData(res.data.prediction))
      .catch(() => { toast.error(ui('failedLoad')); navigate('/history') })
      .finally(() => setLoading(false))
  }, [id])

  const handleExpertRequest = async () => {
    setRequesting(true)
    try {
      await expertAPI.request({ prediction_id: id, message: expertMsg })
      toast.success(ui('requestSubmitted'))
      setExpertMsg('')
    } catch {
      toast.error(ui('failedRequest'))
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop: 80 }}><div className="spinner" /></div>
  if (!data) return null

  const { disease_name, disease, confidence, confidence_level, is_healthy, severity, disease_info, gradcam, all_predictions, created_at, location } = data
  const name = disease_name || disease?.replace('Tomato_','').replace(/_/g,' ')
  const confColor = confidence > 75 ? '#22c55e' : confidence > 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="fade-in history-detail-page">
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/history')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> {ui('back')}
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{ui('scanReport')}</h1>
        {created_at && (
          <span style={{ fontSize: 12, color:'var(--text-muted)', marginLeft:'auto' }}>
            {new Date(created_at).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      <div className="grid-2">
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          {/* Result summary */}
          <div className="card" style={{
            border: `1px solid ${is_healthy ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            background: is_healthy ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 48 }}>{is_healthy ? '✅' : '⚠️'}</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: is_healthy ? '#22c55e' : '#ef4444' }}>{localizeName(name, ui)}</div>
                {disease_info?.scientific_name && (
                  <div style={{ fontSize: 12, color:'var(--text-muted)', fontStyle:'italic' }}>{disease_info.scientific_name}</div>
                )}
                <div style={{ fontSize: 12, color:'var(--text-muted)', marginTop: 2 }}>
                  {disease_info?.type} · {disease_info?.kannada}
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12 }}>
              <Metric label={ui('confidence')} value={`${confidence?.toFixed(1)}%`} color={confColor} />
              <Metric label={ui('level')} value={ui(confidence_level === 'high' ? 'confidenceHigh' : confidence_level === 'low' ? 'confidenceLow' : 'confidenceMedium')} />
              {!is_healthy && <Metric label={ui('severity')} value={ui(({ Mild:'severityMild', Moderate:'severityModerate', Severe:'severitySevere' })[severity] || 'severity')} color={severity === 'Mild' ? '#22c55e' : severity === 'Moderate' ? '#f59e0b' : '#ef4444'} />}
            </div>

            {location && (
              <div style={{ marginTop: 12, fontSize: 12, color:'var(--text-muted)' }}>📍 {location}</div>
            )}
          </div>

          {/* Disease info */}
          {disease_info && !is_healthy && (
            <>
              <InfoCard title={`📋 ${ui('description')}`}>
                <p style={{ fontSize: 13 }}>{localizeRecommendation(disease_info.description, language, ui)}</p>
              </InfoCard>

              <InfoCard title={`🔍 ${ui('symptoms')}`}>
                <ul style={{ paddingLeft: 18, fontSize: 13, color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap: 3 }}>
                  {disease_info.symptoms?.map((s, i) => <li key={i}>{localizeRecommendation(s, language, ui)}</li>)}
                </ul>
              </InfoCard>

              <InfoCard title={`🌿 ${ui('management')}`}>
                <ul style={{ paddingLeft: 18, fontSize: 13, color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap: 3 }}>
                  {disease_info.management?.map((m, i) => <li key={i}>{localizeRecommendation(m, language, ui)}</li>)}
                </ul>
              </InfoCard>

              <InfoCard title={`🛡️ ${ui('prevention')}`}>
                <ul style={{ paddingLeft: 18, fontSize: 13, color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap: 3 }}>
                  {disease_info.prevention?.map((p, i) => <li key={i}>{localizeRecommendation(p, language, ui)}</li>)}
                </ul>
              </InfoCard>
            </>
          )}

          {/* Expert request */}
          {!is_healthy && (
            <div className="card">
              <div style={{ display:'flex', gap: 10, alignItems:'center', marginBottom: 12 }}>
                <MessageCircle size={18} color="var(--blue)" />
                <h4>{ui('requestExpert')}</h4>
              </div>
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                {ui('expertDescription')}
              </p>
              <textarea className="input" rows={3}
                placeholder={ui('describeConcern')}
                value={expertMsg} onChange={e => setExpertMsg(e.target.value)}
                style={{ resize:'vertical' }} />
              <button className="btn btn-secondary" style={{ marginTop: 10 }}
                onClick={handleExpertRequest} disabled={requesting}>
                {requesting ? ui('submitting') : ui('submitRequest')}
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          {/* Grad-CAM */}
          {(data.gradcam_image || gradcam) && (
            <div className="card">
              <h4 style={{ marginBottom: 4 }}>🔥 {ui('gradcamExplainability')}</h4>
              <p style={{ fontSize: 12, marginBottom: 12 }}>{ui('gradcamDescriptionResult')}</p>
              {gradcam?.overlay && (
                <img src={`data:image/png;base64,${gradcam.overlay}`} alt={ui('gradcamAlt')}
                  style={{ width:'100%', borderRadius: 8, border:'1px solid var(--border)' }} />
              )}
            </div>
          )}

          {/* All predictions */}
          {all_predictions?.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 12 }}>📊 {ui('predictionProbabilities')}</h4>
              <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
                {all_predictions.slice(0, 5).map((p, i) => (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {localizeName(p.class?.replace('Tomato_','').replace(/_/g,' '), ui)}
                      </span>
                      <span style={{ fontWeight: i === 0 ? 700 : 400 }}>{p.probability.toFixed(2)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width:`${p.probability}%`,
                        background: i === 0 ? 'var(--tomato)' : 'var(--border-light)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthy message */}
          {is_healthy && (
            <div className="card" style={{ textAlign:'center', padding: '32px 20px', background:'rgba(34,197,94,0.05)', borderColor:'rgba(34,197,94,0.2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
              <h3 style={{ color:'#22c55e', marginBottom: 8 }}>{ui('resultHealthy')}</h3>
              <p style={{ fontSize: 13 }}>{localizeRecommendation(disease_info?.management?.[0], language, ui)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background:'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', textAlign:'center' }}>
      <div style={{ fontWeight: 800, fontSize: 18, color: color || 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 11, color:'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="card card-sm">
      <h4 style={{ marginBottom: 10 }}>{title}</h4>
      {children}
    </div>
  )
}

function localizeName(name, ui) {
  const names = {
    'Early Blight':'earlyBlight','Late Blight':'lateBlight','Leaf Mold':'leafMold','Healthy':'healthy',
    'Bacterial Spot':'bacterialSpot','Septoria Leaf Spot':'septoriaLeafSpot','Spider Mites':'spiderMites',
    'Target Spot':'targetSpot','Tomato Yellow Leaf Curl Virus':'yellowLeafCurl','Tomato Mosaic Virus':'mosaicVirus',
  }
  return names[name] ? ui(names[name]) : name
}

function localizeRecommendation(text, language, ui) {
  if (!text || language === 'en') return text
  const value = text.toLowerCase()
  if (value.includes('remove') && value.includes('infected')) return ui('removeInfectedLeaves')
  if (value.includes('overhead') || value.includes('airflow')) return ui('avoidOverheadWatering')
  if (value.includes('rotate') || value.includes('debris')) return ui('rotateAndClearDebris')
  if (value.includes('resistant variet')) return ui('useResistantVarieties')
  if (value.includes('fungicide') || value.includes('fungicide')) return ui('followFungicideAdvice')
  if (value.includes('early blight')) return ui('earlyBlightDescription')
  if (value.includes('late blight')) return ui('lateBlightDescription')
  if (value.includes('leaf mold')) return ui('leafMoldDescription')
  return text
}
