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
      <div className="panel panel--glow" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', background: 'rgba(8, 15, 40, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 207, 255, 0.12)', borderRadius: '10px' }}>
        <p className="panel__text" style={{ color: 'var(--text-secondary)' }}>Loading chart data...</p>
      </div>
    )
  }

  return (
    <div className="panel panel--glow" style={{ padding: '24px', minHeight: '340px', background: 'rgba(8, 15, 40, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 207, 255, 0.12)', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
      <p className="panel__label" style={{ color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0', fontWeight: 'bold' }}>Analytics Visualization</p>
      <h2 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>Top 5 Congested Zones</h2>
      <p className="panel__text" style={{ marginBottom: '20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {simulationActive 
          ? 'Comparing baseline average congestion vs simulated what-if scenario scores.' 
          : 'Showing baseline average congestion scores. Run a simulation to see comparison.'}
      </p>

      <div style={{ width: '100%', height: '240px', marginTop: '10px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#6b7280" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-secondary)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(8, 15, 40, 0.75)', 
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderColor: 'rgba(0, 207, 255, 0.12)', 
                borderRadius: '8px',
                color: '#e8f4f8',
                fontSize: '0.8rem',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.76rem', paddingTop: '10px', color: 'var(--text-secondary)' }}
              iconSize={10}
            />
            <Bar dataKey="Baseline Congestion" fill="url(#cyanGradient)" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={true} animationDuration={1200} />
            <Bar dataKey="Simulated Congestion" fill="#ffffff" filter="url(#softGlow)" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={true} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DelayChart
