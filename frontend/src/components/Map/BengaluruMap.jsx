import { useState, useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import ZoneChoropleth from './ZoneChoropleth'
import EventPin from './EventPin'
import ViolationHeatmap from './ViolationHeatmap'
import DiversionRoutes from './DiversionRoutes'
import client from '../../api/client'
import 'leaflet/dist/leaflet.css'

const bengaluruCenter = [12.9716, 77.5946]

// Retrieve REST API key from Vite environment, fallback to the project credential
const MAPMYINDIA_REST_API_KEY = 
  import.meta.env.VITE_MAPMYINDIA_REST_API_KEY || '5fcffa1bb0b1d5af90af3d9f917ec098'

import { useAppStore } from '../../store/appStore'

function BengaluruMap({ selectedEventId, onSelectEvent }) {
  const { simulationActive, simulationRoutes, simulationDelaySaved } = useAppStore()
  const [mapProvider, setMapProvider] = useState('mapmyindia')
  const [showZones, setShowZones] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const [showViolations, setShowViolations] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState(null)

  // React to selectedEventId changes from map or sidebar selections
  useEffect(() => {
    if (selectedEventId) {
      client.get(`/routes/${selectedEventId}`)
        .then((res) => {
          setSelectedRoutes(res.data)
        })
        .catch((err) => {
          console.warn(`Failed to fetch alternate routes for event ${selectedEventId}:`, err)
          setSelectedRoutes(null)
        })
    } else {
      setSelectedRoutes(null)
    }
  }, [selectedEventId])

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
        {/* Floating Layer Controls */}
        <div className="map-overlay-controls">
          <p className="panel__label" style={{ margin: '0 0 6px' }}>Layer Toggles</p>
          <label className="control-toggle">
            <input 
              type="checkbox" 
              checked={showZones} 
              onChange={() => setShowZones(!showZones)} 
            />
            <span>Zone Choropleth</span>
          </label>
          <label className="control-toggle">
            <input 
              type="checkbox" 
              checked={showEvents} 
              onChange={() => setShowEvents(!showEvents)} 
            />
            <span>Active Events</span>
          </label>
          <label className="control-toggle">
            <input 
              type="checkbox" 
              checked={showViolations} 
              onChange={() => setShowViolations(!showViolations)} 
            />
            <span>Violation Heatmap</span>
          </label>
        </div>

        {/* Dynamic Simulation Banner Overlay */}
        {simulationActive && (
          <div 
            className="map-overlay-controls" 
            style={{ 
              top: '16px', 
              left: '16px', 
              right: 'auto', 
              borderColor: 'rgba(255,255,255,0.25)', 
              background: 'rgba(20, 20, 23, 0.95)' 
            }}
          >
            <p className="panel__label" style={{ margin: '0 0 4px', color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
              Simulation Mode
            </p>
            <h3 style={{ margin: '0', fontSize: '1rem', color: '#ffffff', fontWeight: '800' }}>
              Saves {Math.round(simulationDelaySaved)} Minutes
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#a1a1aa' }}>
              Optimized resource routing applied.
            </p>
          </div>
        )}

        <MapContainer center={bengaluruCenter} zoom={12} scrollWheelZoom className="leaflet-map">
          <TileLayer
            key={mapProvider} // Force re-render of TileLayer when provider changes
            attribution={attribution}
            url={tileUrl}
            eventHandlers={{
              tileerror: handleTileError
            }}
          />
          {showZones && <ZoneChoropleth />}
          {showEvents && <EventPin onEventClick={onSelectEvent} />}
          {showViolations && <ViolationHeatmap />}
          {simulationActive ? (
            simulationRoutes && <DiversionRoutes routes={simulationRoutes} />
          ) : (
            selectedRoutes && <DiversionRoutes routes={selectedRoutes} />
          )}
        </MapContainer>
      </div>
    </div>
  )
}

export default BengaluruMap
