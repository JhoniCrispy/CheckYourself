import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen({ showToast }) {
  const [method,     setMethod]     = useState('password') // 'password' | 'magic'
  const [mode,       setMode]       = useState('signin')   // 'signin' | 'signup'
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [magicSent,  setMagicSent]  = useState(false)

  // ── Password auth ────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) showToast('שגיאה: ' + error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) showToast('שגיאה: ' + error.message)
      else showToast('נרשמת! בדקי את האימייל שלך לאישור.')
    }

    setLoading(false)
  }

  // ── Magic link ───────────────────────────────────────────────────────────
  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) showToast('שגיאה: ' + error.message)
    else setMagicSent(true)
    setLoading(false)
  }

  const switchMethod = (m) => {
    setMethod(m)
    setMagicSent(false)
    setEmail('')
    setPassword('')
  }

  return (
    <div className="auth-screen">
      <div className="auth-glow" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-circle logo-circle--sm">
            <svg viewBox="0 0 34 34" fill="none">
              <path d="M17 29S5 21.5 5 13C5 9.1 8.1 6 12 6c2.5 0 4.7 1.3 6 3.2C19.3 7.3 21.5 6 24 6c3.9 0 7 3.1 7 7 0 8.5-14 16-14 16z" fill="white" opacity="0.92"/>
              <rect x="15.5" y="12" width="3" height="10" rx="1.5" fill="#0ea5e9"/>
              <rect x="12"   y="15.5" width="10" height="3" rx="1.5" fill="#0ea5e9"/>
            </svg>
          </div>
          <h1 className="auth-title">CheckYourself</h1>
          <p className="auth-subtitle">מעקב מדדים בריאותיים</p>
        </div>

        {/* Method tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${method === 'password' ? 'active' : ''}`}
            onClick={() => switchMethod('password')}
            type="button"
          >
            סיסמה
          </button>
          <button
            className={`auth-tab ${method === 'magic' ? 'active' : ''}`}
            onClick={() => switchMethod('magic')}
            type="button"
          >
            קישור לאימייל
          </button>
        </div>

        {/* Password form */}
        {method === 'password' && (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <div className="auth-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => setMode('signin')}
              >כניסה</button>
              <button
                type="button"
                className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >הרשמה</button>
            </div>

            <label className="auth-label">
              אימייל
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                inputMode="email"
              />
            </label>

            <label className="auth-label">
              סיסמה
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '...' : mode === 'signin' ? 'כניסה' : 'הרשמה'}
            </button>
          </form>
        )}

        {/* Magic link form */}
        {method === 'magic' && !magicSent && (
          <form className="auth-form" onSubmit={handleMagicLink}>
            <p className="auth-hint">נשלח לך קישור לכניסה מאובטחת ישירות לאימייל.</p>
            <label className="auth-label">
              אימייל
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                inputMode="email"
              />
            </label>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '...' : 'שלח קישור'}
            </button>
          </form>
        )}

        {/* Magic sent confirmation */}
        {method === 'magic' && magicSent && (
          <div className="magic-sent">
            <div className="magic-sent-icon">📬</div>
            <p>הקישור נשלח ל-<strong>{email}</strong></p>
            <p className="auth-hint">בדקי את תיבת הדואר שלך ולחצי על הקישור.</p>
            <button
              className="auth-submit auth-submit--ghost"
              type="button"
              onClick={() => { setMagicSent(false); setEmail('') }}
            >
              שלח שוב / שנה אימייל
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
