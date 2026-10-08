import { useEffect, useState } from 'react'
import { CloudRain, Thermometer, Droplets, Wind, RefreshCw, MapPin } from 'lucide-react'
import { weatherAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

export default function WeatherRisk() {
  const { t, language } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity]       = useState('Bengaluru')
  const [input, setInput]     = useState('Bengaluru')

  const load = (c = city) => {
    setLoading(true)
    weatherAPI.risk({ city: c })
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setCity(input)
    load(input)
  }

  const overall = data?.overall_risk
  const overallColor = overall === 'High' ? '#ef4444' : overall === 'Medium' ? '#f59e0b' : '#22c55e'
  const weather = data?.weather || {}

  return (
    <div className="fade-in weather-page">
      <div className="page-header">
        <span className="section-kicker">{ui('fieldConditions')}</span>
        <h1>{ui('weatherPageTitle')}</h1>
        <p>{ui('weatherPageDescription')}</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="weather-search" style={{ display:'flex', gap: 10, marginBottom: 24, maxWidth: 400 }}>
        <label className="weather-city-input"><MapPin size={16} /><input aria-label={ui('enterCity')} value={input} onChange={e => setInput(e.target.value)}
          placeholder={ui('enterCity')} /></label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> : <><RefreshCw size={14} /><span className="sr-only">{ui('refreshWeather')}</span></>}
        </button>
      </form>

      {loading && !data ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop: 60 }}><div className="spinner" /></div>
      ) : data && (
        <>
          {/* Overall alert */}
          <div className="weather-risk-banner" style={{
            padding: '16px 20px', marginBottom: 24,
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${overallColor}40`,
            background: `${overallColor}0d`,
            display:'flex', alignItems:'center', gap: 14,
          }}>
            <div className="weather-risk-symbol" style={{ fontSize: 36 }}>
              {overall === 'High' ? '🔴' : overall === 'Medium' ? '🟡' : '🟢'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: overallColor, marginBottom: 4 }}>
                {translateRisk(overall, ui)} {ui('diseaseRisk')}
                <span style={{ fontWeight: 400, fontSize: 14, color:'var(--text-muted)', marginLeft: 8 }}>
                  — {weather.city}
                </span>
              </div>
              <p style={{ fontSize: 13 }}>{data.alert_message}</p>
            </div>
          </div>

          {/* Weather cards */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <WeatherCard icon={<Thermometer size={20} color="#ef4444" />} label={ui('temperature')} value={`${weather.temperature}°C`} bg="rgba(239,68,68,0.08)" />
            <WeatherCard icon={<Droplets size={20} color="#3b82f6" />} label={ui('humidity')} value={`${weather.humidity}%`} bg="rgba(59,130,246,0.08)" />
            <WeatherCard icon={<CloudRain size={20} color="#a855f7" />} label={ui('rainfallOneHour')} value={`${weather.rainfall_1h} mm`} bg="rgba(168,85,247,0.08)" />
            <WeatherCard icon={<Wind size={20} color="#22c55e" />} label={ui('windSpeed')} value={`${weather.wind_speed} m/s`} bg="rgba(34,197,94,0.08)" />
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>{ui('forecastTitle')}</h3>
            {(weather.forecast || []).length === 0 && <p>{ui('noForecast')}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {(weather.forecast || []).slice(0, 5).map((day) => (
                <div key={day.period} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: 12 }}>{day.period}</strong>
                  <span style={{ fontSize: 13 }}>{day.temperature}°C</span>
                  <div style={{ color: '#3b82f6', fontSize: 12 }}>{day.precipitation_probability}% {ui('rainChance')}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{day.rainfall} {ui('mmRain')}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 13 }}>{ui('consecutiveRainPeriods')}: <strong>{weather.consecutive_rainy_days || 0}</strong></p>
          </div>

          {weather.description && (
            <div className="weather-source-note" style={{ marginBottom: 24, fontSize: 13, color:'var(--text-muted)' }}>
              ☁️ {ui('conditions')}: <strong style={{ color:'var(--text-primary)' }}>{localizedWeatherDescription(weather.description, language)}</strong>
              {weather.source === 'mock' && <span style={{ marginLeft: 8, color:'var(--amber)' }}>({ui('sampleData')})</span>}
            </div>
          )}

          {/* Disease risk list */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>{ui('riskByDisease')}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              {(data.disease_risks || []).slice(0, 9).map((r, i) => (
                <DiseaseRiskRow key={i} risk={r} ui={ui} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function translateRisk(level, ui) {
  return ui(({ Low: 'riskLow', Moderate: 'riskMedium', Medium: 'riskMedium', High: 'riskHigh', 'Very High': 'riskVeryHigh' })[level] || 'riskLow')
}

function localizedWeatherDescription(description, language) {
  const descriptions = {
    'clear sky': { hi: 'साफ़ आसमान', kn: 'ಸ್ವಚ್ಛ ಆಕಾಶ', te: 'స్వచ్ఛమైన ఆకాశం', ta: 'தெளிவான வானம்', ml: 'തെളിഞ്ഞ ആകാശം', mr: 'निरभ्र आकाश', bn: 'পরিষ্কার আকাশ' },
    'few clouds': { hi: 'हल्के बादल', kn: 'ಸ್ವಲ್ಪ ಮೋಡಗಳು', te: 'కొన్ని మేఘాలు', ta: 'சில மேகங்கள்', ml: 'ചെറിയ മേഘങ്ങൾ', mr: 'काही ढग', bn: 'কিছু মেঘ' },
    'scattered clouds': { hi: 'बिखरे हुए बादल', kn: 'ಚದುರಿದ ಮೋಡಗಳು', te: 'చెల్లాచెదురైన మేఘాలు', ta: 'ஆங்காங்கே மேகங்கள்', ml: 'ചിതറിക്കിടക്കുന്ന മേഘങ്ങൾ', mr: 'विखुरलेले ढग', bn: 'বিক্ষিপ্ত মেঘ' },
    'broken clouds': { hi: 'टूटे-फूटे बादल', kn: 'ಚದುರಿದ ಮೋಡಗಳು', te: 'విరిగిన మేఘాలు', ta: 'சிதறிய மேகங்கள்', ml: 'മേഘാവൃതമായ ആകാശം', mr: 'विखुरलेले ढग', bn: 'ভাঙা মেঘ' },
    'overcast clouds': { hi: 'घने बादल', kn: 'ಮೋಡ ಕವಿದಿದೆ', te: 'మేఘావృతం', ta: 'மேகமூட்டம்', ml: 'മേഘാവൃതം', mr: 'ढगाळ', bn: 'মেঘাচ্ছন্ন' },
    'light rain': { hi: 'हल्की बारिश', kn: 'ಹಗುರ ಮಳೆ', te: 'తేలికపాటి వర్షం', ta: 'லேசான மழை', ml: 'ചെറിയ മഴ', mr: 'हलका पाऊस', bn: 'হালকা বৃষ্টি' },
    'moderate rain': { hi: 'मध्यम बारिश', kn: 'ಮಧ್ಯಮ ಮಳೆ', te: 'మోస్తరు వర్షం', ta: 'மிதமான மழை', ml: 'മിതമായ മഴ', mr: 'मध्यम पाऊस', bn: 'মাঝারি বৃষ্টি' },
    'heavy intensity rain': { hi: 'भारी बारिश', kn: 'ಭಾರಿ ಮಳೆ', te: 'భారీ వర్షం', ta: 'கனமழை', ml: 'കനത്ത മഴ', mr: 'मुसळधार पाऊस', bn: 'ভারী বৃষ্টি' },
  }
  return descriptions[description?.toLowerCase()]?.[language] || description
}

function WeatherCard({ icon, label, value, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}>{icon}</div>
      <div>
        <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

function DiseaseRiskRow({ risk, ui }) {
  const { disease_name, risk_level, risk_score, color } = risk
  const level = translateRisk(risk_level, ui)
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
      <div style={{ width: 140, fontSize: 13, color:'var(--text-secondary)', flexShrink: 0 }}>{localizedDiseaseName(disease_name, ui)}</div>
      <div style={{ flex: 1 }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${Math.min(risk_score, 100)}%`, background: color }} />
        </div>
      </div>
      <span style={{
        padding:'2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
        background: `${color}20`, color, minWidth: 60, textAlign:'center',
      }}>
        {level}
      </span>
    </div>
  )
}

function localizedDiseaseName(name, ui) {
  const names = {
    'Early Blight': 'earlyBlight', 'Late Blight': 'lateBlight', 'Leaf Mold': 'leafMold',
    'Bacterial Spot': 'bacterialSpot', 'Septoria Leaf Spot': 'septoriaLeafSpot',
    'Spider Mites': 'spiderMites', 'Target Spot': 'targetSpot',
    'Tomato Yellow Leaf Curl Virus': 'yellowLeafCurl', 'Tomato Mosaic Virus': 'mosaicVirus',
  }
  return names[name] ? ui(names[name]) : name
}
