import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

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
    zone_id: 4878,
    lat: 12.9784,
    lon: 77.5906,
    start_datetime: '2026-06-19T08:30:00Z',
    duration_minutes: 120
  },
  {
    id: 'evt-2',
    event_type: 'Road Construction',
    zone_id: 4879,
    lat: 12.9616,
    lon: 77.5746,
    start_datetime: '2026-06-19T09:00:00Z',
    duration_minutes: 240
  },
  {
    id: 'evt-3',
    event_type: 'Vehicle Breakdown',
    zone_id: 4882,
    lat: 12.9912,
    lon: 77.5948,
    start_datetime: '2026-06-19T10:15:00Z',
    duration_minutes: 45
  },
  {
    id: 'evt-4',
    event_type: 'Protest / Rally',
    zone_id: 4883,
    lat: 12.9716,
    lon: 77.6046,
    start_datetime: '2026-06-19T11:00:00Z',
    duration_minutes: 180
  }
]

function EventPin() {
  return (
    <>
      {dummyEvents.map((event) => (
        <Marker 
          key={event.id} 
          position={[event.lat, event.lon]} 
          icon={eventIcon}
        >
          <Popup className="event-popup">
            <div className="popup-content">
              <span className="popup-tag">{event.event_type}</span>
              <h3>Event ID: {event.id}</h3>
              <p><strong>Zone ID:</strong> {event.zone_id}</p>
              <p><strong>Start Time:</strong> {new Date(event.start_datetime).toLocaleTimeString()}</p>
              <p><strong>Duration:</strong> {event.duration_minutes} mins</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default EventPin
