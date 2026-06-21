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

  useEffect(() => {
    if (isPlanning) {
      setCustomLat(planningLat.toFixed(6))
      setCustomLon(planningLon.toFixed(6))
      
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
      
      setEvents((prev) => [newEvent, ...prev])
      onSelectEvent(newEvent.id)
      setShowAddForm(false)
      setIsPlanning(false)
    } catch (err) {
      console.error('Failed to create custom event:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Operations Metrics Card */}
        <div className="card" style={{ padding: '16px' }}>
          <p className="text-eyebrow">LIVE SYSTEM FEEDS</p>
          <h2 className="text-section-heading" style={{ marginBottom: '16px' }}>Operations Metrics</h2>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <p className="text-metric-large">243</p>
              <p className="text-eyebrow" style={{ marginTop: '4px' }}>ACTIVE WARDS</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border)', margin: '0 16px' }} />
            <div style={{ flex: 1 }}>
              <p className="text-metric-large">10</p>
              <p className="text-eyebrow" style={{ marginTop: '4px' }}>LIVE FEEDS</p>
            </div>
          </div>
        </div>

        {/* Incident Log Card */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <p className="text-eyebrow" style={{ margin: 0 }}>INCIDENT LOG</p>
              <button 
                onClick={toggleAddForm}
                style={{ 
                  color: 'var(--accent)', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '11px', 
                  fontWeight: 500, 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showAddForm ? 'Cancel' : '+ Plan Event'}
              </button>
            </div>
            <h2 className="text-section-heading">Recent Reports</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {showAddForm && (
              <form onSubmit={handleCreateCustomEvent} style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="text-eyebrow">Event Cause</label>
                  <input 
                    type="text" 
                    value={eventCause} 
                    onChange={(e) => setEventCause(e.target.value)} 
                    required
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="text-eyebrow">Preset</label>
                  <select 
                    value={locationPreset} 
                    onChange={(e) => handlePresetChange(e.target.value)}
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="chinnaswamy">Chinnaswamy Stadium</option>
                    <option value="manyata">Manyata Tech Park</option>
                    <option value="ecity">Electronic City Phase 1</option>
                    <option value="custom">Custom Coordinates</option>
                  </select>
                </div>

                {locationPreset === 'custom' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className="text-eyebrow">Lat</label>
                      <input 
                        type="text" 
                        value={customLat} 
                        onChange={(e) => handleLatChange(e.target.value)} 
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className="text-eyebrow">Lon</label>
                      <input 
                        type="text" 
                        value={customLon} 
                        onChange={(e) => handleLonChange(e.target.value)} 
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="text-eyebrow">Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ background: 'var(--accent)', color: '#ffffff', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Registering...' : 'Add & Plan Incident'}
                </button>
              </form>
            )}
            
            {loading ? (
              <p className="text-body">Loading incident log...</p>
            ) : events.length === 0 ? (
              <p className="text-body">No active incidents found.</p>
            ) : (
              events.map((event) => {
                const isActive = selectedEventId === event.id;
                const isHigh = event.priority?.toLowerCase() === 'high';
                return (
                  <div 
                    key={event.id} 
                    onClick={() => onSelectEvent(event.id)}
                    style={{
                      background: isActive ? (isHigh ? 'var(--danger-dim)' : 'var(--accent-dim)') : 'var(--bg-raised)',
                      borderLeft: isHigh ? '2px solid var(--danger)' : '2px solid var(--warning)',
                      borderRight: '1px solid transparent',
                      borderTop: '1px solid transparent',
                      borderBottom: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      opacity: isActive ? 1 : 0.85,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge-text" style={{
                        background: isHigh ? 'var(--danger-dim)' : 'rgba(255, 159, 10, 0.15)',
                        color: isHigh ? 'var(--danger)' : 'var(--warning)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {event.priority || 'LOW'}
                      </span>
                      <span className="text-mono" style={{ color: 'var(--text-muted)' }}>
                        {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {event.event_type.replace('_', ' ')}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Ward {event.zone_id || 'N/A'} • {event.status || 'Active'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>System Uptime: 99.98%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>v2.2.0</span>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              background: 'transparent',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Refresh Feeds
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
