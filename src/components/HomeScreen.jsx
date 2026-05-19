export default function HomeScreen({ setScreen, user, onSignOut }) {
  return (
    <div className="screen home-screen">
      <div className="home-glow" />

      <button className="sign-out-btn" onClick={onSignOut} type="button">
        יציאה
      </button>

      <div className="home-content">
        <div className="app-logo">
          <div className="pulse-ring" />
          <div className="pulse-ring d1" />
          <div className="logo-circle">
            <svg viewBox="0 0 34 34" fill="none">
              <path d="M17 29S5 21.5 5 13C5 9.1 8.1 6 12 6c2.5 0 4.7 1.3 6 3.2C19.3 7.3 21.5 6 24 6c3.9 0 7 3.1 7 7 0 8.5-14 16-14 16z" fill="white" opacity="0.92"/>
              <rect x="15.5" y="12" width="3" height="10" rx="1.5" fill="#0ea5e9"/>
              <rect x="12"   y="15.5" width="10" height="3" rx="1.5" fill="#0ea5e9"/>
            </svg>
          </div>
        </div>

        <h1 className="app-title">CheckYourself</h1>
        <p className="app-subtitle">מעקב מדדים בריאותיים</p>

        <div className="home-buttons">
          <button className="btn-primary" onClick={() => setScreen('entry')}>
            <span className="btn-icon">＋</span>
            <span>הכנס מידע חדש</span>
          </button>
          <button className="btn-secondary" onClick={() => setScreen('history')}>
            <span className="btn-icon">📋</span>
            <span>עיון במידע שנשמר</span>
          </button>
          <button className="btn-secondary" onClick={() => setScreen('charts')}>
            <span className="btn-icon">📈</span>
            <span>גרפים</span>
          </button>
        </div>

        <div className="home-manage-row">
          <button className="btn-manage" onClick={() => setScreen('medications')}>
            💊 ניהול תרופות
          </button>
          <button className="btn-manage" onClick={() => setScreen('metric-types')}>
            ⚙️ מדדים מותאמים
          </button>
        </div>

        <p className="user-email">{user.email}</p>
      </div>
    </div>
  )
}
