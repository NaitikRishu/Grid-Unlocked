import { useState, useEffect } from 'react'
import { GeoJSON } from 'react-leaflet'

function DiversionRoutes({ routes }) {
  // Local state to toggle individual routes (index 0, 1, 2)
  const [activeRoutes, setActiveRoutes] = useState({ 0: true, 1: true, 2: true })

  // Reset toggles when a new route set is loaded
  useEffect(() => {
    setActiveRoutes({ 0: true, 1: true, 2: true })
  }, [routes])

  if (!routes || !routes.features || routes.features.length === 0) return null

  const getRouteStyle = (index) => {
    // Colors: Blue for fastest, Orange for second, Grey for third
    const colors = ['#3b82f6', '#f97316', '#9ca3af']
    return {
      color: colors[index] || '#9ca3af',
      weight: index === 0 ? 6 : 4, // Boldest for fastest
      opacity: 0.85,
      dashArray: index > 0 ? '5, 8' : undefined // Dashed paths for alternate options look premium!
    }
  }

  return (
    <>
      {/* Floating Checkbox Toggles for Active Routes */}
      <div className="map-overlay-controls" style={{ top: '160px' }}>
        <p className="panel__label" style={{ margin: '0 0 6px' }}>Diversion Options</p>
        {routes.features.map((feature, idx) => {
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
        // Render only if toggled active
        if (!activeRoutes[idx]) return null

        const label = feature.properties?.route_label || `Alternate Route ${idx + 1}`
        const delay = feature.properties?.estimated_delay_minutes || 0

        return (
          <GeoJSON
            key={idx + '-' + (feature.properties?.route_label || '')}
            data={feature}
            style={getRouteStyle(idx)}
            onEachFeature={(f, layer) => {
              layer.bindPopup(`
                <div style="font-family: inherit; color: #1e293b;">
                  <h4 style="margin: 0 0 4px; font-size: 0.9rem;">${label}</h4>
                  <p style="margin: 0; font-size: 0.8rem;">
                    <strong>Estimated Delay:</strong> ${Math.round(delay)} minutes
                  </p>
                </div>
              `)
            }}
          />
        )
      })}
    </>
  )
}

export default DiversionRoutes
