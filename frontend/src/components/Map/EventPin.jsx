import { useEffect, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import client from '../../api/client'

// Custom marker pin styled with HTML/CSS for a premium glowing indicator look
const eventIcon = L.divIcon({
  className: 'custom-event-pin',
  html: `<div class="pin-pulse"></div><div class="pin-core"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const dummyEvents = [
  {
    id: 'evt-1',
    event_type: 'Waterlogging',
    zone_id: '4878',
    lat: 12.9784,
    lon: 77.5906,
    start_datetime: '2026-06-19T08:30:00Z',
    duration_minutes: 120
  },
  {
    id: 'evt-2',
    event_type: 'Road Construction',
    zone_id: '4879',
    lat: 12.9616,
    lon: 77.5746,
    start_datetime: '2026-06-19T09:00:00Z',
    duration_minutes: 240
  },
  {
    id: 'evt-3',
    event_type: 'Vehicle Breakdown',
    zone_id: '4882',
    lat: 12.9912,
    lon: 77.5948,
    start_datetime: '2026-06-19T10:15:00Z',
    duration_minutes: 45
  },
  {
    id: 'evt-4',
    event_type: 'Protest / Rally',
    zone_id: '4883',
    lat: 12.9716,
    lon: 77.6046,
    start_datetime: '2026-06-19T11:00:00Z',
    duration_minutes: 180
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
      {events.map((event) => (
        <Marker 
          key={event.id} 
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
          <Popup className="event-popup">
            <div className="popup-content" style={{ color: '#ffffff' }}>
              <span className="popup-tag" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '8px'
              }}>{event.event_type}</span>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: '700' }}>Event ID: {event.id}</h4>
              <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#a1a1aa' }}><strong>Zone ID:</strong> {event.zone_id || 'N/A'}</p>
              <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#a1a1aa' }}><strong>Start:</strong> {new Date(event.start_datetime).toLocaleString()}</p>
              <p style={{ margin: '0', fontSize: '0.8rem', color: '#a1a1aa' }}><strong>Duration:</strong> {event.duration_minutes ? `${event.duration_minutes} mins` : 'Unknown'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default EventPin
