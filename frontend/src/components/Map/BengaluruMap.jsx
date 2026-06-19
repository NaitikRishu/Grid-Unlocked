import { useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import ZoneChoropleth from './ZoneChoropleth'
import 'leaflet/dist/leaflet.css'

const bengaluruCenter = [12.9716, 77.5946]

// Retrieve REST API key from Vite environment, fallback to the project credential
const MAPMYINDIA_REST_API_KEY = 
  import.meta.env.VITE_MAPMYINDIA_REST_API_KEY || '5fcffa1bb0b1d5af90af3d9f917ec098'

function BengaluruMap() {
  const [mapProvider, setMapProvider] = useState('mapmyindia')

  const tileUrl = mapProvider === 'mapmyindia'
    ? `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_REST_API_KEY}/tile/{z}/{x}/{y}.png`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const attribution = mapProvider === 'mapmyindia'
    ? '&copy; MapmyIndia'
    : '&copy; OpenStreetMap contributors'

  const handleTileError = () => {
    if (mapProvider === 'mapmyindia') {
      console.warn('MapmyIndia tile layer failed to load (returned 412 or unauthorized). Falling back to OpenStreetMap.')
      setMapProvider('osm')
    }
  }

  return (
    <div className="map-shell">
      <div className="map-shell__header">
        <div>
          <p className="panel__label">Map Surface</p>
          <h2>Bengaluru Operations View</h2>
        </div>
        <span className={`chip ${mapProvider === 'mapmyindia' ? 'chip--success' : 'chip--warn'}`}>
          {mapProvider === 'mapmyindia' ? 'MapmyIndia Active' : 'OSM Fallback Active'}
        </span>
      </div>

      <div className="map-frame">
        <MapContainer center={bengaluruCenter} zoom={12} scrollWheelZoom className="leaflet-map">
          <TileLayer
            key={mapProvider} // Force re-render of TileLayer when provider changes
            attribution={attribution}
            url={tileUrl}
            eventHandlers={{
              tileerror: handleTileError
            }}
          />
          <ZoneChoropleth />
          <Marker position={bengaluruCenter}>
            <Popup>Grid Unlocked map shell is live and ready for zone/event layers.</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  )
}

export default BengaluruMap
