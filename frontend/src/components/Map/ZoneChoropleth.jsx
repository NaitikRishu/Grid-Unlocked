import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'

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

  // Grey polygon style for hardcoded color for now (Phase 2 requirement)
  const zoneStyle = {
    color: '#4a5568', // Slate grey boundary
    weight: 1.5,
    fillColor: '#718096', // Grey fill
    fillOpacity: 0.4
  }

  if (!geoJsonData) return null

  return (
    <GeoJSON
      data={geoJsonData}
      style={zoneStyle}
      onEachFeature={(feature, layer) => {
        const wardName = feature.properties?.KGISWardName || 'Unknown Ward'
        const wardNo = feature.properties?.KGISWardNo || ''
        layer.bindPopup(`<strong>Ward ${wardNo}: ${wardName}</strong>`)
      }}
    />
  )
}

export default ZoneChoropleth
