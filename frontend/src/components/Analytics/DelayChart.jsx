import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts'
import { useAppStore } from '../../store/appStore'

function DelayChart() {
  const { baselineScores, simulationScores, simulationActive } = useAppStore()

  const chartData = useMemo(() => {
    const scoresToUse = simulationActive ? (simulationScores || {}) : (baselineScores || {})
    if (!scoresToUse || Object.keys(scoresToUse).length === 0) {
      return []
    }

    // Sort zones by score descending and take top 5
    const sortedZones = Object.entries(scoresToUse)
      .map(([zoneId, score]) => ({
        zoneId,
        score: Number(score)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // Build Recharts data array
    return sortedZones.map(({ zoneId }) => {
      const baseVal = baselineScores[zoneId] !== undefined ? Number(baselineScores[zoneId]) : 0
      const simVal = simulationScores && simulationScores[zoneId] !== undefined ? Number(simulationScores[zoneId]) : 0
      
      return {
        name: `Zone ${zoneId}`,
        'Baseline Congestion': parseFloat(baseVal.toFixed(2)),
        'Simulated Congestion': parseFloat(simVal.toFixed(2))
      }
    })
  }, [baselineScores, simulationScores, simulationActive])

  if (chartData.length === 0) {
    return (
      <div className="panel panel--glow" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
        <p className="panel__text" style={{ color: '#a1a1aa' }}>Loading chart data...</p>
      </div>
    )
  }

  return (
    <div className="panel panel--glow" style={{ padding: '24px', minHeight: '340px' }}>
      <p className="panel__label">Analytics Visualization</p>
      <h2>Top 5 Congested Zones</h2>
      <p className="panel__text" style={{ marginBottom: '20px', fontSize: '0.86rem' }}>
        {simulationActive 
          ? 'Comparing baseline average congestion vs simulated what-if scenario scores.' 
          : 'Showing baseline average congestion scores. Run a simulation to see comparison.'}
      </p>

      <div style={{ width: '100%', height: '240px', marginTop: '10px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#a1a1aa" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#a1a1aa" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(9, 9, 11, 0.95)', 
                borderColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontFamily: 'inherit'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.76rem', paddingTop: '10px' }}
              iconSize={10}
            />
            <Bar dataKey="Baseline Congestion" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="Simulated Congestion" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DelayChart
