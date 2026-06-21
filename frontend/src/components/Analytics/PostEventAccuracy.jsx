import { useEffect, useState } from 'react'
import client from '../../api/client'

function PostEventAccuracy() {
  const [accuracyData, setAccuracyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    client.get('/analytics/post-event')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setAccuracyData(res.data)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch post-event accuracy analytics:', err)
        setError('Failed to load performance metrics.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const getErrorColor = (absError) => {
    if (absError > 30) return '#ef4444' // Red
    if (absError > 10 && absError <= 30) return '#fbbf24' // Yellow/Amber
    return '#10b981' // Green
  }

  const cleanData = accuracyData.filter(
    d =>
      d.actual_duration > 0 &&
      d.actual_duration <= 240
  )

  return (
    <div className="panel panel--glow" style={{ padding: '24px', flex: '1', minHeight: '340px' }}>
      <p className="panel__label">Model Evaluation</p>
      <h2>Post-Event Prediction Accuracy</h2>
      <p className="panel__text" style={{ marginBottom: '16px', fontSize: '0.86rem' }}>
        Comparing machine learning predicted event durations against actual observed clearance times.
      </p>

      <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', color: '#f4f4f5', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Event ID</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Zone ID</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Predicted Duration</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Actual Duration</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Absolute Error (min)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>
                  Loading evaluation logs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
                  {error}
                </td>
              </tr>
            ) : cleanData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>
                  No historical event predictions found.
                </td>
              </tr>
            ) : (
              cleanData.slice(0, 50).map((row, idx) => (
                <tr 
                  key={row.event_id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '700' }}>{row.event_id}</td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{row.event_type}</td>
                  <td style={{ padding: '10px 12px' }}>Zone {row.zone_id}</td>
                  <td style={{ padding: '10px 12px' }}>{row.predicted_duration} mins</td>
                  <td style={{ padding: '10px 12px' }}>{row.actual_duration} mins</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: getErrorColor(Math.abs(row.predicted_duration - row.actual_duration)) }}>
                    {Math.round(Math.abs(row.predicted_duration - row.actual_duration))} min
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {cleanData.length > 50 && (
        <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: '#a1a1aa', textAlign: 'right' }}>
          * Showing first 50 prediction metrics
        </p>
      )}
    </div>
  )
}

export default PostEventAccuracy
