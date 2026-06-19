import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

const dummyViolations = [
  { lat: 12.9716, lon: 77.5946, count: 12 },
  { lat: 12.9745, lon: 77.5901, count: 8 },
  { lat: 12.9802, lon: 77.5854, count: 15 },
  { lat: 12.9654, lon: 77.6012, count: 9 },
  { lat: 12.9582, lon: 77.5934, count: 14 },
  { lat: 12.9678, lon: 77.5799, count: 7 },
  { lat: 12.9892, lon: 77.5982, count: 11 },
  { lat: 12.9733, lon: 77.6110, count: 18 }
]

function ViolationHeatmap() {
  const map = useMap()

  useEffect(() => {
    if (!L.heatLayer) {
      console.warn('L.heatLayer is not loaded on the global Leaflet object.')
      return
    }

    const points = dummyViolations.map((v) => [v.lat, v.lon, v.count / 20])
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 15,
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
  }, [map])

  return null
}

export default ViolationHeatmap
