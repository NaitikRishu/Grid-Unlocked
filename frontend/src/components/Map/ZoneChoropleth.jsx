import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'

function ZoneChoropleth({ customScores: propCustomScores = null }) {
  const { simulationScores, simulationActive } = useAppStore()
  const customScores = propCustomScores || (simulationActive ? simulationScores : null)
  const [geoJsonData, setGeoJsonData] = useState(null)
  const [maxBaselineScore, setMaxBaselineScore] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/zones')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          // Find the maximum baseline score dynamically to scale metrics
          const maxVal = res.data.reduce((acc, feat) => {
            const val = feat.properties?.baseline_score || 0
            return val > acc ? val : acc
          }, 0)
          setMaxBaselineScore(maxVal > 0 ? maxVal : 1)

          const featureCollection = {
            type: 'FeatureCollection',
            features: res.data
          }
          setGeoJsonData(featureCollection)
        } else {
          console.warn('API returned non-array data for zones:', res.data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching zones from API:', err)
        setLoading(false)
      })
  }, [])

  const getZoneColor = (score) => {
    if (score <= 33) return '#22c55e' // Green
    if (score <= 66) return '#f59e0b' // Amber
    return '#ef4444' // Red
  }

  const getDisplayScore = (feature) => {
    const zoneId = feature.properties?.zone_id || ''
    const rawScore = (customScores && customScores[zoneId] !== undefined)
      ? customScores[zoneId]
      : (feature.properties?.baseline_score || 0)

    // Normalize baseline scores to [0, 100] range for proper classification coloring.
    // If it's a simulated custom score, it is already scaled [0, 100] by the engine.
    return customScores ? rawScore : (rawScore / maxBaselineScore) * 100
  }

  const getStyle = (feature) => {
    const score = getDisplayScore(feature)
    return {
      color: '#1a3630', // Dark green/teal border
      weight: 1.2,
      fillColor: getZoneColor(score),
      fillOpacity: 0.4
    }
  }

  if (loading || !geoJsonData) return null

  return (
    <GeoJSON
      key={JSON.stringify(customScores) + '-' + maxBaselineScore} // Force re-render when scores or scaling updates
      data={geoJsonData}
      style={getStyle}
      onEachFeature={(feature, layer) => {
        const zoneId = feature.properties?.zone_id || ''
        const zoneName = feature.properties?.zone_name || 'Unknown Zone'
        const score = getDisplayScore(feature)

        // Bind interactive elements
        layer.bindPopup(`
          <div style="font-family: inherit; color: #1e293b;">
            <h4 style="margin: 0 0 4px; font-size: 0.95rem;">${zoneName} (ID: ${zoneId})</h4>
            <p style="margin: 0; font-size: 0.85rem;">
              <strong>Relative Congestion:</strong> 
              <span style="color: ${getZoneColor(score)}; font-weight: bold;">${Math.round(score)}/100</span>
            </p>
          </div>
        `)

        layer.bindTooltip(`${zoneName} (Score: ${Math.round(score)})`, {
          sticky: true,
          direction: 'auto'
        })

        // Interactive mouseover highlights
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
