import { useEffect, useState } from 'react'
import client from './api/client'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import BengaluruMap from './components/Map/BengaluruMap'
import WhatIfPanel from './components/Controls/WhatIfPanel'
import DelayChart from './components/Analytics/DelayChart'
import ZoneRankTable from './components/Analytics/ZoneRankTable'
import PostEventAccuracy from './components/Analytics/PostEventAccuracy'
import './App.css'

function KPICard({ label, finalValue, suffix = '', borderClass = '', trend = '' }) {
  const [currentValue, setCurrentValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseFloat(finalValue)
    if (isNaN(end) || end === 0) {
      setCurrentValue(finalValue)
      return
    }
    const duration = 1200 // 1.2s
    const steps = 60
    const stepTime = duration / steps
    const increment = end / steps

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCurrentValue(end)
        clearInterval(timer)
      } else {
        setCurrentValue(start)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [finalValue])

  // Format current value based on float or int
  const formatted = typeof finalValue === 'number' || !isNaN(Number(finalValue))
    ? (Number(currentValue) % 1 === 0 ? Math.round(currentValue) : currentValue.toFixed(1))
    : finalValue;

  return (
    <div className={`kpi-card ${borderClass}`}>
      <span className="kpi-label">{label}</span>
      <h3 className="kpi-value">
        {formatted}{suffix}
      </h3>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '6px', color: borderClass.includes('orange') ? 'var(--warning)' : (borderClass.includes('green') ? 'var(--success)' : 'var(--accent)') }}>
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}

import { useRef as ReactUseRef } from 'react'

function CustomCursor() {
  const cursorRef = ReactUseRef(null)
  const mouse = ReactUseRef({ x: 0, y: 0 })
  const cursor = ReactUseRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    const tick = () => {
      cursor.current.x += (mouse.current.x - cursor.current.x) * 0.15
      cursor.current.y += (mouse.current.y - cursor.current.y) * 0.15

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursor.current.x}px, ${cursor.current.y}px, 0)`
      }
      requestAnimationFrame(tick)
    }
    const animId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: -6,
        left: -6,
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 10px #ffffff, 0 0 20px #ffffff',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform'
      }}
    />
  )
}

function App() {
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('operations')
  const [backendState, setBackendState] = useState({
    loading: true,
    ok: false,
    message: 'Checking backend connection...',
  })

  // Fetch full details of the selected event for the simulator
  useEffect(() => {
    if (selectedEventId) {
      client.get(`/events/${selectedEventId}`)
        .then((res) => {
          if (res.data && res.data.event) {
            setSelectedEvent(res.data.event)
          }
        })
        .catch((err) => {
          console.error('Error fetching event details for simulation:', err)
          setSelectedEvent(null)
        })
    } else {
      setSelectedEvent(null)
    }
  }, [selectedEventId])

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const response = await client.get('/ping')
        if (!cancelled) {
          setBackendState({
            loading: false,
            ok: response.data?.status === 'ok',
            message: 'FastAPI responded successfully through the Node proxy.',
          })
        }
      } catch (error) {
        if (!cancelled) {
          setBackendState({
            loading: false,
            ok: false,
            message:
              error.response?.data?.message ||
              'Backend not reachable yet. Start FastAPI on :8000 and Express on :3001.',
          })
        }
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="app-shell">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'operations' ? (
        <section className="workspace">
          <aside className="sidebar sidebar--left stagger-sidebar-left">
            <Sidebar selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
          </aside>
          
          <section className="map-container-wrapper stagger-map">
            <BengaluruMap selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
          </section>

          <aside className="sidebar sidebar--right stagger-sidebar-right">
            <WhatIfPanel selectedEvent={selectedEvent} />
          </aside>
        </section>
      ) : (
        <section className="analytics-workspace stagger-analytics">
          <div className="kpi-container">
            <KPICard label="Active Incidents" finalValue={200} borderClass="" trend="↑ 4% vs last hour" />
            <KPICard label="Avg Delay Saved" finalValue={18.4} suffix=" mins" borderClass="kpi-card--green" trend="↑ 1.2m optimization" />
            <KPICard label="System Accuracy" finalValue={94.8} suffix="%" borderClass="kpi-card--orange" trend="↑ 0.5% model drift low" />
            <KPICard label="Resource Optimization" finalValue={87.2} suffix="%" borderClass="kpi-card--purple" trend="↑ 12% dispatch efficiency" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            <DelayChart />
            <ZoneRankTable />
          </div>
          <PostEventAccuracy />
        </section>
      )}

      <footer className="app-footer">
        <div>GRID-UNLOCKED — © 2026 Traffic Intelligence Control Room</div>
        <div className="footer-glowing-indicator">
          <div className="pulse-dot"></div>
          <span>System status: Operational</span>
        </div>
      </footer>
    </main>
  )
}

export default App
