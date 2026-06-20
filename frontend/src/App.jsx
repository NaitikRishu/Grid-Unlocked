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
      <Header />



      {/* Tabs Navigation Switcher */}
      <section className="tab-navigation-container">
        <button 
          onClick={() => setActiveTab('operations')}
          className={`chip ${activeTab === 'operations' ? 'is-active' : ''}`}
        >
          🚦 Live Operations Map
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`chip ${activeTab === 'analytics' ? 'is-active' : ''}`}
        >
          📊 Analytics Dashboard
        </button>
      </section>

      {activeTab === 'operations' ? (
        <section className="workspace">
          <Sidebar selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
          <BengaluruMap selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
          <aside className="sidebar sidebar--right">
            <WhatIfPanel selectedEvent={selectedEvent} />
          </aside>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            <DelayChart />
            <ZoneRankTable />
          </div>
          <PostEventAccuracy />
        </section>
      )}
    </main>
  )
}

export default App;
