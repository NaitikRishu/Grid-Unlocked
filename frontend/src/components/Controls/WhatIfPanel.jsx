import { useState, useEffect } from 'react'
import TimeOffsetSlider from './TimeOffsetSlider'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'

function WhatIfPanel({ selectedEvent }) {
  const { startSimulation, setSimulationResults, clearSimulation, isSimulating, simulationActive } = useAppStore()
  
  const [manpower, setManpower] = useState(15)
  const [barricades, setBarricades] = useState(5)
  const [diversionActive, setDiversionActive] = useState(true)
  const [offsetMinutes, setOffsetMinutes] = useState(0)
  const [error, setError] = useState(null)

  // Reset local adjustments if selectedEvent changes
  useEffect(() => {
    setError(null)
    if (!selectedEvent) {
      clearSimulation()
    }
  }, [selectedEvent, clearSimulation])

  const handleRunSimulation = async () => {
    if (!selectedEvent) return
    
    setError(null)
    startSimulation()

    const payload = {
      event_type: selectedEvent.event_type,
      latitude: selectedEvent.lat,
      longitude: selectedEvent.lon,
      start_datetime: selectedEvent.start_datetime,
      manpower: manpower,
      barricades: barricades,
      diversion_active: diversionActive,
      start_time_offset_minutes: offsetMinutes
    }

    try {
      const response = await client.post('/simulate/', payload)
      setSimulationResults(response.data)
    } catch (err) {
      console.error('Simulation execution failed:', err)
      setError(err.response?.data?.message || 'Error occurred running simulation.')
      clearSimulation()
    }
  }

  if (!selectedEvent) {
    return (
      <div className="panel panel--glow">
        <p className="panel__label">Scenario Planner</p>
        <h2>What-If Simulator</h2>
        <p className="panel__text" style={{ marginTop: '12px', fontSize: '0.88rem' }}>
          Select an incident report from the Incident Log to run a mitigation simulation.
        </p>
      </div>
    )
  }

  return (
    <div className="panel panel--glow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <p className="panel__label">Mitigation Scenario</p>
        {simulationActive && (
          <button 
            className="refresh-btn" 
            style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#a1a1aa', textDecoration: 'none' }}
            onClick={clearSimulation}
          >
            [ Reset ]
          </button>
        )}
      </div>
      <h2>What-If Simulator</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        
        {/* Manpower Slider */}
        <div className="control-slider">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a1a1aa' }}>
            <span>Police Officers</span>
            <span style={{ fontWeight: '700', color: '#ffffff' }}>{manpower}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="50" 
            value={manpower} 
            onChange={(e) => setManpower(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#ffffff', cursor: 'pointer' }}
          />
        </div>

        {/* Barricades Slider */}
        <div className="control-slider">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a1a1aa' }}>
            <span>Barricades</span>
            <span style={{ fontWeight: '700', color: '#ffffff' }}>{barricades}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="20" 
            value={barricades} 
            onChange={(e) => setBarricades(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#ffffff', cursor: 'pointer' }}
          />
        </div>

        {/* Start Time Offset (TimeOffsetSlider) */}
        <TimeOffsetSlider value={offsetMinutes} onChange={setOffsetMinutes} />

        {/* Diversion Toggle */}
        <label className="control-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Activate Diversion Routes</span>
          <input 
            type="checkbox" 
            checked={diversionActive} 
            onChange={() => setDiversionActive(!diversionActive)}
            style={{ accentColor: '#ffffff', cursor: 'pointer' }}
          />
        </label>

        {error && (
          <p style={{ color: '#ff4d4d', fontSize: '0.78rem', margin: '0' }}>{error}</p>
        )}

        <button 
          onClick={handleRunSimulation} 
          disabled={isSimulating}
          className="chip"
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '12px', 
            fontWeight: '700', 
            border: '1px solid rgba(255,255,255,0.2)',
            background: isSimulating ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
            color: '#ffffff',
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginTop: '8px',
            textAlign: 'center'
          }}
        >
          {isSimulating ? 'Calculating Impacts...' : 'Run Scenario Simulation'}
        </button>
      </div>
    </div>
  )
}

export default WhatIfPanel
