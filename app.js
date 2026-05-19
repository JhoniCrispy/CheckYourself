'use strict';

const STORAGE_KEY = 'checkyourself_records';

// ─── Data layer ───────────────────────────────────────────────────────────────

function getRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(record) {
  const records = getRecords();
  records.unshift(record);
  saveRecords(records);
}

function clearRecords() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToHistory() {
  renderHistory();
  showScreen('screen-history');
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ─── Timestamp preview ────────────────────────────────────────────────────────

function updateTimestampHint() {
  const el = document.getElementById('ts-hint');
  if (!el) return;
  const now = new Date();
  const date = now.toLocaleDateString('he-IL');
  const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  el.textContent = `יישמר אוטומטית: ${date} בשעה ${time}`;
}

// ─── Entry form ───────────────────────────────────────────────────────────────

function handleSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);

  const record = {
    id:           Date.now(),
    timestamp:    new Date().toISOString(),
    bp_systolic:  num(fd.get('bp_systolic')),
    bp_diastolic: num(fd.get('bp_diastolic')),
    temperature:  float(fd.get('temperature')),
    spo2:         num(fd.get('spo2')),
    pulse:        num(fd.get('pulse')),
    medication:   fd.get('medication') === 'on'
  };

  addRecord(record);
  e.target.reset();
  showToast('✓ נשמר בהצלחה');
  showScreen('screen-home');
}

function num(v)   { const n = parseInt(v);   return isNaN(n) ? null : n; }
function float(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

// ─── History ──────────────────────────────────────────────────────────────────

function renderHistory() {
  const records = getRecords();
  const empty   = document.getElementById('history-empty');
  const scroll  = document.getElementById('table-scroll');
  const tbody   = document.getElementById('history-tbody');

  if (records.length === 0) {
    empty.style.display  = 'flex';
    scroll.style.display = 'none';
    return;
  }

  empty.style.display  = 'none';
  scroll.style.display = '';

  tbody.innerHTML = records.map(r => {
    const d    = new Date(r.timestamp);
    const date = d.toLocaleDateString('he-IL');
    const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const bp = bpStr(r.bp_systolic, r.bp_diastolic);
    const temp  = r.temperature != null ? `${r.temperature}°` : '—';
    const spo2  = r.spo2        != null ? `${r.spo2}%`        : '—';
    const pulse = r.pulse       != null ? r.pulse              : '—';
    const medCls = r.medication ? 'med-yes' : 'med-no';
    const med    = r.medication ? '✓' : '✗';

    return `<tr>
      <td>${date}</td>
      <td>${time}</td>
      <td>${bp}</td>
      <td>${temp}</td>
      <td>${spo2}</td>
      <td>${pulse}</td>
      <td class="${medCls}">${med}</td>
    </tr>`;
  }).join('');
}

function bpStr(s, d) {
  if (s != null && d != null) return `${s}/${d}`;
  if (s != null) return `${s}/—`;
  if (d != null) return `—/${d}`;
  return '—';
}

function confirmClear() {
  if (confirm('למחוק את כל הרשומות השמורות?')) {
    clearRecords();
    renderHistory();
    showToast('כל הרשומות נמחקו');
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updateTimestampHint();
  setInterval(updateTimestampHint, 30000);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
