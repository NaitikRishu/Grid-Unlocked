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
    <div className="panel panel--glow" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(8, 15, 40, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 207, 255, 0.12)', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
      <p className="panel__label" style={{ color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0', fontWeight: 'bold' }}>Resource Allocations</p>
      <h2 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>Zone Congestion Ranking</h2>
      <p className="panel__text" style={{ marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {simulationActive 
          ? 'Showing active simulation scores and allocated intervention resources.' 
          : 'Showing baseline zone average congestion. Select an event and run simulation to see resource deployments.'}
      </p>

      <div style={{ flex: 1, maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(0, 207, 255, 0.12)', borderRadius: '8px', marginTop: 'auto' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.84rem', color: 'var(--text-primary)', textAlign: 'left' }}>
          <thead>
            <tr className="table-header-sweep" style={{ background: 'rgba(8, 15, 40, 0.95)', borderBottom: '1px solid rgba(0, 207, 255, 0.2)', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ padding: '12px', fontWeight: '600', width: '18%' }}>Zone ID</th>
              <th style={{ padding: '12px', fontWeight: '600', width: '22%' }}>Congestion Score</th>
              <th style={{ padding: '12px', fontWeight: '600', width: '20%' }}>Police Officers</th>
              <th style={{ padding: '12px', fontWeight: '600', width: '18%' }}>Barricades</th>
              <th style={{ padding: '12px', fontWeight: '600', width: '22%' }}>Top Event Type</th>
            </tr>
          </thead>
          <tbody>
            {loading && tableData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading zone details...
                </td>
              </tr>
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No zone scores available.
                </td>
              </tr>
            ) : (
              tableData.slice(0, 6).map((row, idx) => {
                const score = row.score
                let badgeColor = 'var(--success)'
                let badgeBg = 'var(--success-dim)'
                if (score > 2.6) {
                  badgeColor = 'var(--danger)'
                  badgeBg = 'var(--danger-dim)'
                } else if (score >= 2.2) {
                  badgeColor = 'var(--warning)'
                  badgeBg = 'rgba(255, 169, 77, 0.15)'
                }

                return (
                  <tr 
                    key={row.zoneId} 
                    className="rank-table-row"
                    style={{ 
                      borderBottom: '1px solid rgba(0, 207, 255, 0.08)',
                      background: idx % 2 === 0 ? 'rgba(0, 207, 255, 0.03)' : 'transparent'
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
                        background: badgeBg,
                        color: badgeColor
                      }}>
                        {row.score.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: row.police > 0 ? '700' : 'normal', color: row.police > 0 ? '#00cfff' : 'var(--text-secondary)' }}>
                      {row.police}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: row.barricades > 0 ? '700' : 'normal', color: row.barricades > 0 ? '#ffa94d' : 'var(--text-secondary)' }}>
                      {row.barricades}
                    </td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {row.topEvent}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {tableData.length > 6 && (
        <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: '#a1a1aa', textAlign: 'right' }}>
          * Showing top 6 zones by congestion score
        </p>
      )}
    </div>
  )
}

export default ZoneRankTable
