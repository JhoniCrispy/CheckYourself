import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = {
  bp_systolic: '', bp_diastolic: '', temperature: '',
  spo2: '', pulse: '', note: '',
}

// Returns 'normal' | 'warn' | 'alert' | null
function bpSysStatus(v) {
  const n = parseInt(v); if (isNaN(n)) return null
  if (n < 130) return 'normal'; if (n < 140) return 'warn'; return 'alert'
}
function bpDiaStatus(v) {
  const n = parseInt(v); if (isNaN(n)) return null
  if (n < 85) return 'normal'; if (n < 90) return 'warn'; return 'alert'
}
function tempStatus(v) {
  const n = parseFloat(v); if (isNaN(n)) return null
  if (n <= 37.4) return 'normal'; if (n <= 38) return 'warn'; return 'alert'
}
function spo2Status(v) {
  const n = parseInt(v); if (isNaN(n)) return null
  if (n >= 96) return 'normal'; if (n >= 93) return 'warn'; return 'alert'
}
function pulseStatus(v) {
  const n = parseInt(v); if (isNaN(n)) return null
  if (n >= 60 && n <= 100) return 'normal'
  if ((n >= 50 && n < 60) || (n > 100 && n <= 120)) return 'warn'
  return 'alert'
}
function customStatus(v, min, max) {
  if (min == null || max == null) return null
  const n = parseFloat(v); if (isNaN(n)) return null
  if (n >= min && n <= max) return 'normal'
  const range = max - min
  if (n >= min - range * 0.1 && n <= max + range * 0.1) return 'warn'
  return 'alert'
}

export default function EntryScreen({ setScreen, showToast, user }) {
  const [form,         setForm]         = useState(EMPTY)
  const [loading,      setLoading]      = useState(false)
  const [now,          setNow]          = useState(new Date())
  const [medications,  setMedications]  = useState([])
  const [selectedMeds, setSelectedMeds] = useState([])
  const [metricTypes,  setMetricTypes]  = useState([])
  const [customVals,   setCustomVals]   = useState({})

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fetchLists = async () => {
      const [medsRes, metricsRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', user.id).order('name'),
        supabase.from('metric_types').select('*').eq('user_id', user.id).order('name'),
      ])
      if (!medsRes.error)    setMedications(medsRes.data ?? [])
      if (!metricsRes.error) setMetricTypes(metricsRes.data ?? [])
    }
    fetchLists()
  }, [user.id])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleMed = (id) => {
    setSelectedMeds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data: reading, error } = await supabase
      .from('readings')
      .insert({
        user_id:      user.id,
        bp_systolic:  num(form.bp_systolic),
        bp_diastolic: num(form.bp_diastolic),
        temperature:  flt(form.temperature),
        spo2:         num(form.spo2),
        pulse:        num(form.pulse),
        medication:   selectedMeds.length > 0,
        note:         form.note.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      showToast('שגיאה בשמירה: ' + error.message, 'error')
      setLoading(false)
      return
    }

    const rid = reading.id
    const inserts = []

    if (selectedMeds.length > 0) {
      inserts.push(
        supabase.from('reading_medications').insert(
          selectedMeds.map(mid => ({ reading_id: rid, medication_id: mid }))
        )
      )
    }

    const customEntries = Object.entries(customVals).filter(([, v]) => v !== '')
    if (customEntries.length > 0) {
      inserts.push(
        supabase.from('custom_measurements').insert(
          customEntries.map(([mtid, v]) => ({
            reading_id: rid, metric_type_id: mtid, value: parseFloat(v),
          }))
        )
      )
    }

    if (inserts.length > 0) await Promise.all(inserts)

    showToast('✓ נשמר בהצלחה')
    setForm(EMPTY)
    setSelectedMeds([])
    setCustomVals({})
    setScreen('home')
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
                className={`field-input status-${bpSysStatus(form.bp_systolic) ?? 'none'}`}
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
                className={`field-input status-${bpDiaStatus(form.bp_diastolic) ?? 'none'}`}
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
          <div className={`input-unit status-${tempStatus(form.temperature) ?? 'none'}`}>
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
          <div className={`input-unit status-${spo2Status(form.spo2) ?? 'none'}`}>
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
          <div className={`input-unit status-${pulseStatus(form.pulse) ?? 'none'}`}>
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

        {/* Medications */}
        <div className="field-card">
          <div className="field-label"><span className="label-icon">💊</span>תרופות שנלקחו</div>
          {medications.length === 0 ? (
            <p className="field-empty-hint">
              לא הוגדרו תרופות —{' '}
              <button
                type="button" className="link-btn"
                onClick={() => setScreen('medications')}
              >
                הוסף כאן
              </button>
            </p>
          ) : (
            <div className="med-chips">
              {medications.map(m => (
                <button
                  key={m.id} type="button"
                  className={`med-chip ${selectedMeds.includes(m.id) ? 'med-chip--on' : ''}`}
                  onClick={() => toggleMed(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom metric types */}
        {metricTypes.length > 0 && (
          <div className="field-card">
            <div className="field-label"><span className="label-icon">⚙️</span>מדדים נוספים</div>
            {metricTypes.map(mt => (
              <div key={mt.id} className="custom-metric-row">
                <span className="custom-metric-name">{mt.name}</span>
                <div className={`input-unit input-unit--sm status-${customStatus(customVals[mt.id] ?? '', mt.normal_min, mt.normal_max) ?? 'none'}`}>
                  <input
                    className="field-input"
                    type="number" inputMode="decimal"
                    placeholder="—"
                    value={customVals[mt.id] ?? ''}
                    onChange={e => setCustomVals(prev => ({ ...prev, [mt.id]: e.target.value }))}
                  />
                  {mt.unit && <span className="unit-badge">{mt.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="field-card">
          <div className="field-label"><span className="label-icon">📝</span>הערות</div>
          <textarea
            className="field-textarea"
            placeholder="הערות אופציונליות..."
            rows={2}
            value={form.note}
            onChange={e => set('note', e.target.value)}
          />
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
