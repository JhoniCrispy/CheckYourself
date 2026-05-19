import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts'
import { supabase } from '../lib/supabase'

const RANGES = [
  { label: '7 ימים',  days: 7  },
  { label: '30 ימים', days: 30 },
  { label: '90 ימים', days: 90 },
  { label: 'הכל',     days: null },
]

const BUILT_IN_TABS = [
  { key: 'bp',    label: 'לחץ דם',   icon: '🫀' },
  { key: 'temp',  label: 'חום',      icon: '🌡️' },
  { key: 'spo2',  label: 'סטורציה',  icon: '🫁' },
  { key: 'pulse', label: 'דופק',     icon: '💓' },
]

const NORMAL_BANDS = {
  bp:    { sys: [90, 120], dia: [60, 80] },
  temp:  { min: 36.1, max: 37.4 },
  spo2:  { min: 95,   max: 100  },
  pulse: { min: 60,   max: 100  },
}

export default function ChartsScreen({ setScreen, showToast, user }) {
  const [records,     setRecords]     = useState([])
  const [metricTypes, setMetricTypes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [rangeIdx,    setRangeIdx]    = useState(1)
  const [activeTab,   setActiveTab]   = useState('bp')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [readRes, mtRes] = await Promise.all([
        supabase
          .from('readings')
          .select('*, custom_measurements(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('metric_types')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
      ])
      if (readRes.error) showToast('שגיאה בטעינה', 'error')
      else setRecords(readRes.data ?? [])
      if (!mtRes.error) setMetricTypes(mtRes.data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [user.id])

  const filteredRecords = () => {
    const days = RANGES[rangeIdx].days
    if (!days) return records
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return records.filter(r => new Date(r.created_at) >= cutoff)
  }

  const allTabs = [
    ...BUILT_IN_TABS,
    ...metricTypes.map(m => ({ key: `custom_${m.id}`, label: m.name, icon: '⚙️', metric: m })),
  ]

  const fmtDate = (iso) => {
    const d = new Date(iso)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  const chartData = filteredRecords().map(r => ({
    date:       fmtDate(r.created_at),
    bp_sys:     r.bp_systolic,
    bp_dia:     r.bp_diastolic,
    temp:       r.temperature != null ? parseFloat(r.temperature) : null,
    spo2:       r.spo2,
    pulse:      r.pulse,
    ...Object.fromEntries(
      (r.custom_measurements ?? []).map(cm => [`cm_${cm.metric_type_id}`, cm.value])
    ),
  }))

  const renderChart = () => {
    if (loading) return <div className="history-loading"><div className="spinner" /></div>
    if (chartData.length === 0) return (
      <div className="history-empty">
        <div className="empty-icon">📈</div>
        <p>אין נתונים בטווח הנבחר</p>
      </div>
    )

    const commonProps = {
      data: chartData,
      margin: { top: 8, right: 12, left: -16, bottom: 0 },
    }
    const axisStyle = { fill: '#475569', fontSize: 11 }
    const gridStyle = { stroke: 'rgba(255,255,255,0.05)' }

    if (activeTab === 'bp') {
      const band = NORMAL_BANDS.bp
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis domain={['auto', 'auto']} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceLine y={band.sys[1]} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={band.dia[1]} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="bp_sys" stroke="#0ea5e9" strokeWidth={2} dot={false} name="סיסטולי" connectNulls />
            <Line type="monotone" dataKey="bp_dia" stroke="rgba(14,165,233,0.45)" strokeWidth={2} dot={false} name="דיאסטולי" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (activeTab === 'temp') {
      const b = NORMAL_BANDS.temp
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis domain={[35, 40]} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}°C`, 'חום']} />
            <ReferenceLine y={b.max} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: `${b.max}°`, fill: '#10b981', fontSize: 10 }} />
            <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} name="חום" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (activeTab === 'spo2') {
      const b = NORMAL_BANDS.spo2
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis domain={[85, 100]} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'סטורציה']} />
            <ReferenceLine y={b.min} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2} dot={false} name="סטורציה" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (activeTab === 'pulse') {
      const b = NORMAL_BANDS.pulse
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis domain={['auto', 'auto']} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} bpm`, 'דופק']} />
            <ReferenceLine y={b.min} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={b.max} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="pulse" stroke="#ef4444" strokeWidth={2} dot={false} name="דופק" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // Custom metric tab
    if (activeTab.startsWith('custom_')) {
      const mtId = activeTab.replace('custom_', '')
      const mt   = metricTypes.find(m => m.id === mtId)
      const key  = `cm_${mtId}`
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis domain={['auto', 'auto']} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}${mt?.unit ? ' ' + mt.unit : ''}`, mt?.name ?? '']} />
            {mt?.normal_min != null && (
              <ReferenceLine y={mt.normal_min} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            )}
            {mt?.normal_max != null && (
              <ReferenceLine y={mt.normal_max} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
            )}
            <Line type="monotone" dataKey={key} stroke="#a78bfa" strokeWidth={2} dot={false} name={mt?.name} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return null
  }

  const activeTabInfo = allTabs.find(t => t.key === activeTab)

  return (
    <div className="screen charts-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')} type="button">→</button>
        <h2>גרפים</h2>
      </div>

      <div className="charts-body">
        {/* Range selector */}
        <div className="range-tabs">
          {RANGES.map((r, i) => (
            <button
              key={i}
              className={`range-tab ${rangeIdx === i ? 'range-tab--active' : ''}`}
              onClick={() => setRangeIdx(i)}
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Metric tabs */}
        <div className="metric-tabs-scroll">
          <div className="metric-tabs">
            {allTabs.map(t => (
              <button
                key={t.key}
                className={`metric-tab ${activeTab === t.key ? 'metric-tab--active' : ''}`}
                onClick={() => setActiveTab(t.key)}
                type="button"
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="chart-area">
          <p className="chart-title">
            {activeTabInfo?.icon} {activeTabInfo?.label}
            {activeTab === 'bp' && (
              <span className="chart-legend">
                <span className="legend-dot" style={{ background: '#0ea5e9' }} /> סיסטולי
                <span className="legend-dot" style={{ background: 'rgba(14,165,233,0.45)' }} /> דיאסטולי
              </span>
            )}
          </p>
          {renderChart()}
          <p className="chart-hint">— קו ירוק מסומן = טווח תקין</p>
        </div>

        <p className="charts-count">
          {filteredRecords().length} רשומות בטווח הנבחר
        </p>
      </div>
    </div>
  )
}

const tooltipStyle = {
  background: '#1e2a3a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 13,
}
