import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import ZoneChoropleth from './ZoneChoropleth'
import EventPin from './EventPin'
import ViolationHeatmap from './ViolationHeatmap'
import DiversionRoutes from './DiversionRoutes'
import client from '../../api/client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAppStore } from '../../store/appStore'

const bengaluruCenter = [12.9716, 77.5946]

const MAPMYINDIA_REST_API_KEY = 
  import.meta.env.VITE_MAPMYINDIA_REST_API_KEY || '5fcffa1bb0b1d5af90af3d9f917ec098'

// Spinning target target icon for planned event placement
const planningPinIcon = L.divIcon({
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: rgba(59, 130, 246, 0.25);
      border: 2px dashed #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
      animation: pinSpin 6s linear infinite;
      transform: translate(-50%, -50%);
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
        box-shadow: 0 0 6px #3b82f6;
      "></div>
    </div>
    <style>
      @keyframes pinSpin {
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    </style>
  `,
  className: 'custom-planning-pin',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

// Sub-component to capture map click coordinates during planned event placement
function MapEvents({ isPlanning, setPlanningCoords }) {
  useMapEvents({
    click(e) {
      if (isPlanning) {
        setPlanningCoords(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

function BengaluruMap({ selectedEventId, onSelectEvent }) {
  const { 
    simulationActive, 
    simulationRoutes, 
    simulationDelaySaved,
    isPlanning,
    planningLat,
    planningLon,
    setPlanningCoords
  } = useAppStore()

  const [mapProvider, setMapProvider] = useState('mapmyindia')
  const [showZones, setShowZones] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const [showViolations, setShowViolations] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState(null)

  // Replay timeline states
  const [replaySnapshots, setReplaySnapshots] = useState(null)
  const [replayStep, setReplayStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [replayError, setReplayError] = useState(null)

  // Sync route lines when selectedEventId changes
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

  // Establish WebSocket connection to stream and buffer historical replays
  useEffect(() => {
    // Reset playback controls
    setReplaySnapshots(null)
    setReplayStep(0)
    setIsPlaying(false)
    setReplayError(null)
    setIsBuffering(false)

    if (!selectedEventId) return

    // Don't buffer replay for custom planned events (they don't have precomputed timeline)
    if (selectedEventId.startsWith('CUSTOM')) {
      setReplayError("Replay timeline only available for historical incidents.")
      return
    }

    setIsBuffering(true)
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const ws = new WebSocket(`${protocol}${window.location.host}/replay`)
    const buffer = []

    ws.onopen = () => {
      ws.send(JSON.stringify({ event_id: selectedEventId }))
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'SNAPSHOT') {
          buffer.push(msg.data)
        } else if (msg.type === 'COMPLETE') {
          setReplaySnapshots(buffer)
          setIsBuffering(false)
          ws.close()
        } else if (msg.type === 'ERROR') {
          setReplayError(msg.message)
          setIsBuffering(false)
          ws.close()
        }
      } catch (err) {
        console.error('Error parsing WS replay message:', err)
        setReplayError('Error reading replay stream.')
        setIsBuffering(false)
      }
    }

    ws.onerror = () => {
      setReplayError('Replay service unreachable.')
      setIsBuffering(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [selectedEventId])

  // Playback timer ticker
  useEffect(() => {
    let interval = null
    if (isPlaying && replaySnapshots && replaySnapshots.length > 0) {
      interval = setInterval(() => {
        setReplayStep((prev) => {
          if (prev >= replaySnapshots.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 750) // 750ms step duration
    }
    return () => clearInterval(interval)
  }, [isPlaying, replaySnapshots])

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
          <MapEvents isPlanning={isPlanning} setPlanningCoords={setPlanningCoords} />
          
          {isPlanning && (
            <Marker 
              position={[planningLat, planningLon]} 
              draggable={true}
              icon={planningPinIcon}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target
                  if (marker != null) {
                    const { lat, lng } = marker.getLatLng()
                    setPlanningCoords(lat, lng)
                  }
                }
              }}
            />
          )}

          {showZones && (
            <ZoneChoropleth 
              customScores={replaySnapshots ? replaySnapshots[replayStep]?.zone_scores : null} 
            />
          )}
          {showEvents && <EventPin onEventClick={onSelectEvent} />}
          {showViolations && <ViolationHeatmap />}
          {simulationActive ? (
            simulationRoutes && <DiversionRoutes routes={simulationRoutes} />
          ) : (
            selectedRoutes && <DiversionRoutes routes={selectedRoutes} />
          )}
        </MapContainer>
      </div>

      {/* Scrubbable Replay Control Timeline Bar */}
      {selectedEventId && (
        <div className="replay-timeline-bar" style={{
          marginTop: '16px',
          background: 'rgba(20, 20, 23, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(15px)'
        }}>
          {isBuffering ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#a1a1aa', fontSize: '0.8rem' }}>
              <span className="pulse-indicator"></span>
              <span>Buffering historical replay timeline...</span>
            </div>
          ) : replayError ? (
            <div style={{ color: '#ff4d4d', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}>
              ⚠️ {replayError}
            </div>
          ) : replaySnapshots ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="chip"
                style={{
                  background: isPlaying ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.08)',
                  borderColor: isPlaying ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  minWidth: '80px',
                  textAlign: 'center'
                }}
              >
                {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
              </button>

              <button 
                onClick={() => {
                  setIsPlaying(false)
                  setReplayStep(0)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ⏹️ RESET
              </button>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="range"
                  min="0"
                  max={replaySnapshots.length - 1}
                  value={replayStep}
                  onChange={(e) => {
                    setIsPlaying(false)
                    setReplayStep(parseInt(e.target.value))
                  }}
                  style={{
                    flex: 1,
                    accentColor: '#ffffff',
                    height: '4px',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#e4e4e7', fontWeight: 'bold', minWidth: '95px', textAlign: 'right' }}>
                  Step {replayStep + 1}/20 ({Math.round(replaySnapshots[replayStep]?.progress_percent)}%)
               </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#a1a1aa', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
                🕒 {new Date(replaySnapshots[replayStep]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default BengaluruMap
