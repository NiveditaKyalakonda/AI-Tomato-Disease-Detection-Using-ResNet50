import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { diseaseAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

export default function DiseaseDetail() {
  const { id, name } = useParams()
  const diseaseId = id || name
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [disease, setDisease] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    diseaseAPI.detail(diseaseId)
      .then(res => setDisease(res.data.disease))
      .finally(() => setLoading(false))
  }, [diseaseId])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop: 80 }}><div className="spinner" /></div>
  if (!disease) return null

  const isHealthy = diseaseId.toLowerCase().includes('healthy')

  return (
    <div className="fade-in disease-detail-page">
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/diseases')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> {ui('back')}
        </button>
      </div>

      <div className="grid-2">
        {/* Overview */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          <div className="card" style={{ borderColor: disease.color, borderWidth: 1 }}>
            <div style={{ display:'flex', gap: 14, alignItems:'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${disease.color}20`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: 28, flexShrink: 0,
              }}>
                {disease.icon}
              </div>
              <div>
                <div className="section-kicker">{ui('diseaseProfile')}</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{localizedDisease(disease.name, language, ui)}</h1>
                {disease.scientific_name && disease.scientific_name !== 'N/A' && (
                  <div style={{ fontStyle:'italic', fontSize: 13, color:'var(--text-muted)', marginBottom: 6 }}>{disease.scientific_name}</div>
                )}
                <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
                  <span className="badge badge-gray">{localizedType(disease.type, language)}</span>
                  {language !== 'kn' && <span style={{ fontSize: 13, color:'var(--text-secondary)' }}>ಕನ್ನಡ · {disease.kannada}</span>}
                  {language !== 'hi' && disease.hindi && <span style={{ fontSize: 13, color:'var(--text-secondary)' }}>हिन्दी · {disease.hindi}</span>}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>{localizedText(disease.description, language, ui)}</p>
          </div>

          {/* Risk conditions */}
          {disease.risk_conditions && (
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>⚠️ {ui('riskConditions')}</h3>
              <div className="grid-3">
                <RiskItem icon="🌡️" label={ui('temperature')} value={`${disease.risk_conditions.temperature_range?.[0]}–${disease.risk_conditions.temperature_range?.[1]}°C`} />
                <RiskItem icon="💧" label={ui('minHumidity')} value={`${disease.risk_conditions.humidity_threshold}%`} />
                <RiskItem icon="🌧️" label={ui('rainfallRisk')} value={disease.risk_conditions.rainfall_risk ? ui('yes') : ui('no')} />
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          {!isHealthy && disease.symptoms?.length > 0 && (
            <InfoSection title={`🔍 ${ui('symptoms')}`} items={disease.symptoms} color="#ef4444" language={language} ui={ui} />
          )}
          {disease.causes?.length > 0 && disease.causes[0] !== 'No disease causes — plant is healthy' && (
            <InfoSection title={`🦠 ${ui('causes')}`} items={disease.causes} color="#f59e0b" language={language} ui={ui} />
          )}
          <InfoSection title={`🌿 ${ui('management')}`} items={disease.management} color="#22c55e" language={language} ui={ui} />
          {disease.prevention?.length > 0 && (
            <InfoSection title={`🛡️ ${ui('prevention')}`} items={disease.prevention} color="#3b82f6" language={language} ui={ui} />
          )}
        </div>
      </div>
    </div>
  )
}

function RiskItem({ icon, label, value }) {
  return (
    <div style={{ background:'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', textAlign:'center' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
      <div style={{ fontSize: 11, color:'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function InfoSection({ title, items, color, language, ui }) {
  if (!items?.length) return null
  return (
    <div className="card">
      <h4 style={{ marginBottom: 12 }}>{title}</h4>
      <ul style={{ paddingLeft: 0, listStyle:'none', display:'flex', flexDirection:'column', gap: 6 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display:'flex', gap: 8, alignItems:'flex-start', fontSize: 13, color:'var(--text-secondary)' }}>
            <span style={{ color, marginTop: 2, flexShrink: 0 }}>▸</span>
            {localizedText(item, language, ui)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function localizedDisease(name, language, ui) {
  const names = {
    'Early Blight': 'earlyBlight', 'Late Blight': 'lateBlight', 'Leaf Mold': 'leafMold',
    'Healthy': 'healthy', 'Bacterial Spot': 'bacterialSpot', 'Septoria Leaf Spot': 'septoriaLeafSpot',
    'Spider Mites': 'spiderMites', 'Target Spot': 'targetSpot',
    'Tomato Yellow Leaf Curl Virus': 'yellowLeafCurl', 'Tomato Mosaic Virus': 'mosaicVirus',
  }
  return names[name] ? ui(names[name]) : name
}

function localizedType(type, language) {
  const types = {
    hi: { Bacterial:'जीवाणु', Fungal:'फफूंद', Viral:'विषाणु', Pest:'कीट', Healthy:'स्वस्थ' },
    kn: { Bacterial:'ಬ್ಯಾಕ್ಟೀರಿಯಾ', Fungal:'ಶಿಲೀಂಧ್ರ', Viral:'ವೈರಸ್', Pest:'ಕೀಟ', Healthy:'ಆರೋಗ್ಯಕರ' },
    te: { Bacterial:'బ్యాక్టీరియా', Fungal:'శిలీంధ్రం', Viral:'వైరస్', Pest:'చీడపీడ', Healthy:'ఆరోగ్యకరం' },
    ta: { Bacterial:'பாக்டீரியா', Fungal:'பூஞ்சை', Viral:'வைரஸ்', Pest:'பூச்சி', Healthy:'ஆரோக்கியமானது' },
    ml: { Bacterial:'ബാക്ടീരിയ', Fungal:'ഫംഗസ്', Viral:'വൈറസ്', Pest:'കീടം', Healthy:'ആരോഗ്യമുള്ളത്' },
    mr: { Bacterial:'जीवाणू', Fungal:'बुरशी', Viral:'विषाणू', Pest:'कीड', Healthy:'निरोगी' },
    bn: { Bacterial:'ব্যাকটেরিয়া', Fungal:'ছত্রাক', Viral:'ভাইরাস', Pest:'পোকা', Healthy:'সুস্থ' },
  }
  return types[language]?.[type] || type
}

function localizedText(text, language, ui) {
  if (!text || language === 'en') return text
  const shared = {
    'Early blight is caused by the fungus Alternaria solani. It produces dark, concentric lesions on older leaves and can lead to early defoliation.': 'earlyBlightDescription',
    'Late blight is a destructive disease caused by Phytophthora infestans. It spreads rapidly in cool, wet weather and can affect leaves, stems, and fruit.': 'lateBlightDescription',
    'Tomato leaf mold is caused by Passalora fulva and thrives in warm, humid greenhouse conditions.': 'leafMoldDescription',
    'Remove and destroy infected leaves.': 'removeInfectedLeaves',
    'Avoid overhead irrigation and improve airflow.': 'avoidOverheadWatering',
    'Rotate crops and remove plant debris after harvest.': 'rotateAndClearDebris',
    'Use resistant varieties when available.': 'useResistantVarieties',
    'Apply fungicide according to local recommendations.': 'followFungicideAdvice',
  }
  const key = shared[text]
  return key ? ui(key) : text
}
