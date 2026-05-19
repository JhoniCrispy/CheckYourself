import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function MedicationsScreen({ setScreen, showToast, user }) {
  const [meds,    setMeds]    = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding,  setAdding]  = useState(false)

  const fetchMeds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (error) showToast('שגיאה בטעינה', 'error')
    else setMeds(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchMeds() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    const { data, error } = await supabase
      .from('medications')
      .insert({ user_id: user.id, name })
      .select('*')
      .single()
    if (error) showToast('שגיאה בהוספה', 'error')
    else {
      setMeds(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      showToast('✓ תרופה נוספה')
    }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('medications').delete().eq('id', id)
    if (error) showToast('שגיאה במחיקה', 'error')
    else {
      setMeds(prev => prev.filter(m => m.id !== id))
      showToast('תרופה נמחקה')
    }
  }

  return (
    <div className="screen manage-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')} type="button">→</button>
        <h2>ניהול תרופות</h2>
      </div>

      <div className="manage-body">
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="add-input"
            type="text"
            placeholder="שם תרופה (למשל: לוסרטן 50mg)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            maxLength={80}
          />
          <button className="add-btn" type="submit" disabled={adding || !newName.trim()}>
            {adding ? '...' : '+ הוסף'}
          </button>
        </form>

        {loading && (
          <div className="history-loading"><div className="spinner" /></div>
        )}

        {!loading && meds.length === 0 && (
          <div className="manage-empty">
            <p>אין תרופות רשומות עדיין.</p>
            <p className="empty-sub">הוסיפי תרופה למעלה ותוכלי לבחור אותה בעת מדידה.</p>
          </div>
        )}

        {!loading && meds.length > 0 && (
          <ul className="manage-list">
            {meds.map(m => (
              <li key={m.id} className="manage-item">
                <span className="manage-item-name">💊 {m.name}</span>
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
