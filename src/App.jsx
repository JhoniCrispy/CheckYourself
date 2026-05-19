import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import AuthScreen    from './components/AuthScreen'
import HomeScreen    from './components/HomeScreen'
import EntryScreen   from './components/EntryScreen'
import HistoryScreen from './components/HistoryScreen'

export default function App() {
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [screen,      setScreen]      = useState('home')
  const [toast,       setToast]       = useState(null)

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }, [])

  // ── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setScreen('home')
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="splash">
        <div className="splash-logo">
          <div className="logo-circle">
            <svg viewBox="0 0 34 34" fill="none">
              <path d="M17 29S5 21.5 5 13C5 9.1 8.1 6 12 6c2.5 0 4.7 1.3 6 3.2C19.3 7.3 21.5 6 24 6c3.9 0 7 3.1 7 7 0 8.5-14 16-14 16z" fill="white" opacity="0.92"/>
              <rect x="15.5" y="12" width="3" height="10" rx="1.5" fill="#0ea5e9"/>
              <rect x="12"   y="15.5" width="10" height="3" rx="1.5" fill="#0ea5e9"/>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen showToast={showToast} />
  }

  const screenProps = { setScreen, showToast, user }

  return (
    <>
      {screen === 'home'    && <HomeScreen    {...screenProps} onSignOut={handleSignOut} />}
      {screen === 'entry'   && <EntryScreen   {...screenProps} />}
      {screen === 'history' && <HistoryScreen {...screenProps} />}

      {toast && <div className="toast show">{toast}</div>}
    </>
  )
}
