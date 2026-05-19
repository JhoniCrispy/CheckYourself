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

---

## Feature Roadmap

### 1. Export to Excel
**Complexity: Low** | Library: `xlsx` (SheetJS)

- "ייצוא לאקסל" button in HistoryScreen header (ghost/outline style)
- Fetches all user records → formats to worksheet → triggers `.xlsx` download
- No backend changes needed — pure client-side

### 2. Custom Medications (Pills Management)
**Complexity: Medium** | Requires 2 new DB tables

The current boolean "took medication" is too coarse. Proposed model:
- **`medications` table** — per-user named pills (e.g., "Lisinopril 10mg")
- **`reading_medications` junction table** — which pills were taken per reading

**UI flow:**
- In EntryScreen: replace the checkbox with a multi-select chip list of the user's saved pills. Each pill is a rounded chip; checked state uses `--green` fill. A "+ הוסף תרופה" button opens an inline name input
- In HistoryScreen: each row shows pill name(s) taken, not just ✓/✗
- New "ניהול תרופות" screen reachable from HomeScreen — list with delete/rename per pill

### 3. Charts / Graphs
**Complexity: Medium** | Library: `recharts` or `chart.js`

- Dedicated `ChartsScreen` with metric tabs (BP, Temperature, SpO2, Pulse)
- Line chart per metric, last 30 days by default with a date range picker
- BP chart shows two lines (systolic in `--accent` blue, diastolic at 40% opacity) with a shaded normal-range band
- Color coding consistent with vital range thresholds (green / amber / red)

### 4. Additional Quick Wins

| Feature | Value | Complexity |
|---|---|---|
| **Delete single row** in history (not just "delete all") | High | Low |
| **Normal range color feedback** on entry inputs — border turns amber/red as you type | High | Low |
| **Notes / free text field** per reading | High | Low — one DB column + textarea |
| **Edit an existing record** (tap row → edit form) | Medium | Medium |
| **Daily reminder banner** — "לא מדדת היום" if no entry today | Medium | Medium |
| **Multi-user / shared view** — caregiver sees patient data read-only | High | High |
| **Profile screen** — name, date of birth, personal context | Low | Low |

### Recommended build order
1. **Delete single row** — quick win, delete infrastructure already exists
2. **Export to Excel** — zero DB changes, immediately useful
3. **Normal range color feedback** — makes entry form smarter, CSS + logic only
4. **Custom medications** — biggest UX improvement, requires DB migration
5. **Charts** — most visual impact, builds on all existing data

---

## Design System — "Midnight Clinic"

The UI follows a single coherent design language: a dark, clinical-precision aesthetic. Think medical monitor meets modern mobile app — not a hospital dashboard, but a personal device a doctor would actually want to carry.

### Current Design Tokens (`src/index.css`)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0f1e` | Deep navy — primary background |
| `--surface` | `#111827` | Card / header surfaces |
| `--surface-2` | `#1e2a3a` | Input backgrounds |
| `--surface-3` | `#243044` | Hover states, active toggles |
| `--accent` | `#0ea5e9` | Sky blue — primary actions, focus rings |
| `--accent-glow` | `rgba(14,165,233,0.28)` | Soft halo on focused inputs |
| `--green` | `#10b981` | Emerald — save, success, medication on |
| `--green-glow` | `rgba(16,185,129,0.28)` | Halo on save button |
| `--danger` | `#ef4444` | Destructive actions (delete) |
| `--text` | `#f1f5f9` | Primary text |
| `--text-soft` | `#94a3b8` | Secondary labels |
| `--text-muted` | `#475569` | Placeholder, hints |
| `--radius` | `16px` | Cards, buttons |
| `--radius-sm` | `10px` | Inputs, badges |

**Font:** Heebo (Google Fonts) — a Hebrew-native sans-serif. Weights 300–800 loaded. Field values render at 1.45rem/600 weight for numeric readability.

**Animations:**
- `screen-in` — 220ms fade + 18px Y lift on every screen mount
- `beat` — 1.4s cardiac double-beat on the logo circle
- `ring` — 2.6s expanding pulse rings behind the logo (two staggered)
- `spin` — loading spinner
- Toggle thumb uses `cubic-bezier(0.34,1.56,0.64,1)` — a slight overshoot spring for physicality

**Background depth:** Two layered radial gradients on home and auth screens: a blue ellipse at the top, a green ellipse at the bottom corner. Gives depth without visual noise.

---

### Design Review & Recommendations

#### What works well
- **Color discipline** — two accents (blue + green) with clear semantic meaning. Blue = navigate/select, green = confirm/save. Never mixed up.
- **Heartbeat logo** — the double-beat animation correctly mimics a real cardiac waveform (lub-dub rhythm), not a generic pulse. Memorable and context-appropriate.
- **Focus state consistency** — every input uses the same `box-shadow: 0 0 0 3px var(--accent-glow)` pattern. Feels system-coherent.
- **Toggle switch spring** — the `cubic-bezier` overshoot on the medication toggle gives it a satisfying physical feel that stands out.
- **Safe area handling** — `env(safe-area-inset-*)` used throughout; works correctly on iOS notch + home-indicator devices.

#### Recommended improvements

**1. Add a monospace font for vital numbers**
Right now Heebo displays numbers in form inputs. Heebo is a proportional font — digits have varying widths, which causes small jitter when values change. A monospace like `JetBrains Mono` or `DM Mono` on the `field-input` class would make readings feel more like a clinical readout. Import alongside Heebo and apply only to number inputs.

**2. Vital range color feedback on inputs**
The most impactful low-effort improvement. As the user types a BP of 160+, the input border should shift from `--accent` (blue) → amber `#f59e0b` → `--danger` (red). Same for SpO2 below 95%, temperature above 37.5°C. Ranges:

| Metric | Normal | Borderline | Alert |
|---|---|---|---|
| BP systolic | < 130 | 130–139 | ≥ 140 |
| BP diastolic | < 85 | 85–89 | ≥ 90 |
| SpO2 | ≥ 96% | 93–95% | < 93% |
| Temperature | ≤ 37.4° | 37.5–38° | > 38° |
| Pulse | 60–100 | 50–59 / 101–120 | < 50 / > 120 |

Add `--warn: #f59e0b` to `:root` and a `--warn-glow: rgba(245,158,11,0.25)`. Compute the class in the input's `onChange` handler.

**3. Subtle noise texture on the background**
The flat `#0a0f1e` background reads as empty on larger screens. A 3–5% opacity SVG noise overlay (a `<filter>` `feTurbulence` element baked into a data URI as a `background-image`) adds tactile depth without loading any extra asset. One CSS rule, zero performance cost.

```css
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,..."); /* feTurbulence noise */
  opacity: 0.035;
  pointer-events: none; z-index: 0;
}
```

**4. Staggered card reveal on entry form**
The form slides in as one block. Adding `animation-delay` per `.field-card` (0ms, 60ms, 120ms, 180ms, 240ms) gives a cascade waterfall effect. The cards already have the `screen-in` keyframe available — just set `animation-fill-mode: both` and stagger the delay. Zero new CSS rules needed.

**5. Use a second display-weight font for screen titles**
Heebo 800 works but every screen title looks identical. Consider `Syne` (Google Fonts, free) for the `h2` headings and app title — it has distinct character at heavy weights and supports Latin fallback for any non-Hebrew content. The contrast between Syne headings and Heebo body text creates immediate visual hierarchy.

**6. History table: mini status dots per reading**
Replace the plain ✓/✗ in the medication column with a small colored dot. More importantly, add a 6px colored dot in the BP column: green if normal, amber if borderline, red if high. One glance tells you which readings need attention. This is CSS-only with a `::before` pseudo-element keyed off a `data-status` attribute.

**7. Differentiate screen-exit animation direction**
Currently all screens use the same enter animation. Exiting back to home (`→` button) should feel like going back — a right-exit (`translateX(+20px)` fade) vs. entering a sub-screen which feels like going forward (current Y-lift). Requires adding an exit class toggled before `setScreen()` is called, with a 200ms delay.

**8. Glass effect on auth card**
The auth card sits on a gradient background but uses a flat `var(--surface)` fill. Adding `backdrop-filter: blur(20px) saturate(1.4)` with a slightly transparent background (`rgba(17,24,39,0.75)`) would make the card feel like frosted glass floating over the depth behind it. Works in all target browsers (iOS Safari 9+, Chrome 76+).

---

### Planned Features (Design Implications)

| Feature | Design notes |
|---|---|
| **Export to Excel** | Button in HistoryScreen header, ghost style (outline, not filled) so it doesn't compete with "Delete all" |
| **Custom medications** | Multi-select pill list — each pill is a rounded chip with a checkmark; checked state uses `--green` fill. "+ Add pill" opens an inline input at the bottom of the list |
| **Charts / Graphs** | Dedicated screen with metric tabs. Use `--accent` line on `--surface-2` background. BP chart uses two lines (systolic in blue, diastolic in `rgba(14,165,233,0.4)`) with a shaded normal-range band in `rgba(16,185,129,0.08)` |
| **Delete single row** | Swipe-left reveal (iOS pattern) or long-press → red delete button slides in from the right side of the row |
| **Normal range indicators on entry** | See recommendation #2 above — amber/red input borders |
| **Notes field** | Multiline `<textarea>` at the bottom of the entry form, same `field-card` style, placeholder: "הערות (אופציונלי)" |
