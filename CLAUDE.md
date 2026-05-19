# CheckYourself — Developer Notes

## What this is
A lightweight health-vitals tracking PWA for a small group of personal users.
No backend. No accounts. Data lives in the browser's `localStorage` per device.

## Tech Stack
- **Plain HTML + CSS + JavaScript** — no framework, no build step
- **localStorage** for persistence
- **PWA** — `manifest.json` + service worker so it installs to the phone home screen

## File Structure
```
/
├── index.html          # shell + router (shows/hides screens)
├── style.css           # all styles
├── app.js              # all logic (data layer + screen controllers)
├── manifest.json       # PWA manifest
├── sw.js               # service worker (offline cache)
└── icons/              # app icons (192x192, 512x512)
```

## Screens
| ID | Purpose |
|----|---------|
| `#home` | Two buttons: "New Entry" and "View History" |
| `#entry` | Form: blood pressure, temperature, saturation, pulse, medication checkbox. Save button writes to localStorage with `Date.now()` timestamp. |
| `#history` | Table of all saved records, newest first. Columns: Date, Time, BP, Temp, SpO2, Pulse, Meds. |

## Data Model
Records are stored as a JSON array under the key `checkyourself_records`.

```json
[
  {
    "id": 1716100000000,
    "timestamp": "2026-05-19T10:30:00.000Z",
    "bp_systolic": 120,
    "bp_diastolic": 80,
    "temperature": 36.6,
    "spo2": 98,
    "pulse": 72,
    "medication": true
  }
]
```

## Key Decisions
- **No backend** — keeps setup to zero and cost to zero; each user's data stays on their own device.
- **No framework** — zero build tooling; open `index.html` in a browser and it works.
- **PWA** — users can "Add to Home Screen" so it looks and feels like a native app.
- **Hebrew-friendly** — UI labels in Hebrew, `dir="rtl"` on the page, `lang="he"`.

## Running Locally
Open `index.html` directly in a browser, or serve with any static server:
```
npx serve .
```

## Deployment
Push to GitHub and enable GitHub Pages on the `main` branch — free, instant, no config.
