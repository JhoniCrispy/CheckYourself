# CheckYourself

A simple health-vitals tracker for personal use. Runs entirely in the browser — no server, no login, no cost.

## Features

- **New Entry** — record blood pressure, temperature, SpO2, pulse, and whether you took your medication
- **View History** — scrollable table of all past readings, newest first, with automatic date/time stamp
- **Works offline** — installable as a PWA (Add to Home Screen on iPhone or Android)
- **Hebrew UI** — right-to-left layout

## Tracked Vitals

| Field | Hebrew | Example |
|-------|--------|---------|
| Blood Pressure | לחץ דם | 120/80 |
| Temperature | חום | 36.6°C |
| Oxygen Saturation | סטורציה | 98% |
| Pulse | דופק | 72 bpm |
| Medication taken | לקחתי תרופות | ✓ / ✗ |

## How to Use

### Option A — Open directly
Download or clone the repo, then open `index.html` in your phone browser.

### Option B — Host on GitHub Pages (recommended)
1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → main branch**
3. Share the generated URL with your users — they can bookmark it or add it to their home screen

### Option C — Local network
Run from any machine on your Wi-Fi:
```
npx serve .
```
Then open the printed URL on any phone on the same network.

## Data & Privacy
All data is stored locally in your browser (`localStorage`). Nothing is sent anywhere. Clearing your browser data will erase records — export to CSV (planned feature) if you want a backup.

## Project Structure
```
index.html      main app shell
style.css       styles
app.js          all logic
manifest.json   PWA config
sw.js           service worker (offline support)
```
