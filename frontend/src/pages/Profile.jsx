import { useState } from 'react'
import { User, Globe, MapPin, Save, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { languages, languageNames, changeLanguage } = useLanguage()
  const { t } = useLanguage()
  const ui = (key) => t(`ui.${key}`)
  const [form, setForm]     = useState({ name: user?.name || '', language: user?.language || 'en', location: user?.location || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.update(form)
      updateUser(form)
      changeLanguage(form.language)
      toast.success(ui('profileUpdated'))
    } catch {
      toast.error(ui('failedSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in profile-page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <span className="section-kicker">{ui('accountPreferences')}</span>
        <h1>{ui('profileSettings')}</h1>
        <p>{ui('profileDescription')}</p>
      </div>

      {/* Avatar */}
      <div className="card profile-identity" style={{ marginBottom: 20, display:'flex', alignItems:'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #14532d)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 28, fontWeight: 800, color:'#fff',
        }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color:'var(--text-muted)' }}>{user?.email}</div>
          <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`} style={{ marginTop: 6 }}>
            {user?.role || 'farmer'}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div className="profile-form-heading"><span className="profile-form-icon"><User size={17} /></span><span><h3>{ui('editProfile')}</h3><small>{ui('profileHelp')}</small></span></div>
        <form onSubmit={handleSave} className="profile-form" style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div className="input-group">
            <label className="input-label"><Globe size={14} /> {ui('language')}</label>
            <select className="input" value={form.language}
              onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
              {languages.map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label"><MapPin size={14} /> {ui('locationWeather')}</label>
            <input className="input" value={form.location} placeholder="e.g. Bengaluru, Karnataka"
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
          </div>

          <div className="input-group">
            <label className="input-label">{ui('emailAddress')}</label>
            <input className="input" value={user?.email} disabled
              style={{ opacity: 0.5, cursor:'not-allowed' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={saving}>
            <Save size={14} />
            {saving ? ui('saving') : ui('saveChanges')}
          </button>
        </form>
        <div className="profile-security-note"><ShieldCheck size={16} /><span>{ui('profileSecurity')}</span></div>
      </div>
    </div>
  )
}
