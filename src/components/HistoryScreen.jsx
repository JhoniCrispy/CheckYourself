import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

export default function HistoryScreen({ setScreen, showToast, user }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('readings')
      .select(`
        *,
        reading_medications (
          medication_id,
          medications ( name )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) showToast('שגיאה בטעינת הנתונים', 'error')
    else setRecords(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const handleDeleteRow = async (id) => {
    const { error } = await supabase.from('readings').delete().eq('id', id)
    if (error) showToast('שגיאה במחיקה', 'error')
    else {
      setRecords(prev => prev.filter(r => r.id !== id))
      showToast('רשומה נמחקה')
    }
  }

  const handleClear = async () => {
    if (!confirm('למחוק את כל הרשומות שלך?')) return
    const { error } = await supabase.from('readings').delete().eq('user_id', user.id)
    if (error) showToast('שגיאה במחיקה', 'error')
    else { setRecords([]); showToast('כל הרשומות נמחקו') }
  }

  const handleExport = () => {
    if (records.length === 0) return

    const rows = records.map(r => {
      const d    = new Date(r.created_at)
      const meds = pillNames(r)
      return {
        'תאריך':    d.toLocaleDateString('he-IL'),
        'שעה':      d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        'לחץ דם':   bpStr(r.bp_systolic, r.bp_diastolic),
        'חום (°C)': r.temperature ?? '',
        'סטורציה (%)': r.spo2 ?? '',
        'דופק (bpm)':  r.pulse ?? '',
        'תרופות':   meds || (r.medication ? '✓' : ''),
        'הערות':    r.note ?? '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [14,10,12,10,12,12,30,30].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'מדידות')
    XLSX.writeFile(wb, `checkyourself-${new Date().toISOString().slice(0,10)}.xlsx`)
    showToast('✓ הקובץ הורד')
  }

  return (
    <div className="screen history-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')} type="button">→</button>
        <h2>מידע שנשמר</h2>
        <div className="header-actions">
          {records.length > 0 && (
            <button className="export-btn" onClick={handleExport} type="button">⬇ Excel</button>
          )}
          {records.length > 0 && (
            <button className="clear-btn" onClick={handleClear} type="button">מחק הכל</button>
          )}
        </div>
      </div>

      <div className="history-body">
        {loading && (
          <div className="history-loading">
            <div className="spinner" />
            <p>טוען נתונים...</p>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="history-empty">
            <div className="empty-icon">📋</div>
            <p>אין רשומות עדיין</p>
            <p className="empty-sub">הוסיפי את המדידה הראשונה!</p>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="table-scroll">
            <table className="history-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>שעה</th>
                  <th>לחץ דם</th>
                  <th>חום</th>
                  <th>סטו׳</th>
                  <th>דופק</th>
                  <th>תרופות</th>
                  <th>הערות</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const d    = new Date(r.created_at)
                  const date = d.toLocaleDateString('he-IL')
                  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                  const bp   = bpStr(r.bp_systolic, r.bp_diastolic)
                  const temp = r.temperature != null ? `${r.temperature}°` : '—'
                  const spo2 = r.spo2        != null ? `${r.spo2}%`        : '—'
                  const puls = r.pulse       != null ? r.pulse             : '—'
                  const meds = pillNames(r)

                  return (
                    <tr key={r.id} className={i === 0 ? 'row-newest' : ''}>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td>{bp}</td>
                      <td>{temp}</td>
                      <td>{spo2}</td>
                      <td>{puls}</td>
                      <td className={meds || r.medication ? 'med-yes' : 'med-no'}>
                        {meds || (r.medication ? '✓' : '✗')}
                      </td>
                      <td className="note-cell">{r.note || '—'}</td>
                      <td>
                        <button
                          className="delete-row-btn"
                          type="button"
                          onClick={() => handleDeleteRow(r.id)}
                          title="מחק רשומה"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function bpStr(s, d) {
  if (s != null && d != null) return `${s}/${d}`
  if (s != null) return `${s}/—`
  if (d != null) return `—/${d}`
  return '—'
}

function pillNames(r) {
  if (!r.reading_medications?.length) return ''
  return r.reading_medications
    .map(rm => rm.medications?.name)
    .filter(Boolean)
    .join(', ')
}
