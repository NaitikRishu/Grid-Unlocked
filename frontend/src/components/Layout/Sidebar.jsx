import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'

function Sidebar({ selectedEventId, onSelectEvent }) {
  const { isPlanning, planningLat, planningLon, setIsPlanning, setPlanningCoords } = useAppStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Custom event creation states
  const [showAddForm, setShowAddForm] = useState(false)
  const [eventCause, setEventCause] = useState('IPL Match @ Chinnaswamy')
  const [locationPreset, setLocationPreset] = useState('chinnaswamy')
  const [customLat, setCustomLat] = useState('12.9784')
  const [customLon, setCustomLon] = useState('77.5994')
  const [priority, setPriority] = useState('high')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Sync store coordinates to form inputs
  useEffect(() => {
    if (isPlanning) {
      setCustomLat(planningLat.toFixed(6))
      setCustomLon(planningLon.toFixed(6))
      
      // If the coordinates differ from preset standards, switch to custom
      const isPreset = (
        (planningLat === 12.9784 && planningLon === 77.5994) ||
        (planningLat === 13.0450 && planningLon === 77.6270) ||
        (planningLat === 12.8407 && planningLon === 77.6756)
      )
      if (!isPreset) {
        setLocationPreset('custom')
      }
    }
  }, [planningLat, planningLon, isPlanning])

  const toggleAddForm = () => {
    const next = !showAddForm
    setShowAddForm(next)
    setIsPlanning(next)
    if (next) {
      setPlanningCoords(parseFloat(customLat) || 12.9784, parseFloat(customLon) || 77.5994)
    }
  }

  const handlePresetChange = (val) => {
    setLocationPreset(val)
    let lat = 12.9784
    let lon = 77.5994
    
    if (val === 'chinnaswamy') {
      lat = 12.9784
      lon = 77.5994
    } else if (val === 'manyata') {
      lat = 13.0450
      lon = 77.6270
    } else if (val === 'ecity') {
      lat = 12.8407
      lon = 77.6756
    }
    
    setCustomLat(lat.toString())
    setCustomLon(lon.toString())
    setPlanningCoords(lat, lon)
  }

  const handleLatChange = (val) => {
    setCustomLat(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setPlanningCoords(num, parseFloat(customLon) || 77.5994)
    }
  }

  const handleLonChange = (val) => {
    setCustomLon(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setPlanningCoords(parseFloat(customLat) || 12.9784, num)
    }
  }

  const handleCreateCustomEvent = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    let lat = 12.9784
    let lon = 77.5994
    
    if (locationPreset === 'manyata') {
      lat = 13.0450
      lon = 77.6270
    } else if (locationPreset === 'ecity') {
      lat = 12.8407
      lon = 77.6756
    } else if (locationPreset === 'custom') {
      lat = parseFloat(customLat) || 12.9784
      lon = parseFloat(customLon) || 77.5994
    }

    const payload = {
      event_type: 'planned',
      latitude: lat,
      longitude: lon,
      start_datetime: new Date().toISOString(),
      priority: priority,
      event_cause: eventCause
    }

    try {
      const response = await client.post('/events', payload)
      const newEvent = {
        id: response.data.id,
        event_type: response.data.event_type,
        lat: response.data.lat,
        lon: response.data.lon,
        zone_id: response.data.zone_id,
        start_datetime: response.data.start_datetime,
        priority: response.data.priority,
        status: response.data.status
      }
      
      // Prepend to list
      setEvents((prev) => [newEvent, ...prev])
      // Select the new event immediately
      onSelectEvent(newEvent.id)
      // Reset form
      setShowAddForm(false)
      setIsPlanning(false)
    } catch (err) {
      console.error('Failed to create custom event:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="panel__label" style={{ margin: 0 }}>Incident Log</p>
          <button 
            onClick={toggleAddForm}
            className="refresh-btn"
            style={{ fontSize: '0.76rem', color: '#ec4899', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700' }}
          >
            {showAddForm ? '[ Cancel ]' : '[ + Plan Event ]'}
          </button>
        </div>
        <h2>Recent Reports</h2>

        <div className="panel-scroll-content">
          {showAddForm && (
            <form onSubmit={handleCreateCustomEvent} className="dispatch-form">
              <div className="dispatch-form__group">
                <label className="dispatch-form__label">Event Cause / Title</label>
                <input 
                  type="text" 
                  value={eventCause} 
                  onChange={(e) => setEventCause(e.target.value)} 
                  required
                  className="dispatch-form__input"
                />
              </div>

              <div className="dispatch-form__group">
                <label className="dispatch-form__label">Location Preset</label>
                <select 
                  value={locationPreset} 
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="dispatch-form__select"
                >
                  <option value="chinnaswamy">Chinnaswamy Stadium (IPL)</option>
                  <option value="manyata">Manyata Tech Park</option>
                  <option value="ecity">Electronic City Phase 1</option>
                  <option value="custom">Custom Coordinates</option>
                </select>
              </div>

              {locationPreset === 'custom' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="dispatch-form__group" style={{ flex: 1 }}>
                    <label className="dispatch-form__label">Lat</label>
                    <input 
                      type="text" 
                      value={customLat} 
                      onChange={(e) => handleLatChange(e.target.value)} 
                      className="dispatch-form__input"
                    />
                  </div>
                  <div className="dispatch-form__group" style={{ flex: 1 }}>
                    <label className="dispatch-form__label">Lon</label>
                    <input 
                      type="text" 
                      value={customLon} 
                      onChange={(e) => handleLonChange(e.target.value)} 
                      className="dispatch-form__input"
                    />
                  </div>
                </div>
              )}

              <div className="dispatch-form__group">
                <label className="dispatch-form__label">Priority</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="dispatch-form__select"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="dispatch-form__btn"
              >
                {isSubmitting ? 'Registering...' : 'Add & Plan Incident'}
              </button>
            </form>
          )}
          
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
