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
import { IconShieldCheck, IconBarrierBlock } from '@tabler/icons-react'

const bengaluruCenter = [12.9716, 77.5946]

const planningPinIcon = L.divIcon({
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: rgba(59, 158, 255, 0.12);
      border: 1.5px solid var(--accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    ">
      <div style="
        width: 6px;
        height: 6px;
        background: var(--accent);
        border-radius: 50%;
      "></div>
    </div>
  `,
  className: 'custom-planning-pin',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})

function MapEvents({ isPlanning, setPlanningCoords }) {
  useMapEvents({
    click(e) {
      if (isPlanning) {
        setPlanningCoords(e.latlng.lat, e.latlng.lng)
      }
    },
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
    setPlanningCoords,
    setCurrentEventRoutes,
    baselineScores,
    simulationScores,
    setCurrentPeakScore,
    simManpower,
    simBarricades,
    simSignalOptimized,
    simVmsActive,
    simClearwayEnforced,
    simHeavyVehicleRestricted,
    predictedDuration,
  } = useAppStore()

  const mapProvider = 'osm'
  const [showZones, setShowZones] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const [showViolations, setShowViolations] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState(null)

  const [replaySnapshots, setReplaySnapshots] = useState(null)
  const [replayStep, setReplayStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [replayError, setReplayError] = useState(null)

  // Generate simulated timeline snapshots for custom / run simulations
  useEffect(() => {
    if (simulationActive && simulationScores && baselineScores) {
      const generatedSnapshots = []
      const baseTime = Date.now()
      
      for (let s = 0; s < 20; s++) {
        const progress = Math.round((s / 19) * 100)
        const timestamp = new Date(baseTime + s * 3 * 60 * 1000).toISOString()
        const stepScores = {}
        
        // Exponential decay of congestion back to baseline
        const decayFactor = Math.exp(-s * 0.15)
        
        Object.keys(baselineScores).forEach((zoneId) => {
          const base = baselineScores[zoneId] || 0
          const peak = simulationScores[zoneId] !== undefined ? simulationScores[zoneId] : base
          stepScores[zoneId] = base + (peak - base) * decayFactor
        })
        
        generatedSnapshots.push({
          timestamp,
          zone_scores: stepScores,
          progress_percent: progress
        })
      }
      
      setReplaySnapshots(generatedSnapshots)
      setReplayStep(0)
      setIsPlaying(false)
      setReplayError(null)
      setIsBuffering(false)
    } else if (!simulationActive) {
      // Clear generated snapshots only if we're not loading a historical event
      if (!selectedEventId || selectedEventId.startsWith('CUSTOM')) {
        setReplaySnapshots(null)
        setReplayStep(0)
        setIsPlaying(false)
      }
    }
  }, [simulationActive, simulationScores, baselineScores, selectedEventId])

  useEffect(() => {
    if (selectedEventId) {
      client
        .get(`/routes/${selectedEventId}`)
        .then((res) => {
          setSelectedRoutes(res.data)
          setCurrentEventRoutes(res.data)
        })
        .catch((err) => {
          console.warn(`Failed to fetch alternate routes for event ${selectedEventId}:`, err)
          setSelectedRoutes(null)
          setCurrentEventRoutes(null)
        })
    } else {
      setSelectedRoutes(null)
      setCurrentEventRoutes(null)
    }
  }, [selectedEventId, setCurrentEventRoutes])

  useEffect(() => {
    setReplaySnapshots(null)
    setReplayStep(0)
    setIsPlaying(false)
    setReplayError(null)
    setIsBuffering(false)

    if (!selectedEventId) return

    if (selectedEventId.startsWith('CUSTOM')) {
      // Don't show WS error for custom events, as the simulation timeline effect will populate replaySnapshots
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
          buffer.push(msg)
        } else if (msg.type === 'COMPLETE') {
          setReplaySnapshots(buffer)
          if (buffer.length > 0) {
            const firstScores = buffer[0].zone_scores || {}
            const maxScore = Math.max(...Object.values(firstScores).map(Number), 1)
            setCurrentPeakScore(maxScore)
          }
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
      }, 750)
    }
    return () => clearInterval(interval)
  }, [isPlaying, replaySnapshots])

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  const attribution = '&copy; OpenStreetMap contributors &copy; CARTO'

  const handleTileError = () => {
    console.warn('Map tile layer failed.')
  }

  const ToggleSwitchLight = ({ checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, position: 'absolute' }} />
      <div style={{
        width: '28px', height: '16px', borderRadius: '8px',
        background: checked ? 'var(--accent)' : 'rgba(120,120,128,0.2)',
        transition: 'background 0.15s ease', position: 'relative',
        boxShadow: checked ? '0 0 8px rgba(0, 212, 255, 0.6)' : 'none'
      }}>
        <div style={{
          position: 'absolute', top: '2px', left: '2px', width: '12px', height: '12px',
          borderRadius: '50%', background: '#ffffff',
          transition: 'transform 0.15s ease', transform: checked ? 'translateX(12px)' : 'translateX(0px)',
        }} />
      </div>
    </label>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 20px', 
        background: 'var(--bg-surface)', 
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 
      }}>
        <div>
          <p className="text-eyebrow" style={{ margin: '0 0 2px' }}>OPERATIONS</p>
          <h2 className="text-section-heading" style={{ margin: 0, fontSize: '15px' }}>Bengaluru Live View</h2>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', 
          padding: '4px 10px', border: '1px solid var(--border-strong)', borderRadius: '20px',
          background: 'transparent'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} />
          <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>Standard Base Map</span>
        </div>
      </div>

      {/* Map Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050B18' }}>
        <div className="map-pulse-overlay"></div>
        
        {/* Layer Panel (Floating Dark) */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 1000,
          background: 'rgba(13, 27, 42, 0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 212, 255, 0.25)', borderRadius: '10px', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <p className="text-eyebrow" style={{ color: 'var(--text-secondary)' }}>LAYERS</p>
          {[
            { label: 'Choropleth', state: showZones, set: setShowZones },
            { label: 'Events', state: showEvents, set: setShowEvents },
            { label: 'Heatmap', state: showViolations, set: setShowViolations },
          ].map(({ label, state, set }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
              <ToggleSwitchLight checked={state} onChange={() => set(!state)} />
            </div>
          ))}
        </div>

        {/* Simulation Banner (Floating Dark) */}
        {simulationActive && (
          <div style={{
            position: 'absolute', top: '12px', left: '56px', zIndex: 1000,
            background: 'rgba(13, 27, 42, 0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 212, 255, 0.25)', borderRadius: '10px', padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex', gap: '16px', alignItems: 'center'
          }}>
            {/* Column 1: Impact & Risk */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p className="text-eyebrow" style={{ color: 'var(--text-secondary)', margin: 0 }}>SIMULATION IMPACT</p>
                {(() => {
                  const score = Math.min(100, Math.round((predictedDuration / 120) * 100))
                  const riskLvl = score >= 70 ? 'CRITICAL' : score >= 40 ? 'MEDIUM' : 'LOW'
                  return (
                    <span style={{
                      fontSize: '8px',
                      fontWeight: 'bold',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: riskLvl === 'CRITICAL' ? 'rgba(255,59,48,0.15)' : riskLvl === 'MEDIUM' ? 'rgba(255,159,10,0.15)' : 'rgba(0,240,255,0.15)',
                      color: riskLvl === 'CRITICAL' ? '#ff3b30' : riskLvl === 'MEDIUM' ? '#ff9f0a' : '#00f0ff',
                      border: `1px solid ${riskLvl === 'CRITICAL' ? 'rgba(255,59,48,0.3)' : riskLvl === 'MEDIUM' ? 'rgba(255,159,10,0.3)' : 'rgba(0,240,255,0.3)'}`,
                    }}>
                      {riskLvl}
                    </span>
                  )
                })()}
              </div>
              <p style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent)', margin: '2px 0 0', letterSpacing: '-0.02em', textShadow: '0 0 8px rgba(0, 212, 255, 0.4)' }}>
                +{Math.round(simulationDelaySaved)} min
              </p>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>saved via optimised routing</p>
            </div>
            
            <div style={{ width: '1px', height: '40px', background: 'rgba(0, 212, 255, 0.2)' }} />
            
            {/* Column 2: Total Dispatch */}
            <div>
              <p className="text-eyebrow" style={{ color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>TOTAL DISPATCH</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="text-mono" style={{ fontSize: '10px', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <IconShieldCheck size={10} color="#00f0ff" /> {simManpower} POLICE
                </span>
                <span className="text-mono" style={{ fontSize: '10px', color: '#ff9f0a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <IconBarrierBlock size={10} color="#ff9f0a" /> {simBarricades} BARRICADES
                </span>
              </div>
            </div>

            {/* Column 3: Active Policies */}
            {(simSignalOptimized || simVmsActive || simClearwayEnforced || simHeavyVehicleRestricted) && (
              <>
                <div style={{ width: '1px', height: '40px', background: 'rgba(0, 212, 255, 0.2)' }} />
                <div>
                  <p className="text-eyebrow" style={{ color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>ACTIVE POLICIES</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                    {simSignalOptimized && <span style={{ fontSize: '7px', padding: '1px 3px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', borderRadius: '3px', border: '1px solid rgba(0, 240, 255, 0.2)', fontWeight: 600 }}>SIGNAL OPT</span>}
                    {simVmsActive && <span style={{ fontSize: '7px', padding: '1px 3px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', borderRadius: '3px', border: '1px solid rgba(0, 240, 255, 0.2)', fontWeight: 600 }}>VMS</span>}
                    {simClearwayEnforced && <span style={{ fontSize: '7px', padding: '1px 3px', background: 'rgba(255, 159, 10, 0.1)', color: '#ff9f0a', borderRadius: '3px', border: '1px solid rgba(255, 159, 10, 0.2)', fontWeight: 600 }}>CLEARWAY</span>}
                    {simHeavyVehicleRestricted && <span style={{ fontSize: '7px', padding: '1px 3px', background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', borderRadius: '3px', border: '1px solid rgba(255, 59, 48, 0.2)', fontWeight: 600 }}>TRUCK BAN</span>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <MapContainer center={bengaluruCenter} zoom={13} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
          <TileLayer
            key={mapProvider}
            attribution={attribution}
            url={tileUrl}
            eventHandlers={{ tileerror: handleTileError }}
          />
          <MapEvents isPlanning={isPlanning} setPlanningCoords={setPlanningCoords} />

          {isPlanning && (
            <Marker
              position={[planningLat, planningLon]}
              draggable
              icon={planningPinIcon}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng()
                  setPlanningCoords(lat, lng)
                },
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
          {simulationActive
            ? simulationRoutes && <DiversionRoutes routes={simulationRoutes} />
            : selectedRoutes && <DiversionRoutes routes={selectedRoutes} />}
        </MapContainer>
      </div>

      {/* Replay Bar (Below Map) */}
      {replaySnapshots && (
        <div style={{
          padding: '10px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', flexShrink: 0
        }}>
          {isBuffering ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '6px 0' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)' }} />
              <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>LOADING REPLAY TIMELINE...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="text-mono" style={{ 
                fontSize: '9px', 
                fontWeight: 'bold', 
                padding: '3px 6px', 
                borderRadius: '4px',
                background: simulationActive ? 'rgba(0, 240, 255, 0.1)' : 'rgba(251, 159, 10, 0.1)',
                color: simulationActive ? '#00f0ff' : '#ff9f0a',
                border: simulationActive ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid rgba(251, 159, 10, 0.2)',
                letterSpacing: '0.05em'
              }}>
                {simulationActive ? 'DISPERSION FORECAST' : 'HISTORICAL REPLAY'}
              </span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ 
                  fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: isPlaying ? 'var(--bg-base)' : 'var(--text-primary)', 
                  background: isPlaying ? 'var(--accent)' : 'transparent',
                  border: isPlaying ? '1px solid var(--accent)' : '1px solid var(--border-strong)', 
                  borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', minWidth: '70px', textAlign: 'center'
                }}
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={() => { setIsPlaying(false); setReplayStep(0) }}
                style={{
                  fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--text-secondary)', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer'
                }}
              >
                RESET
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', margin: '0 8px' }}>
                <input
                  type="range" min="0" max={replaySnapshots.length - 1} value={replayStep}
                  onChange={(e) => { setIsPlaying(false); setReplayStep(parseInt(e.target.value)) }}
                  style={{ flex: 1, accentColor: 'var(--accent)', height: '2px', cursor: 'pointer' }}
                />
                <span className="text-mono" style={{ color: 'var(--text-secondary)', minWidth: '80px', textAlign: 'right' }}>
                  {replayStep + 1} / 20 &nbsp; {Math.round(replaySnapshots[replayStep]?.progress_percent || 0)}%
                </span>
              </div>
              <span className="text-mono" style={{ color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', paddingLeft: '12px', minWidth: '60px', textAlign: 'center' }}>
                {simulationActive ? `T+${replayStep * 3}m` : new Date(replaySnapshots[replayStep]?.timestamp || Date.now()).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BengaluruMap
