import { useEffect, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'
import { useReplay } from '../../hooks/useReplay'

// Premium Map Marker Icon SVG Template
const createPremiumMarker = (shellFill, shellStroke, discFill, discStroke, iconSvg) => L.divIcon({
  html: `
    <div style="width: 36px; height: 46px; position: relative;">
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="44" rx="5" ry="2.5" fill="rgba(0,0,0,0.18)"/>
        <path d="M18 2C9.163 2 2 9.163 2 18C2 28 18 42 18 42C18 42 34 28 34 18C34 9.163 26.837 2 18 2Z" 
              fill="${shellFill}" stroke="${shellStroke}" stroke-width="0.8"/>
        <circle cx="18" cy="16" r="10" fill="${discFill}" stroke="${discStroke}" stroke-width="0.6"/>
        <g transform="translate(12, 10)">
          ${iconSvg}
        </g>
      </svg>
    </div>
  `,
  className: 'premium-marker',
  iconSize: [36, 46],
  iconAnchor: [18, 44]
})

// 4. High severity incident (Amber)
const highSeverityIcon = createPremiumMarker(
  '#2A1800', 'rgba(251,191,36,0.3)', '#3D2400', 'rgba(251,191,36,0.2)',
  `<rect x="5" y="2" width="2" height="7" rx="1" fill="#FBBF24"/>
   <rect x="5" y="10" width="2" height="2" rx="1" fill="#FBBF24"/>`
)

// 5. Low / resolved incident (Gray)
const lowSeverityIcon = createPremiumMarker(
  '#131316', 'rgba(255,255,255,0.1)', '#1C1C21', 'rgba(255,255,255,0.07)',
  `<circle cx="6" cy="6" r="2" fill="#6B7280"/>`
)

const dummyEvents = [
  {
    id: 'evt-1',
    event_type: 'Waterlogging',
    zone_id: '4878',
    lat: 12.9784,
    lon: 77.5906,
    start_datetime: '2026-06-19T08:30:00Z',
    duration_minutes: 120,
    priority: 'high'
  },
  {
    id: 'evt-2',
    event_type: 'Road Construction',
    zone_id: '4879',
    lat: 12.9616,
    lon: 77.5746,
    start_datetime: '2026-06-19T09:00:00Z',
    duration_minutes: 240,
    priority: 'low'
  }
]

function EventMarker({ event, onEventClick }) {
  const { isPlaying, play, stop, error } = useReplay(event.id)
  const { replayProgress, replayActive } = useAppStore()

  const isThisEventPlaying = isPlaying && replayActive

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
        <div className="popup-content" style={{ fontFamily: 'inherit', color: '#1e293b', minWidth: '180px' }}>
          <span className="popup-tag" style={{
            background: '#ef4444',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '6px'
          }}>{event.event_type}</span>
          <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>Event ID: {event.id}</h4>
          <p style={{ margin: '0 0 2px', fontSize: '0.85rem' }}><strong>Zone ID:</strong> {event.zone_id || 'N/A'}</p>
          <p style={{ margin: '0 0 2px', fontSize: '0.85rem' }}><strong>Start:</strong> {new Date(event.start_datetime).toLocaleString()}</p>
          <p style={{ margin: '0 0 10px', fontSize: '0.85rem' }}><strong>Duration:</strong> {event.duration_minutes ? `${event.duration_minutes} mins` : 'Unknown'}</p>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px', marginTop: '5px' }}>
            {isThisEventPlaying ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px', color: '#475569' }}>
                  <span>Replay active</span>
                  <span>{replayProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#cbd5e1', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${replayProgress}%`, height: '100%', background: '#3b82f6', transition: 'width 0.2s' }}></div>
                </div>
                <button 
                  onClick={stop}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#ef4444',
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
                    background: '#3b82f6',
                    color: '#ffffff',
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
                  <p style={{ color: '#ef4444', fontSize: '0.7rem', margin: '4px 0 0' }}>{error}</p>
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
