import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import client from '../../api/client'

import 'leaflet.heat'

// Generate a dense, realistic fallback set of violations clustered around Bengaluru
const generateRealisticDummyViolations = () => {
  const points = []
  const centerLat = 12.9716
  const centerLon = 77.5946
  
  // Seed random generator or use pseudo-random offsets for consistent look
  for (let i = 0; i < 180; i++) {
    const angle = (i * 137.5) * (Math.PI / 180) // golden angle distribution
    const radius = 0.005 + (Math.sqrt(i) * 0.006) // spiral distribution
    const lat = centerLat + Math.sin(angle) * radius + (Math.random() * 0.008 - 0.004)
    const lon = centerLon + Math.cos(angle) * radius + (Math.random() * 0.008 - 0.004)
    const count = Math.floor(Math.sin(i / 10) * 40) + 60 // count between 20 and 100
    points.push({ lat, lon, count })
  }
  return points
}

const dummyViolations = generateRealisticDummyViolations()

function ViolationHeatmap() {
  const map = useMap()
  const [points, setPoints] = useState([])

  useEffect(() => {
    client.get('/violations/heatmap')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setPoints(res.data)
        } else {
          setPoints(dummyViolations)
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch heatmap data, using dummy fallback:', err)
        setPoints(dummyViolations)
      })
  }, [])

  useEffect(() => {
    // Reference window.L to bypass ES Module hoisting issues in Vite
    const leafletInstance = window.L || L
    if (!leafletInstance || !leafletInstance.heatLayer) {
      console.warn('Leaflet heatLayer plugin is not loaded yet.')
      return
    }

    if (points.length === 0) {
      return
    }

    const maxVal = Math.max(...points.map((p) => p.count), 1)
    const heatPoints = points.map((p) => [p.lat, p.lon, p.count])
    const heatLayer = leafletInstance.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 13,
      max: maxVal,
      gradient: {
        0.4: '#3b82f6', // blue
        0.6: '#10b981', // emerald
        0.8: '#fbbf24', // amber
        1.0: '#ef4444'  // red
      }
    })

    heatLayer.addTo(map)

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer)
      }
    }
  }, [map, points])

  return null
}

export default ViolationHeatmap
