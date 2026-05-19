import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = { bp_systolic: '', bp_diastolic: '', temperature: '', spo2: '', pulse: '', medication: false }

export default function EntryScreen({ setScreen, showToast, user }) {
  const [form,    setForm]    = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [now,     setNow]     = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('readings').insert({
      user_id:      user.id,
      bp_systolic:  num(form.bp_systolic),
      bp_diastolic: num(form.bp_diastolic),
      temperature:  flt(form.temperature),
      spo2:         num(form.spo2),
      pulse:        num(form.pulse),
      medication:   form.medication,
    })

    if (error) {
      showToast('שגיאה בשמירה: ' + error.message)
    } else {
      showToast('✓ נשמר בהצלחה')
      setForm(EMPTY)
      setScreen('home')
    }
    setLoading(false)
  }

  const dateStr = now.toLocaleDateString('he-IL')
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="screen entry-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')} type="button">→</button>
        <h2>מדידה חדשה</h2>
      </div>

      <form className="entry-form" onSubmit={handleSubmit} noValidate>

        {/* Blood pressure */}
        <div className="field-card">
          <div className="field-label"><span className="label-icon">🫀</span>לחץ דם</div>
          <div className="bp-row">
            <div className="bp-col">
              <input
                className="field-input"
                type="number" inputMode="numeric"
                placeholder="120" min="60" max="260"
                value={form.bp_systolic}
                onChange={e => set('bp_systolic', e.target.value)}
              />
              <span className="bp-sub">סיסטולי (עליון)</span>
            </div>
            <span className="bp-slash">/</span>
            <div className="bp-col">
              <input
                className="field-input"
                type="number" inputMode="numeric"
                placeholder="80" min="40" max="160"
                value={form.bp_diastolic}
                onChange={e => set('bp_diastolic', e.target.value)}
              />
              <span className="bp-sub">דיאסטולי (תחתון)</span>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="field-card">
          <div className="field-label"><span className="label-icon">🌡️</span>חום</div>
          <div className="input-unit">
            <input
              className="field-input"
              type="number" inputMode="decimal"
              placeholder="36.6" step="0.1" min="35" max="42"
              value={form.temperature}
              onChange={e => set('temperature', e.target.value)}
            />
            <span className="unit-badge">°C</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="field-card">
          <div className="field-label"><span className="label-icon">🫁</span>סטורציה</div>
          <div className="input-unit">
            <input
              className="field-input"
              type="number" inputMode="numeric"
              placeholder="98" min="70" max="100"
              value={form.spo2}
              onChange={e => set('spo2', e.target.value)}
            />
            <span className="unit-badge">%</span>
          </div>
        </div>

        {/* Pulse */}
        <div className="field-card">
          <div className="field-label"><span className="label-icon">💓</span>דופק</div>
          <div className="input-unit">
            <input
              className="field-input"
              type="number" inputMode="numeric"
              placeholder="72" min="30" max="220"
              value={form.pulse}
              onChange={e => set('pulse', e.target.value)}
            />
            <span className="unit-badge">bpm</span>
          </div>
        </div>

        {/* Medication toggle */}
        <div className="field-card med-card">
          <label className="med-label" htmlFor="medication">
            <span className="label-icon">💊</span>
            <span className="med-text">לקחתי תרופות</span>
            <input
              id="medication"
              type="checkbox"
              className="toggle-input"
              checked={form.medication}
              onChange={e => set('medication', e.target.checked)}
            />
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
          </label>
        </div>

        <p className="ts-hint">יישמר אוטומטית: {dateStr} בשעה {timeStr}</p>

        <button className="btn-save" type="submit" disabled={loading}>
          {loading ? 'שומר...' : 'שמור רשומה'}
        </button>

      </form>
    </div>
  )
}

function num(v) { const n = parseInt(v);   return isNaN(n) ? null : n }
function flt(v) { const n = parseFloat(v); return isNaN(n) ? null : n }
