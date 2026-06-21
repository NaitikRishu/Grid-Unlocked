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
    if (absError > 30) return 'var(--danger)'
    if (absError > 10 && absError <= 30) return 'var(--warning)'
    return 'var(--success)'
  }

  const cleanData = accuracyData.filter(
    d => d.actual_duration > 0 && d.actual_duration <= 240
  )

  return (
    <div className="panel panel--glow" style={{ padding: '24px', flex: '1', minHeight: '340px', background: 'rgba(8, 15, 40, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 207, 255, 0.12)', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
      <p className="panel__label" style={{ color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0', fontWeight: 'bold' }}>Model Evaluation</p>
      <h2 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>Post-Event Prediction Accuracy</h2>
      <p className="panel__text" style={{ marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        Comparing machine learning predicted event durations against actual observed clearance times.
      </p>

      <div style={{ maxHeight: '250px', overflow: 'auto', border: '1px solid rgba(0, 207, 255, 0.12)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', color: 'var(--text-primary)', textAlign: 'left' }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr className="table-header-sweep" style={{ background: 'rgba(8, 15, 40, 0.95)', borderBottom: '1px solid rgba(0, 207, 255, 0.2)', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Event ID</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Zone ID</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Predicted Duration</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Actual Duration</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Absolute Error (min)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading evaluation logs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>
                  {error}
                </td>
              </tr>
            ) : cleanData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No historical event predictions found.
                </td>
              </tr>
            ) : (
              cleanData.slice(0, 50).map((row, idx) => {
                const absError = Math.abs(row.predicted_duration - row.actual_duration)
                return (
                  <tr
                    key={row.event_id}
                    className="rank-table-row"
                    style={{
                      borderBottom: '1px solid rgba(0, 207, 255, 0.08)',
                      background: idx % 2 === 0 ? 'rgba(0, 207, 255, 0.03)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 16px', fontWeight: '700', whiteSpace: 'nowrap' }}>{row.event_id}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Zone {row.zone_id}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>{row.predicted_duration} mins</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#e4e4e7'
                      }}>
                        {Math.round(row.actual_duration)} min
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: '700', whiteSpace: 'nowrap', color: getErrorColor(absError) }}>
                      {absError.toFixed(2)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {cleanData.length > 50 && (
        <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
          * Showing top 50 evaluation logs
        </p>
      )}
    </div>
  )
}

export default PostEventAccuracy
