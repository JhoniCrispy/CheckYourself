# CheckYourself — Developer Notes

## Stack
- **Vite + React 18** (plain JS, no TypeScript)
- **Supabase** — PostgreSQL database + Auth (email/password and magic link)
- **Pure CSS** — custom design system in `src/index.css`, dark "Midnight Clinic" theme
- **Hebrew RTL** — `lang="he" dir="rtl"` on `<html>`, Heebo font

## File Structure
```
/
├── index.html              Vite entry (root-level)
├── vite.config.js
├── package.json
├── .env                    VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (not committed)
├── .env.example            Template for env vars
├── supabase/
│   └── schema.sql          Run once in Supabase SQL editor to create the table
├── public/
│   ├── manifest.json       PWA manifest
│   └── icons/icon.svg      App icon
└── src/
    ├── main.jsx            React root
    ├── App.jsx             Auth state + screen router
    ├── index.css           All styles
    ├── lib/
    │   └── supabase.js     Supabase client (reads from import.meta.env)
    └── components/
        ├── AuthScreen.jsx  Login — email+password and magic link
        ├── HomeScreen.jsx  Two main buttons + sign out
        ├── EntryScreen.jsx Vitals form → inserts to Supabase
        └── HistoryScreen.jsx Table of readings from Supabase
```

## Data Model (Supabase)
Table: `readings`
| Column       | Type    | Notes                        |
|--------------|---------|------------------------------|
| id           | uuid    | PK, auto-generated           |
| user_id      | uuid    | FK → auth.users, NOT NULL    |
| created_at   | timestamptz | auto, set on insert      |
| bp_systolic  | int     | nullable                     |
| bp_diastolic | int     | nullable                     |
| temperature  | numeric(4,1) | nullable               |
| spo2         | int     | nullable                     |
| pulse        | int     | nullable                     |
| medication   | boolean | default false                |

Row Level Security is enabled — users only see/write their own rows.

## Auth
- Email + password (sign in / sign up modes)
- Magic link (OTP via email)
- Both handled by Supabase Auth; session is persisted in localStorage by the SDK
- `App.jsx` listens to `onAuthStateChange` to react to login/logout

## Adding New Features
- New screen: create `src/components/NewScreen.jsx`, add a state value in `App.jsx`, render it in the `{screen === 'new-screen' && ...}` block
- New DB column: add it to `supabase/schema.sql` (for reference), run `ALTER TABLE readings ADD COLUMN ...` in Supabase SQL editor, add the field to `EntryScreen.jsx` form and `HistoryScreen.jsx` table

## Local Dev
```
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```

## Deploy
Build and host the `dist/` folder on any static host (Netlify, Vercel, GitHub Pages).
```
npm run build
```
Set the same env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's dashboard.
