import { useEffect, useState } from 'react'
import client from '../../api/client'

function Sidebar({ selectedEventId, onSelectEvent }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/events')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setEvents(res.data.slice(0, 10)) // show top 10 events
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching events for sidebar:', err)
        setLoading(false)
      })
  }, [])

  const getPriorityClass = (priority) => {
    if (!priority) return 'badge--low'
    const p = priority.toLowerCase()
    if (p === 'high') return 'badge--high'
    if (p === 'medium') return 'badge--medium'
    return 'badge--low'
  }

  return (
    <aside className="sidebar">
      <div className="panel panel--glow">
        <p className="panel__label">Live System Feeds</p>
        <h2>Operations Metrics</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-val">243</span>
            <span className="stat-lbl">Active Wards</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">10</span>
            <span className="stat-lbl">Live Feeds</span>
          </div>
        </div>
      </div>

      <div className="panel panel--scrollable">
        <p className="panel__label">Incident Log</p>
        <h2>Recent Reports</h2>
        
        {loading ? (
          <p className="panel__text">Loading incident log...</p>
        ) : events.length === 0 ? (
          <p className="panel__text">No active incidents found.</p>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <div 
                key={event.id} 
                className={`event-card ${selectedEventId === event.id ? 'is-active' : ''}`}
                onClick={() => onSelectEvent(event.id)}
              >
                <div className="event-card__header">
                  <span className={`badge ${getPriorityClass(event.priority)}`}>
                    {event.priority || 'low'}
                  </span>
                  <span className="event-card__time">
                    {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3>{event.event_type.replace('_', ' ')}</h3>
                <p className="event-card__meta">
                  <span>Ward {event.zone_id || 'N/A'}</span>
                  <span>•</span>
                  <span>{event.status || 'active'}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar__footer">
        <div className="footer-status">
          <span className="pulse-indicator"></span>
          <span>System Uptime: 99.98%</span>
        </div>
        <div className="footer-meta">
          <span>v2.1.0-noir</span>
          <span>•</span>
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            Refresh Feeds
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
