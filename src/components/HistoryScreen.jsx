import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function HistoryScreen({ setScreen, showToast, user }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) showToast('שגיאה בטעינת הנתונים')
    else setRecords(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const handleClear = async () => {
    if (!confirm('למחוק את כל הרשומות שלך?')) return
    const { error } = await supabase.from('readings').delete().eq('user_id', user.id)
    if (error) showToast('שגיאה במחיקה')
    else { setRecords([]); showToast('כל הרשומות נמחקו') }
  }

  return (
    <div className="screen history-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')} type="button">→</button>
        <h2>מידע שנשמר</h2>
        {records.length > 0 && (
          <button className="clear-btn" onClick={handleClear} type="button">מחק הכל</button>
        )}
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
                  <th>סטורציה</th>
                  <th>דופק</th>
                  <th>תרופות</th>
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
                  const puls = r.pulse       != null ? r.pulse              : '—'

                  return (
                    <tr key={r.id} className={i === 0 ? 'row-newest' : ''}>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td>{bp}</td>
                      <td>{temp}</td>
                      <td>{spo2}</td>
                      <td>{puls}</td>
                      <td className={r.medication ? 'med-yes' : 'med-no'}>
                        {r.medication ? '✓' : '✗'}
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
