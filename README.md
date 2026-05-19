# CheckYourself

A personal health-vitals tracker. Log blood pressure, temperature, SpO2, pulse, and medication — from any device, with data synced to the cloud per user.

## Tech
- **React + Vite** frontend
- **Supabase** — PostgreSQL database + auth (email/password and magic link)

---

## Setup (one-time, ~10 minutes)

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project (free tier)
2. Wait ~1 minute for it to spin up
3. Go to **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → Run

### 2. Get your API keys
In Supabase: **Settings → API**
- Copy **Project URL**
- Copy **anon / public** key

### 3. Configure the app
```
cp .env.example .env
```
Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally
```
npm install
npm run dev
```
Open the printed URL in your browser or phone.

---

## Auth setup in Supabase (optional tweaks)
In your Supabase dashboard → **Authentication → Settings**:
- **Email confirmation**: disable it if you want users to log in immediately without confirming their email
- **Magic link** is enabled by default
- **Email + password** is enabled by default

---

## Deploy (share with your group)

### Netlify (recommended — auto-deploys on every push)
1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project** → pick this repo
3. Build settings are handled automatically by [`netlify.toml`](netlify.toml) — no manual config needed
4. Add env vars in **Netlify → Site settings → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Trigger a redeploy — from here on, every `git push` auto-deploys

### Supabase redirect URL (required for magic link)
After deploying, go to Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-site.netlify.app`
- **Redirect URLs**: add `https://your-site.netlify.app`

### Session persistence
Users stay logged in automatically for ~7 days — Supabase stores the session in localStorage. No repeated logins needed.

---

## Features
- Login with email + password, or magic link (no password)
- New entry: blood pressure, temperature, SpO2, pulse, medication checkbox
- Timestamp saved automatically from the device clock
- History table — newest first, per-user data (Row Level Security)

## Project Structure
```
src/
├── App.jsx                 auth state + screen routing
├── index.css               all styles
├── lib/supabase.js         supabase client
└── components/
    ├── AuthScreen.jsx
    ├── HomeScreen.jsx
    ├── EntryScreen.jsx
    └── HistoryScreen.jsx
supabase/schema.sql         DB table + RLS policy
```
