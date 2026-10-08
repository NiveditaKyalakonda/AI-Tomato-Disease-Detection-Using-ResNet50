import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { diseaseAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

const TYPE_COLORS = {
  Bacterial: '#f59e0b',
  Fungal:    '#ef4444',
  Viral:     '#a855f7',
  Pest:      '#f97316',
  Healthy:   '#22c55e',
  'Fungal (Oomycete)': '#dc2626',
  'Pest (Arachnid)':   '#f97316',
}

export default function Diseases() {
  const { t, language } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [diseases, setDiseases] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterType, setFilter] = useState('all')

  useEffect(() => {
    diseaseAPI.list()
      .then(res => setDiseases(res.data.diseases || []))
      .finally(() => setLoading(false))
  }, [])

  const types = ['all', ...new Set(diseases.map(d => d.type).filter(Boolean))]

  const filtered = diseases.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.class_name?.toLowerCase().includes(q)
    const matchType = filterType === 'all' || d.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="fade-in disease-library-page">
      <div className="page-header">
        <span className="section-kicker">{ui('diseaseLibraryKicker')}</span>
        <h1>{ui('diseaseLibraryTitle')}</h1>
        <p>{ui('diseaseLibraryDescription')}</p>
      </div>

      {/* Filters */}
      <div className="library-controls" style={{ display:'flex', gap: 12, marginBottom: 24, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position:'absolute', left: 12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="input" aria-label={ui('searchDiseases')} placeholder={ui('searchDiseases')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
          {types.map(t => (
            <button key={t} className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(t)}>
              {t === 'all' ? ui('all') : translateType(t, language)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop: 60 }}><div className="spinner" /></div>
      ) : (
        <div className="grid-3">
          {filtered.map(d => <DiseaseCard key={d.class_name} disease={d} language={language} ui={ui} />)}
        </div>
      )}
      {!loading && filtered.length === 0 && <div className="card library-empty-state"><h3>{ui('noDiseasesFound')}</h3><p>{ui('adjustDiseaseSearch')}</p></div>}
    </div>
  )
}

function DiseaseCard({ disease, language, ui }) {
  const { class_name, name, type, icon, color, kannada, hindi } = disease
  const typeColor = TYPE_COLORS[type] || '#6b7280'

  return (
    <Link to={`/disease/${encodeURIComponent(class_name)}`}>
      <div className="card" style={{ cursor:'pointer', transition:'all 0.2s', height:'100%' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform='translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${color}20`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22, flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color:'var(--text-primary)', marginBottom: 2 }}>{translateDisease(name, language, ui)}</div>
            <span style={{
              fontSize: 11, padding:'2px 8px', borderRadius: 999,
              background: `${typeColor}20`, color: typeColor, fontWeight: 600,
            }}>
              {translateType(type, language)}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8, fontSize: 12, color:'var(--text-muted)' }}>
          <span>🇮🇳 {kannada}</span>
          {hindi && <span>· {hindi}</span>}
        </div>
      </div>
    </Link>
  )
}

function translateDisease(name, language, ui) {
  const keys = {
    'Early Blight': 'earlyBlight', 'Late Blight': 'lateBlight',
    'Leaf Mold': 'leafMold', 'Healthy': 'healthy',
    'Bacterial Spot': 'bacterialSpot', 'Septoria Leaf Spot': 'septoriaLeafSpot',
    'Spider Mites': 'spiderMites', 'Target Spot': 'targetSpot',
    'Tomato Yellow Leaf Curl Virus': 'yellowLeafCurl', 'Tomato Mosaic Virus': 'mosaicVirus',
  }
  return keys[name] ? ui(keys[name]) : name
}

function translateType(type, language) {
  const types = {
    en: { Bacterial: 'Bacterial', Fungal: 'Fungal', Viral: 'Viral', Pest: 'Pest', Healthy: 'Healthy', 'Fungal (Oomycete)': 'Fungal (Oomycete)', 'Pest (Arachnid)': 'Pest (Arachnid)' },
    hi: { Bacterial: 'जीवाणु', Fungal: 'फफूंद', Viral: 'विषाणु', Pest: 'कीट', Healthy: 'स्वस्थ', 'Fungal (Oomycete)': 'ऊमाइसीट', 'Pest (Arachnid)': 'घुन' },
    kn: { Bacterial: 'ಬ್ಯಾಕ್ಟೀರಿಯಾ', Fungal: 'ಶಿಲೀಂಧ್ರ', Viral: 'ವೈರಸ್', Pest: 'ಕೀಟ', Healthy: 'ಆರೋಗ್ಯಕರ', 'Fungal (Oomycete)': 'ಊಮೈಸೀಟ್', 'Pest (Arachnid)': 'ಅರಾಕ್ನಿಡ್' },
    te: { Bacterial: 'బ్యాక్టీరియా', Fungal: 'శిలీంధ్రం', Viral: 'వైరస్', Pest: 'చీడపీడ', Healthy: 'ఆరోగ్యకరం', 'Fungal (Oomycete)': 'ఊమైసీట్', 'Pest (Arachnid)': 'అరాక్నిడ్' },
    ta: { Bacterial: 'பாக்டீரியா', Fungal: 'பூஞ்சை', Viral: 'வைரஸ்', Pest: 'பூச்சி', Healthy: 'ஆரோக்கியமானது', 'Fungal (Oomycete)': 'ஊமைசீட்', 'Pest (Arachnid)': 'சிலந்தி வகை' },
    ml: { Bacterial: 'ബാക്ടീരിയ', Fungal: 'ഫംഗസ്', Viral: 'വൈറസ്', Pest: 'കീടം', Healthy: 'ആരോഗ്യമുള്ളത്', 'Fungal (Oomycete)': 'ഊമൈസീറ്റ്', 'Pest (Arachnid)': 'അരാക്നിഡ്' },
    mr: { Bacterial: 'जीवाणू', Fungal: 'बुरशी', Viral: 'विषाणू', Pest: 'कीड', Healthy: 'निरोगी', 'Fungal (Oomycete)': 'ऊमायसीट', 'Pest (Arachnid)': 'कोळीवर्गीय' },
    bn: { Bacterial: 'ব্যাকটেরিয়া', Fungal: 'ছত্রাক', Viral: 'ভাইরাস', Pest: 'পোকা', Healthy: 'সুস্থ', 'Fungal (Oomycete)': 'ওওমাইসিট', 'Pest (Arachnid)': 'অ্যারাকনিড' },
  }
  return types[language]?.[type] || type
}
