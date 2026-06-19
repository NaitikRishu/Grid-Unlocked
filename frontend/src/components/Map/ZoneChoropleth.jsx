import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'

// Deterministic generator to provide consistent dummy scores [0, 100] for each ward
const getDummyScore = (wardNo) => {
  if (!wardNo) return 0
  const num = parseInt(wardNo, 10) || 0
  return (num * 17 + 23) % 101 // Pseudo-random but deterministic
}

function ZoneChoropleth() {
  const [geoJsonData, setGeoJsonData] = useState(null)

  useEffect(() => {
    fetch('/bengaluru_zones.geojson')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch geojson: ${res.statusText}`)
        }
        return res.json()
      })
      .then((data) => {
        setGeoJsonData(data)
      })
      .catch((err) => {
        console.error('Error loading bengaluru_zones.geojson:', err)
      })
  }, [])

  const getZoneColor = (score) => {
    if (score <= 33) return '#22c55e' // Green
    if (score <= 66) return '#f59e0b' // Amber
    return '#ef4444' // Red
  }

  const getStyle = (feature) => {
    const wardNo = feature.properties?.KGISWardNo || ''
    const score = getDummyScore(wardNo)
    return {
      color: '#1a3630', // Dark border to match aesthetic
      weight: 1.2,
      fillColor: getZoneColor(score),
      fillOpacity: 0.4
    }
  }

  if (!geoJsonData) return null

  return (
    <GeoJSON
      data={geoJsonData}
      style={getStyle}
      onEachFeature={(feature, layer) => {
        const wardName = feature.properties?.KGISWardName || 'Unknown Ward'
        const wardNo = feature.properties?.KGISWardNo || ''
        const score = getDummyScore(wardNo)

        // Bind interactive elements
        layer.bindPopup(`
          <div style="font-family: inherit; color: #1e293b;">
            <h4 style="margin: 0 0 4px; font-size: 0.95rem;">Ward ${wardNo}: ${wardName}</h4>
            <p style="margin: 0; font-size: 0.85rem;">
              <strong>Congestion Score:</strong> 
              <span style="color: ${getZoneColor(score)}; font-weight: bold;">${score}/100</span>
            </p>
          </div>
        `)

        layer.bindTooltip(`Ward ${wardNo}: ${wardName} (Score: ${score})`, {
          sticky: true,
          direction: 'auto'
        })

        // Interactive mouseover effects
        layer.on({
          mouseover: (e) => {
            const l = e.target
            l.setStyle({
              fillOpacity: 0.65,
              weight: 2,
              color: '#38d39f'
            })
          },
          mouseout: (e) => {
            const l = e.target
            l.setStyle(getStyle(feature))
          }
        })
      }}
    />
  )
}

export default ZoneChoropleth
