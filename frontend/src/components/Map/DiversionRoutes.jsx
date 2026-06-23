import React, { useState, useEffect } from 'react'
import { GeoJSON, Marker, Tooltip, Circle } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../../store/appStore'

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

// 1. Signal Optimized (Green)
const signalIcon = createPremiumMarker(
  '#0F2318', 'rgba(74,222,128,0.3)', '#1A3D28', 'rgba(74,222,128,0.2)',
  `<line x1="3" y1="3" x2="3" y2="9" stroke="#4ADE80" stroke-width="1.5" stroke-linecap="round" />
   <line x1="6" y1="3" x2="6" y2="9" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" />
   <line x1="9" y1="3" x2="9" y2="9" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" />`
)

// 2. Detour (Blue)
const diversionIcon = createPremiumMarker(
  '#0A1F30', 'rgba(96,165,250,0.3)', '#132840', 'rgba(96,165,250,0.2)',
  `<path d="M3 9 Q 3 3, 9 3 L 9 3" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round" fill="none"/>
   <path d="M6 0 L 9 3 L 6 6" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
)

// 3. Road Closed / Barricade (Red)
const barricadeIcon = createPremiumMarker(
  '#2A0F0F', 'rgba(248,113,113,0.3)', '#3D1515', 'rgba(248,113,113,0.2)',
  `<circle cx="6" cy="6" r="5" stroke="#F87171" stroke-width="1.5" fill="none"/>
   <line x1="2.5" y1="6" x2="9.5" y2="6" stroke="#F87171" stroke-width="1.5" stroke-linecap="round"/>`
)

// VMS Active (Blue theme)
const vmsIcon = createPremiumMarker(
  '#0A1F30', 'rgba(96,165,250,0.3)', '#132840', 'rgba(96,165,250,0.2)',
  `<rect x="1" y="2" width="10" height="6" rx="1" stroke="#60A5FA" stroke-width="1.5" fill="none"/>
   <line x1="4" y1="10" x2="8" y2="10" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round"/>`
)

// Clearway (Amber theme)
const clearwayIcon = createPremiumMarker(
  '#2A1800', 'rgba(251,191,36,0.3)', '#3D2400', 'rgba(251,191,36,0.2)',
  `<circle cx="6" cy="6" r="5" stroke="#FBBF24" stroke-width="1.5" fill="none"/>
   <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round"/>`
)

// Heavy Vehicle Ban (Red theme)
const heavyVehicleIcon = createPremiumMarker(
  '#2A0F0F', 'rgba(248,113,113,0.3)', '#3D1515', 'rgba(248,113,113,0.2)',
  `<rect x="1" y="3" width="7" height="6" rx="1" stroke="#F87171" stroke-width="1.5" fill="none"/>
   <path d="M8 5h2a1 1 0 0 1 1 1v3H8V5Z" stroke="#F87171" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
   <line x1="1" y1="9" x2="11" y2="1" stroke="#F87171" stroke-width="1.5" stroke-linecap="round"/>`
)

// Recommended Barricade Placement (Orange theme)
const barricadePlacementIcon = createPremiumMarker(
  '#2B1408', 'rgba(249,115,22,0.3)', '#3E1F10', 'rgba(249,115,22,0.2)',
  `<line x1="1" y1="3" x2="11" y2="3" stroke="#F97316" stroke-width="1.5" stroke-linecap="round"/>
   <line x1="1" y1="7" x2="11" y2="7" stroke="#F97316" stroke-width="1.5" stroke-linecap="round"/>
   <line x1="3" y1="1" x2="3" y2="11" stroke="#F97316" stroke-width="1.5" stroke-linecap="round"/>
   <line x1="9" y1="1" x2="9" y2="11" stroke="#F97316" stroke-width="1.5" stroke-linecap="round"/>`
)

function DiversionRoutes({ routes }) {
  const { 
    simSignalOptimized, 
    simVmsActive, 
    simClearwayEnforced, 
    simHeavyVehicleRestricted,
    simBarricades,
    simDraftBarricades,
    deployedBarricadeIds,
    setDeployedBarricadeIds
  } = useAppStore()

  const [activeRoutes, setActiveRoutes] = useState({ 0: true, 1: true, 2: true })
  const [hoveredRouteIdx, setHoveredRouteIdx] = useState(null)

  useEffect(() => {
    setActiveRoutes({ 0: true, 1: true, 2: true })
    if (routes && routes.features) {
      const placements = routes.features.filter(f => f.properties?.is_barricade_placement)
      const defaultIds = placements.slice(0, simBarricades || 5).map(p => p.properties?.node_id)
      setDeployedBarricadeIds(defaultIds)
    }
  }, [routes])

  if (!routes || !routes.features || routes.features.length === 0) return null

  const blockedFeatures = routes.features.filter(f => f.properties?.is_blocked)
  const altFeatures = routes.features.filter(f => !f.properties?.is_blocked && !f.properties?.is_barricade_placement && f.geometry?.type !== 'Point')
  const fastestAltFeature = altFeatures.length > 0 ? altFeatures[0] : null
  const colors = ['#00f0ff', '#ff9f0a', '#ff00ff'] // Cyan, Orange, Magenta

  const getRouteStyle = (feature) => {
    if (feature.properties?.is_blocked) {
      return { color: '#ff3b30', weight: 6, opacity: 0.95 } // Red for congested / blocked
    }
    const altIndex = altFeatures.indexOf(feature)
    const isHovered = hoveredRouteIdx === altIndex
    return {
      color: colors[altIndex] || '#ff00ff',
      weight: (altIndex === 0 ? 6.5 : (altIndex === 1 ? 4.5 : 3.5)) + (isHovered ? 3.0 : 0),
      opacity: isHovered ? 1.0 : 0.85,
      dashArray: altIndex > 0 ? '6, 8' : undefined
    }
  }

  const getFirstCoord = (geometry) => {
    if (!geometry || !geometry.coordinates) return null;
    let coords = geometry.coordinates;
    while (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      coords = coords[0];
    }
    if (coords.length > 0 && Array.isArray(coords[0])) {
      return [coords[0][1], coords[0][0]]; // [lat, lon]
    }
    return null;
  }

  const renderCongestionCircle = () => {
    if (blockedFeatures.length === 0) return null
    const epicenter = getFirstCoord(blockedFeatures[0].geometry)
    if (!epicenter) return null
    const activeBarricades = simDraftBarricades !== null ? simDraftBarricades : simBarricades
    const effectiveRadius = Math.max(100.0, 500.0 - activeBarricades * 20.0)
    return (
      <Circle 
        center={epicenter} 
        radius={effectiveRadius}
        pathOptions={{ color: '#ff3b30', fillColor: '#ff3b30', fillOpacity: 0.07, weight: 1.5, dashArray: '5, 8' }}
      >
        <Tooltip sticky>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
            <strong>Incident Congestion Zone</strong><br/>
            Radius: {Math.round(effectiveRadius)}m ({activeBarricades} Barricades Active)<br/>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}>
              Each barricade blocks incoming traffic, shrinking the congestion spread by 20m.
            </span>
          </div>
        </Tooltip>
      </Circle>
    )
  }

  const renderBarricadeMarker = () => {
    if (blockedFeatures.length === 0) return null
    const pos = getFirstCoord(blockedFeatures[0].geometry)
    if (!pos) return null
    return (
      <Marker position={pos} icon={barricadeIcon}>
        <Tooltip>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
            <strong>Road Barricade Deployed</strong><br/>
            Isolating incident epicenter from incoming traffic.
          </div>
        </Tooltip>
      </Marker>
    )
  }

  const renderDiversionMarker = () => {
    if (!fastestAltFeature) return null
    const pos = getFirstCoord(fastestAltFeature.geometry)
    if (!pos) return null
    return (
      <Marker position={pos} icon={diversionIcon}>
        <Tooltip>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
            <strong>Detour Origin</strong><br/>
            Diversion routes start here to bypass congestion.
          </div>
        </Tooltip>
      </Marker>
    )
  }

  const renderPolicyMarkers = () => {
    if (!fastestAltFeature) return null
    const epicenter = getFirstCoord(fastestAltFeature.geometry)
    if (!epicenter) return null

    return (
      <>
        {simSignalOptimized && (
          <Marker position={[epicenter[0] + 0.0006, epicenter[1]]} icon={signalIcon}>
            <Tooltip>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                <strong>Signal Timing Optimization</strong><br/>
                Adjusting green intervals dynamically (+30% average speed).
              </div>
            </Tooltip>
          </Marker>
        )}
        {simVmsActive && (
          <Marker position={[epicenter[0], epicenter[1] + 0.0007]} icon={vmsIcon}>
            <Tooltip>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                <strong>VMS Signboard Active</strong><br/>
                Displaying real-time route advice to approaching drivers.
              </div>
            </Tooltip>
          </Marker>
        )}
        {simClearwayEnforced && (
          <Marker position={[epicenter[0] - 0.0006, epicenter[1]]} icon={clearwayIcon}>
            <Tooltip>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                <strong>Clearway Parking Enforcement</strong><br/>
                Clearing curb lanes to restore maximum physical road capacity.
              </div>
            </Tooltip>
          </Marker>
        )}
        {simHeavyVehicleRestricted && (
          <Marker position={[epicenter[0], epicenter[1] - 0.0007]} icon={heavyVehicleIcon}>
            <Tooltip>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                <strong>Heavy Freight Restriction</strong><br/>
                Multi-axle trucks banned temporarily to prevent bottlenecks.
              </div>
            </Tooltip>
          </Marker>
        )}
      </>
    )
  }

  const renderBarricadePlacements = () => {
    const placements = routes.features.filter(f => f.properties?.is_barricade_placement)
    
    const toggleBarricade = (nodeId) => {
      let newIds
      if (deployedBarricadeIds.includes(nodeId)) {
        newIds = deployedBarricadeIds.filter(id => id !== nodeId)
      } else {
        newIds = [...deployedBarricadeIds, nodeId]
      }
      setDeployedBarricadeIds(newIds)
    }

    return placements.map((feat, idx) => {
      const coords = feat.geometry?.coordinates
      if (!coords || coords.length < 2) return null
      const pos = [coords[1], coords[0]] // GeoJSON point is [lng, lat]
      const nodeId = feat.properties?.node_id
      const isActive = deployedBarricadeIds.includes(nodeId)
      
      return (
        <Marker 
          key={'barricade-placement-' + idx} 
          position={pos} 
          icon={isActive ? barricadeIcon : barricadePlacementIcon}
          eventHandlers={{
            click: () => toggleBarricade(nodeId)
          }}
        >
          <Tooltip>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
              <strong>{isActive ? 'Active Barricade' : 'Recommended Barricade'}</strong><br/>
              {isActive ? 'Physically blocking traffic. Click to remove.' : 'Click to place barricade and block entrance.'}
            </div>
          </Tooltip>
        </Marker>
      )
    })
  }

  return (
    <>
      <div style={{
        position: 'absolute', top: '160px', left: '12px', zIndex: 1000,
        background: 'rgba(15, 15, 15, 0.82)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px', padding: '12px', minWidth: '220px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
        <p className="text-eyebrow" style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '10px', letterSpacing: '0.05em' }}>DIVERSION OPTIONS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {altFeatures.map((feature, altIndex) => {
            const label = feature.properties?.route_label || `Alternate ${altIndex + 1}`
            const delay = feature.properties?.estimated_delay_minutes || 0
            const originalIdx = routes.features.indexOf(feature)
            const routeColor = colors[altIndex] || '#ff00ff'
            
            return (
              <label 
                key={originalIdx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                  background: hoveredRouteIdx === altIndex ? 'rgba(255, 255, 255, 0.06)' : 'transparent'
                }}
                onMouseEnter={() => setHoveredRouteIdx(altIndex)}
                onMouseLeave={() => setHoveredRouteIdx(null)}
              >
                <div style={{ position: 'relative', width: '16px', height: '16px' }}>
                  <input 
                    type="checkbox" 
                    checked={activeRoutes[originalIdx] || false} 
                    onChange={() => setActiveRoutes({ ...activeRoutes, [originalIdx]: !activeRoutes[originalIdx] })} 
                    style={{ opacity: 0, position: 'absolute', cursor: 'pointer', width: '100%', height: '100%', margin: 0 }} 
                  />
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: `1.5px solid ${activeRoutes[originalIdx] ? routeColor : 'var(--border)'}`,
                    background: activeRoutes[originalIdx] ? routeColor : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}>
                    {activeRoutes[originalIdx] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#0f0f0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#ffffff', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'between', width: '100%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: routeColor }} />
                    {label}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>({Math.round(delay)}m)</span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {routes.features.map((feature, idx) => {
        if (feature.properties?.is_blocked) {
          return (
            <React.Fragment key={idx + '-congested-grp'}>
              <GeoJSON data={feature} style={{ color: '#030303', weight: 11, opacity: 0.95 }} />
              <GeoJSON data={feature} style={getRouteStyle(feature)}>
                <Tooltip sticky>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                    <strong>Congested Corridor</strong><br/>
                    Avoid this area
                  </div>
                </Tooltip>
              </GeoJSON>
            </React.Fragment>
          )
        }
        if (!activeRoutes[idx]) return null
        const altIndex = altFeatures.indexOf(feature)
        const label = feature.properties?.route_label || `Alternate ${altIndex + 1}`
        const delay = feature.properties?.estimated_delay_minutes || 0
        
        return (
          <React.Fragment key={idx + '-alt-grp'}>
            <GeoJSON data={feature} style={{ color: '#030303', weight: 9, opacity: 0.95 }} />
            <GeoJSON 
              data={feature} 
              style={getRouteStyle(feature)}
              eventHandlers={{
                mouseover: () => setHoveredRouteIdx(altIndex),
                mouseout: () => setHoveredRouteIdx(null)
              }}
            >
              <Tooltip sticky>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  <strong>{label}</strong><br/>
                  Est. Delay: {Math.round(delay)} min
                </div>
              </Tooltip>
            </GeoJSON>
          </React.Fragment>
        )
      })}

      {renderCongestionCircle()}
      {renderBarricadeMarker()}
      {renderDiversionMarker()}
      {renderBarricadePlacements()}
    </>
  )
}

export default DiversionRoutes
