import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'

function ZoneChoropleth({ customScores: propCustomScores = null }) {
  const { simulationScores, simulationActive, replayScores, replayActive, setBaselineScores, currentPeakScore } = useAppStore()
  const customScores = propCustomScores || (replayActive ? replayScores : (simulationActive ? simulationScores : null))
  const [geoJsonData, setGeoJsonData] = useState(null)
  const [maxBaselineScore, setMaxBaselineScore] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/zones')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          // Store baseline scores in Zustand
          const baseScoresObj = {}
          res.data.forEach((feat) => {
            const zId = feat.properties?.zone_id
            if (zId) {
              baseScoresObj[zId] = feat.properties?.baseline_score || 0
            }
          })
          setBaselineScores(baseScoresObj)

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

  const getDisplayScore = (feature) => {
    const zoneId = feature.properties?.zone_id || ''
    const rawScore = (customScores && customScores[zoneId] !== undefined)
      ? customScores[zoneId]
      : (feature.properties?.baseline_score || 0)

    if (customScores) {
      // Use the stable peak score of the simulation/replay session for scaling
      const maxCustom = currentPeakScore && currentPeakScore > 0 ? currentPeakScore : 100.0
      return (rawScore / maxCustom) * 100
    } else {
      return (rawScore / maxBaselineScore) * 100
    }
  }

  const getStyle = (feature) => {
    const score = getDisplayScore(feature)
    
    // Map score to 5 discrete steps to easily differentiate adjacent zones
    let stepRatio = 0.1
    if (score >= 80) {
      stepRatio = 1.0
    } else if (score >= 60) {
      stepRatio = 0.75
    } else if (score >= 40) {
      stepRatio = 0.5
    } else if (score >= 20) {
      stepRatio = 0.3
    }
    
    // Interpolate color from green rgb(52, 199, 89) to red rgb(255, 59, 48) based on stepRatio
    const r = Math.round(52 + (255 - 52) * stepRatio)
    const g = Math.round(199 + (59 - 199) * stepRatio)
    const b = Math.round(89 + (48 - 89) * stepRatio)
    const opacity = 0.35 + (0.75 - 0.35) * stepRatio

    return {
      color: '#030303', // Dark high-contrast border separating zones
      weight: 1.5, // Thicker border line
      fillColor: `rgb(${r}, ${g}, ${b})`,
      fillOpacity: opacity
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
          <div style="font-family: inherit; color: #e8f4f8; background: rgba(8, 15, 40, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 207, 255, 0.12); padding: 12px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <h4 style="margin: 0 0 6px; font-size: 0.95rem; color: #7b61ff; font-weight: 700;">${zoneName} (ID: ${zoneId})</h4>
            <p style="margin: 0; font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <strong style="color: #5a7a8a;">Relative Congestion:</strong> 
              <span style="background: rgba(0, 207, 255, 0.15); color: #00cfff; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${Math.round(score)}/100</span>
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
              fillOpacity: 0.85,
              weight: 1.8,
              color: '#00cfff' // Glowing cyan border highlight on hover
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
