import { useEffect, useState } from 'react'
import client from './api/client'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import BengaluruMap from './components/Map/BengaluruMap'
import './App.css'

function App() {
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [backendState, setBackendState] = useState({
    loading: true,
    ok: false,
    message: 'Checking backend connection...',
  })

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

      <section className="status-strip">
        <article className={`status-card ${backendState.ok ? 'is-good' : 'is-warn'}`}>
          <p className="panel__label">Backend status</p>
          <h2>{backendState.loading ? 'Checking...' : backendState.ok ? 'Connected' : 'Needs startup'}</h2>
          <p className="panel__text">{backendState.message}</p>
        </article>

        <article className="status-card">
          <p className="panel__label">Data status</p>
          <h2>Phase 5 outputs present</h2>
          <p className="panel__text">
            Cleaned events, BBMP zones, and precomputed Dijkstra distance matrices are loaded and ready.
          </p>
        </article>

        <article className="status-card">
          <p className="panel__label">Map provider</p>
          <h2>OpenStreetMap base active</h2>
          <p className="panel__text">
            Operating on local relative coordinate grids with interactive route planning overlays.
          </p>
        </article>
      </section>

      <section className="workspace">
        <Sidebar selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
        <BengaluruMap selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
      </section>
    </main>
  )
}

export default App;
