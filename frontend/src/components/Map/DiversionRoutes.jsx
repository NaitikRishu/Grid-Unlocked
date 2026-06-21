import { useState, useEffect } from 'react'
import { GeoJSON, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../../store/appStore'

// Custom Leaflet DivIcons using emojis to avoid image path resolution errors
const barricadeIcon = L.divIcon({
  html: `
    <div style="
      background: #ef4444;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 15px rgba(239, 68, 68, 0.4);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transform: translate(-50%, -50%);
    ">
      <span>🚧</span> PLACE BARRICADE (ROAD CLOSED)
    </div>
  `,
  className: 'custom-map-badge-barricade',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

const diversionIcon = L.divIcon({
  html: `
    <div style="
      background: #10b981;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 15px rgba(16, 185, 129, 0.4);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transform: translate(-50%, -50%);
    ">
      <span>↩️</span> DETOUR: DIVERT TRAFFIC HERE ➔
    </div>
  `,
  className: 'custom-map-badge-diversion',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

const signalIcon = L.divIcon({
  html: `
    <div style="
      background: #3b82f6;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 15px rgba(59, 130, 246, 0.4);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transform: translate(-50%, -50%);
    ">
      <span>🚦</span> SIGNAL OPTIMIZED
    </div>
  `,
  className: 'custom-map-badge-signal',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

const vmsIcon = L.divIcon({
  html: `
    <div style="
      background: #8b5cf6;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 15px rgba(139, 92, 246, 0.4);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transform: translate(-50%, -50%);
    ">
      <span>📺</span> VMS DISPLAY ACTIVE
    </div>
  `,
  className: 'custom-map-badge-vms',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

const clearwayIcon = L.divIcon({
  html: `
    <div style="
      background: #f59e0b;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 15px rgba(245, 158, 11, 0.4);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transform: translate(-50%, -50%);
    ">
      <span>🚫</span> NO PARKING (CLEARWAY)
    </div>
  `,
  className: 'custom-map-badge-clearway',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

const heavyVehicleIcon = L.divIcon({
  html: `
    <div style="
      background: #ea580c;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 15px rgba(234, 88, 12, 0.4);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transform: translate(-50%, -50%);
    ">
      <span>🚛</span> HEAVY VEHICLES BANNED
    </div>
  `,
  className: 'custom-map-badge-heavy',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

function DiversionRoutes({ routes }) {
  const { 
    simSignalOptimized, 
    simVmsActive, 
    simClearwayEnforced, 
    simHeavyVehicleRestricted 
  } = useAppStore()

  // Local state to toggle individual routes (index 0, 1, 2)
  const [activeRoutes, setActiveRoutes] = useState({ 0: true, 1: true, 2: true })

  // Reset toggles when a new route set is loaded
  useEffect(() => {
    setActiveRoutes({ 0: true, 1: true, 2: true })
  }, [routes])

  if (!routes || !routes.features || routes.features.length === 0) return null

  const getRouteStyle = (index, feature) => {
    if (feature.properties?.is_blocked) {
      return {
        color: '#ef4444', // Red for congested corridor
        weight: 7,
        opacity: 0.9,
        dashArray: undefined
      }
    }
    
    // Colors: Green (#10b981) for fastest/recommended clear path, Orange (#f97316) for second, Grey (#9ca3af) for third
    const colors = ['#10b981', '#f97316', '#9ca3af']
    return {
      color: colors[index] || '#9ca3af',
      weight: index === 0 ? 6 : 4, // Boldest for fastest
      opacity: 0.85,
      dashArray: index > 0 ? '5, 8' : undefined // Dashed paths for alternate options
    }
  }

  // Filter blocked features and the recommended fastest alternate route
  const blockedFeatures = routes.features.filter(f => f.properties?.is_blocked)
  const fastestAltFeature = routes.features.find(f => !f.properties?.is_blocked)

  const renderBarricadeMarker = () => {
    if (blockedFeatures.length === 0) return null
    const feature = blockedFeatures[0]
    const coords = feature.geometry.coordinates
    if (!coords || coords.length === 0) return null
    
    // Position barricade slightly down the blocked road segment to prevent overlap with the diversion junction marker
    const pointIndex = Math.min(1, coords.length - 1)
    const pos = [
      (coords[0][1] + coords[pointIndex][1]) / 2,
      (coords[0][0] + coords[pointIndex][0]) / 2
    ]
    return (
      <Marker position={pos} icon={barricadeIcon} />
    )
  }

  const renderDiversionMarker = () => {
    if (!fastestAltFeature) return null
    const coords = fastestAltFeature.geometry.coordinates
    if (!coords || coords.length === 0) return null
    // Position diversion badge exactly at the junction intersection
    const pos = [coords[0][1], coords[0][0]]
    return (
      <Marker position={pos} icon={diversionIcon} />
    )
  }

  const renderPolicyMarkers = () => {
    if (!fastestAltFeature) return null
    const coords = fastestAltFeature.geometry.coordinates
    if (!coords || coords.length === 0) return null
    const epicenter = [coords[0][1], coords[0][0]]

    return (
      <>
        {simSignalOptimized && (
          <Marker 
            position={[epicenter[0] + 0.0004, epicenter[1]]} 
            icon={signalIcon} 
          />
        )}
        {simVmsActive && (
          <Marker 
            position={[epicenter[0], epicenter[1] + 0.0005]} 
            icon={vmsIcon} 
          />
        )}
        {simClearwayEnforced && (
          <Marker 
            position={[epicenter[0] - 0.0004, epicenter[1]]} 
            icon={clearwayIcon} 
          />
        )}
        {simHeavyVehicleRestricted && (
          <Marker 
            position={[epicenter[0], epicenter[1] - 0.0005]} 
            icon={heavyVehicleIcon} 
          />
        )}
      </>
    )
  }

  return (
    <>
      {/* Floating Checkbox Toggles for Active Routes */}
      <div className="map-overlay-controls" style={{ top: '160px' }}>
        <p className="panel__label" style={{ margin: '0 0 6px' }}>Diversion Options</p>
        {routes.features.map((feature, idx) => {
          if (feature.properties?.is_blocked) return null
          
          const label = feature.properties?.route_label || `Alternate ${idx + 1}`
          const delay = feature.properties?.estimated_delay_minutes || 0
          return (
            <label key={idx} className="control-toggle" style={{ gap: '6px' }}>
              <input 
                type="checkbox" 
                checked={activeRoutes[idx] || false}
                onChange={() => setActiveRoutes({
                  ...activeRoutes,
                  [idx]: !activeRoutes[idx]
                })}
              />
              <span style={{ fontSize: '0.82rem' }}>
                {label} ({Math.round(delay)}m delay)
              </span>
            </label>
          )
        })}
      </div>

      {/* Render the GeoJSON polylines */}
      {routes.features.map((feature, idx) => {
        // If it is blocked, always render it (don't hide via check boxes)
        if (feature.properties?.is_blocked) {
          return (
            <GeoJSON
              key={idx + '-congested'}
              data={feature}
              style={getRouteStyle(idx, feature)}
              onEachFeature={(f, layer) => {
                layer.bindPopup(`
                  <div style="font-family: inherit; color: #1e293b;">
                    <h4 style="margin: 0; font-size: 0.9rem; color: #ef4444; font-weight: 700;">Congested Corridor</h4>
                    <p style="margin: 4px 0 0; font-size: 0.8rem;">
                      This road segment is heavily congested. Diversion routing is active.
                    </p>
                  </div>
                `)
              }}
            />
          )
        }

        // Render alternate routes only if toggled active
        if (!activeRoutes[idx]) return null

        const label = feature.properties?.route_label || `Alternate Route ${idx + 1}`
        const delay = feature.properties?.estimated_delay_minutes || 0
        const isFastest = idx === 0

        return (
          <GeoJSON
            key={idx + '-' + (feature.properties?.route_label || '')}
            data={feature}
            style={getRouteStyle(idx, feature)}
            onEachFeature={(f, layer) => {
              layer.bindPopup(`
                <div style="font-family: inherit; color: #1e293b;">
                  <h4 style="margin: 0 0 4px; font-size: 0.9rem; color: ${isFastest ? '#10b981' : '#f97316'}; font-weight: 700;">${label}</h4>
                  <p style="margin: 0; font-size: 0.8rem;">
                    <strong>Estimated Delay:</strong> ${Math.round(delay)} minutes
                  </p>
                </div>
              `)
            }}
          />
        )
      })}

      {/* Render barricade and diversion instruction markers */}
      {renderBarricadeMarker()}
      {renderDiversionMarker()}
      {renderPolicyMarkers()}
    </>
  )
}

export default DiversionRoutes
