import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = { name: '', unit: '', normal_min: '', normal_max: '' }

export default function MetricTypesScreen({ setScreen, showToast, user }) {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [adding,  setAdding]  = useState(false)
  const [open,    setOpen]    = useState(false)

  const fetchMetrics = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('metric_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (error) showToast('שגיאה בטעינה', 'error')
    else setMetrics(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchMetrics() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return
    setAdding(true)
    const { data, error } = await supabase
      .from('metric_types')
      .insert({
        user_id:    user.id,
        name,
        unit:       form.unit.trim() || null,
        normal_min: flt(form.normal_min),
        normal_max: flt(form.normal_max),
      })
      .select('*')
      .single()
    if (error) showToast('שגיאה בהוספה', 'error')
    else {
      setMetrics(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(EMPTY_FORM)
      setOpen(false)
      showToast('✓ מדד נוסף')
    }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('metric_types').delete().eq('id', id)
    if (error) showToast('שגיאה במחיקה', 'error')
    else {
      setMetrics(prev => prev.filter(m => m.id !== id))
      showToast('מדד נמחק')
    }
  }

  return (
    <div className="screen manage-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')} type="button">→</button>
        <h2>מדדים מותאמים אישית</h2>
      </div>

      <div className="manage-body">
        <button
          className="add-toggle-btn"
          type="button"
          onClick={() => setOpen(o => !o)}
        >
          {open ? '− סגור' : '+ הוסף מדד חדש'}
        </button>

        {open && (
          <form className="metric-add-form" onSubmit={handleAdd}>
            <div className="metric-form-grid">
              <label className="metric-label">
                שם המדד *
                <input
                  className="add-input"
                  type="text"
                  placeholder='למשל: "סוכר בדם"'
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  maxLength={60}
                  required
                />
              </label>
              <label className="metric-label">
                יחידה
                <input
                  className="add-input"
                  type="text"
                  placeholder='למשל: "mg/dL"'
                  value={form.unit}
                  onChange={e => set('unit', e.target.value)}
                  maxLength={20}
                />
              </label>
              <label className="metric-label">
                ערך תקין מינימלי
                <input
                  className="add-input"
                  type="number" inputMode="decimal"
                  placeholder="70"
                  value={form.normal_min}
                  onChange={e => set('normal_min', e.target.value)}
                />
              </label>
              <label className="metric-label">
                ערך תקין מקסימלי
                <input
                  className="add-input"
                  type="number" inputMode="decimal"
                  placeholder="110"
                  value={form.normal_max}
                  onChange={e => set('normal_max', e.target.value)}
                />
              </label>
            </div>
            <button className="add-btn add-btn--full" type="submit" disabled={adding || !form.name.trim()}>
              {adding ? 'שומר...' : 'שמור מדד'}
            </button>
          </form>
        )}

        {loading && (
          <div className="history-loading"><div className="spinner" /></div>
        )}

        {!loading && metrics.length === 0 && (
          <div className="manage-empty">
            <p>אין מדדים מותאמים עדיין.</p>
            <p className="empty-sub">צרי מדד חדש (למשל סוכר בדם, משקל) — הוא יופיע בטופס המדידה.</p>
          </div>
        )}

        {!loading && metrics.length > 0 && (
          <ul className="manage-list">
            {metrics.map(m => (
              <li key={m.id} className="manage-item manage-item--metric">
                <div className="manage-item-info">
                  <span className="manage-item-name">⚙️ {m.name}</span>
                  <span className="manage-item-meta">
                    {m.unit && <span className="metric-tag">{m.unit}</span>}
                    {m.normal_min != null && m.normal_max != null && (
                      <span className="metric-tag metric-tag--range">
                        תקין: {m.normal_min}–{m.normal_max}
                      </span>
                    )}
                  </span>
                </div>
                <button
                  className="manage-delete-btn"
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  title="מחק"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function flt(v) { const n = parseFloat(v); return isNaN(n) ? null : n }
