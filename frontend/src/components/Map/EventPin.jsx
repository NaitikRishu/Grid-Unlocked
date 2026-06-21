import { useEffect, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'
import { useReplay } from '../../hooks/useReplay'

// Glowing SVG Circle Markers
const createGlowingMarker = (color, isActive) => L.divIcon({
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      ${isActive ? `
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2.5px solid ${color};
          border-radius: 50%;
          animation: markerPulse 1.8s infinite ease-out;
          pointer-events: none;
        "></div>
      ` : ''}
      <div style="
        width: 10px;
        height: 10px;
        background-color: ${color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
        z-index: 2;
      "></div>
    </div>
  `,
  className: 'glowing-map-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const highSeverityIconActive = createGlowingMarker('#ff3b30', true)
const highSeverityIconInactive = createGlowingMarker('#ff3b30', false)

const mediumSeverityIconActive = createGlowingMarker('#ff3b30', true)
const mediumSeverityIconInactive = createGlowingMarker('#ff3b30', false)

const lowSeverityIconActive = createGlowingMarker('#34c759', true)
const lowSeverityIconInactive = createGlowingMarker('#34c759', false)

const getEventIcon = (event) => {
  const isHigh = event.priority?.toLowerCase() === 'high'
  const isMedium = event.priority?.toLowerCase() === 'medium'
  const isActive = event.status?.toLowerCase() === 'active'

  if (isHigh) return isActive ? highSeverityIconActive : highSeverityIconInactive
  if (isMedium) return isActive ? mediumSeverityIconActive : mediumSeverityIconInactive
  return isActive ? lowSeverityIconActive : lowSeverityIconInactive
}

const dummyEvents = [
  {
    id: 'evt-1',
    event_type: 'Waterlogging',
    zone_id: '4878',
    lat: 12.9784,
    lon: 77.5906,
    start_datetime: '2026-06-19T08:30:00Z',
    duration_minutes: 120,
    priority: 'high',
    status: 'active'
  },
  {
    id: 'evt-2',
    event_type: 'Road Construction',
    zone_id: '4879',
    lat: 12.9616,
    lon: 77.5746,
    start_datetime: '2026-06-19T09:00:00Z',
    duration_minutes: 240,
    priority: 'low',
    status: 'resolved'
  }
]

function EventMarker({ event, onEventClick }) {
  const { isPlaying, play, stop, error } = useReplay(event.id)
  const { replayProgress, replayActive } = useAppStore()

  const isThisEventPlaying = isPlaying && replayActive
  const eventIcon = getEventIcon(event)

  return (
    <Marker 
      position={[event.lat, event.lon]} 
      icon={eventIcon}
      eventHandlers={{
        click: () => {
          if (onEventClick) {
            onEventClick(event.id)
          }
        }
      }}
    >
      <Popup className="event-popup" onClose={stop}>
        <div className="popup-content" style={{
          fontFamily: 'inherit',
          color: '#e8f4f8',
          minWidth: '200px',
          background: 'rgba(8, 15, 40, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 207, 255, 0.12)',
          padding: '12px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="popup-tag" style={{
              background: event.priority?.toLowerCase() === 'high' ? 'var(--danger-dim)' : (event.priority?.toLowerCase() === 'medium' ? 'rgba(255,179,71,0.15)' : 'var(--success-dim)'),
              color: event.priority?.toLowerCase() === 'high' ? 'var(--danger)' : (event.priority?.toLowerCase() === 'medium' ? 'var(--warning)' : 'var(--success)'),
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              display: 'inline-block'
            }}>{event.event_type}</span>
            <span style={{
              background: 'rgba(255, 179, 71, 0.15)',
              color: '#FFB347',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>Score Badge</span>
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#00D4FF' }}>Event ID: {event.id}</h4>
          <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#8BA7C7' }}><strong style={{ color: '#FFFFFF' }}>Zone ID:</strong> {event.zone_id || 'N/A'}</p>
          <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#8BA7C7' }}><strong style={{ color: '#FFFFFF' }}>Start:</strong> {new Date(event.start_datetime).toLocaleString()}</p>
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#8BA7C7' }}><strong style={{ color: '#FFFFFF' }}>Duration:</strong> {event.duration_minutes ? `${event.duration_minutes} mins` : 'Unknown'}</p>

          <div style={{ borderTop: '1px solid rgba(0,212,255,0.15)', paddingTop: '10px', marginTop: '5px' }}>
            {isThisEventPlaying ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px', color: '#8BA7C7' }}>
                  <span>Replay active</span>
                  <span>{replayProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-inset)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${replayProgress}%`, height: '100%', background: '#00D4FF', transition: 'width 0.2s' }}></div>
                </div>
                <button 
                  onClick={stop}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: 'var(--danger)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏹ Stop Playback
                </button>
              </div>
            ) : (
              <div>
                <button 
                  onClick={play}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#00D4FF',
                    color: '#050B18',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  ▶ Play Replay
                </button>
                {error && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.7rem', margin: '4px 0 0' }}>{error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function EventPin({ onEventClick }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    client.get('/events')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setEvents(res.data)
        } else {
          setEvents(dummyEvents)
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch events from API, using dummy fallback:', err)
        setEvents(dummyEvents)
      })
  }, [])

  return (
    <>
      {events.map((event) => (
        <EventMarker key={event.id} event={event} onEventClick={onEventClick} />
      ))}
    </>
  )
}

export default EventPin
