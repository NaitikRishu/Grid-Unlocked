import { useEffect, useState } from 'react'
import client from './api/client'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import BengaluruMap from './components/Map/BengaluruMap'
import './App.css'

function App() {
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
          <h2>Phase 1 outputs present</h2>
          <p className="panel__text">
            Cleaned events and violations CSVs are in the repo, so the project can build
            forward from real data instead of placeholders.
          </p>
        </article>

        <article className="status-card">
          <p className="panel__label">Map provider</p>
          <h2>MapmyIndia path prepared</h2>
          <p className="panel__text">
            The current shell uses an OSM fallback tile layer while the MapmyIndia tile
            and snap-to-road implementation is finalized.
          </p>
        </article>
      </section>

      <section className="workspace">
        <Sidebar />
        <BengaluruMap />
      </section>
    </main>
  )
}

export default App;
