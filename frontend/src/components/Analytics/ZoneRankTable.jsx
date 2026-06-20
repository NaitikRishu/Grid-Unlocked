import { useEffect, useState, useMemo } from 'react'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'

function ZoneRankTable() {
  const { baselineScores, simulationScores, resourceAllocation, simulationActive } = useAppStore()
  const [zoneSummaries, setZoneSummaries] = useState({})
  const [loading, setLoading] = useState(false)

  // Fetch zone summary on mount to get top event type for each zone
  useEffect(() => {
    setLoading(true)
    client.get('/analytics/zone-summary')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const summaryMap = {}
          res.data.forEach((z) => {
            summaryMap[String(z.zone_id)] = z.top_event_type || 'N/A'
          })
          setZoneSummaries(summaryMap)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch zone summaries for analytics:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const tableData = useMemo(() => {
    const scoresToUse = simulationActive ? (simulationScores || {}) : (baselineScores || {})
    if (!scoresToUse || Object.keys(scoresToUse).length === 0) {
      return []
    }

    // Sort zones by score descending and keep all active/relevant ones
    return Object.entries(scoresToUse)
      .map(([zoneId, score]) => {
        const police = resourceAllocation?.[zoneId]?.police ?? 0
        const barricades = resourceAllocation?.[zoneId]?.barricades ?? 0
        const topEvent = zoneSummaries[zoneId] || 'N/A'
        
        return {
          zoneId,
          score: Number(score),
          police,
          barricades,
          topEvent
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [baselineScores, simulationScores, resourceAllocation, simulationActive, zoneSummaries])

  return (
    <div className="panel panel--glow" style={{ padding: '24px', flex: '1', minHeight: '340px' }}>
      <p className="panel__label">Resource Allocations</p>
      <h2>Zone Congestion Ranking</h2>
      <p className="panel__text" style={{ marginBottom: '16px', fontSize: '0.86rem' }}>
        {simulationActive 
          ? 'Showing active simulation scores and allocated intervention resources.' 
          : 'Showing baseline zone average congestion. Select an event and run simulation to see resource deployments.'}
      </p>

      <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', color: '#f4f4f5', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Zone ID</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Congestion Score</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Police Officers</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Barricades</th>
              <th style={{ padding: '10px 12px', fontWeight: '600' }}>Top Event Type</th>
            </tr>
          </thead>
          <tbody>
            {loading && tableData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>
                  Loading zone details...
                </td>
              </tr>
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>
                  No zone scores available.
                </td>
              </tr>
            ) : (
              tableData.slice(0, 30).map((row, idx) => (
                <tr 
                  key={row.zoneId} 
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '700' }}>Zone {row.zoneId}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      background: row.score > 50 ? 'rgba(239, 68, 68, 0.15)' : row.score > 20 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: row.score > 50 ? '#ef4444' : row.score > 20 ? '#fbbf24' : '#10b981'
                    }}>
                      {row.score.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: row.police > 0 ? '700' : 'normal', color: row.police > 0 ? '#60a5fa' : '#a1a1aa' }}>
                    {row.police}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: row.barricades > 0 ? '700' : 'normal', color: row.barricades > 0 ? '#fb923c' : '#a1a1aa' }}>
                    {row.barricades}
                  </td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#d4d4d8' }}>
                    {row.topEvent}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {tableData.length > 30 && (
        <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: '#a1a1aa', textAlign: 'right' }}>
          * Showing top 30 zones by congestion score
        </p>
      )}
    </div>
  )
}

export default ZoneRankTable
