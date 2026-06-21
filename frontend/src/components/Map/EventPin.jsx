import { useEffect, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import client from '../../api/client'

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
      {events.map((event) => {
        const isHigh = event.priority?.toLowerCase() === 'high' || event.priority === undefined;
        const icon = isHigh ? highSeverityIcon : lowSeverityIcon;
        const eventName = (event.event_type || 'Unknown').replace(/_/g, ' ');

        return (
          <Marker 
            key={event.id} 
            position={[event.lat, event.lon]} 
            icon={icon}
            eventHandlers={{
              click: () => {
                if (onEventClick) {
                  onEventClick(event.id)
                }
              }
            }}
          >
            <Popup 
              className="custom-tooltip-popup"
              closeButton={false}
              autoPanPadding={[50, 50]}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: 'translateY(-20px)'
              }}>
                {/* Floating Chip */}
                <div style={{
                  background: '#1C1C21',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                  zIndex: 2,
                  minWidth: '180px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#EEEEF0', marginBottom: '4px' }}>
                    {eventName} (ID: {event.zone_id || 'N/A'})
                  </div>
                  <div style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8A8A90' }}>Status</span>
                    <span style={{ color: isHigh ? '#F87171' : '#6B7280', fontWeight: 600 }}>
                      {isHigh ? 'HIGH PRIORITY' : 'RESOLVED'}
                    </span>
                  </div>
                </div>

                {/* Dashed Leader Line & Anchor */}
                <div style={{ position: 'relative', height: '30px', width: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '-1px' }}>
                  <svg width="4" height="34" viewBox="0 0 4 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="2" y1="0" x2="2" y2="28" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3"/>
                    <circle cx="2" cy="30" r="2" fill="#1C1C21" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                  </svg>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default EventPin
