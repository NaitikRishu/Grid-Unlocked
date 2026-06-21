import { useState, useEffect, useCallback } from 'react'
import TimeOffsetSlider from './TimeOffsetSlider'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'

function WhatIfPanel({ selectedEvent }) {
  const { 
    startSimulation, 
    setSimulationResults, 
    clearSimulation, 
    isSimulating, 
    simulationActive,
    simulationDelaySaved,
    predictedDuration,
    highImpact,
    resourceAllocation
  } = useAppStore()
  
  const [manpower, setManpower] = useState(15)
  const [barricades, setBarricades] = useState(5)
  const [diversionActive, setDiversionActive] = useState(true)
  const [offsetMinutes, setOffsetMinutes] = useState(0)
  const [signalOptimized, setSignalOptimized] = useState(false)
  const [vmsActive, setVmsActive] = useState(false)
  const [clearwayEnforced, setClearwayEnforced] = useState(false)
  const [heavyVehicleRestricted, setHeavyVehicleRestricted] = useState(false)
  const [weather, setWeather] = useState('sunny')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [isRecommending, setIsRecommending] = useState(false)

  // Reset local adjustments if selectedEvent changes
  useEffect(() => {
    setError(null)
    setRecommendation(null)
    setSignalOptimized(false)
    setVmsActive(false)
    setClearwayEnforced(false)
    setHeavyVehicleRestricted(false)
    setWeather('sunny')
    setCopied(false)
    if (!selectedEvent) {
      clearSimulation()
    }
  }, [selectedEvent, clearSimulation])

  const handleRunSimulation = useCallback(async () => {
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
      start_time_offset_minutes: offsetMinutes,
      signal_optimized: signalOptimized,
      vms_active: vmsActive,
      clearway_enforced: clearwayEnforced,
      heavy_vehicle_restricted: heavyVehicleRestricted,
      weather: weather
    }

    try {
      const response = await client.post('/simulate/', payload)
      setSimulationResults(response.data, payload)
    } catch (err) {
      console.error('Simulation execution failed:', err)
      setError(err.response?.data?.message || 'Error occurred running simulation.')
      clearSimulation()
    }
  }, [
    selectedEvent,
    manpower,
    barricades,
    diversionActive,
    offsetMinutes,
    signalOptimized,
    vmsActive,
    clearwayEnforced,
    heavyVehicleRestricted,
    weather,
    startSimulation,
    setSimulationResults,
    clearSimulation
  ])

  const handleAutoRecommend = async () => {
    if (!selectedEvent) return
    
    setError(null)
    setIsRecommending(true)

    const payload = {
      event_type: selectedEvent.event_type,
      latitude: selectedEvent.lat,
      longitude: selectedEvent.lon,
      start_datetime: selectedEvent.start_datetime
    }

    try {
      const response = await client.post('/simulate/recommend', payload)
      const data = response.data
      
      // Update state parameters
      setManpower(data.recommended_manpower)
      setBarricades(data.recommended_barricades)
      setDiversionActive(data.recommended_diversion_active)
      setOffsetMinutes(data.recommended_offset_minutes)
      setSignalOptimized(data.recommended_signal_optimized)
      setVmsActive(data.recommended_vms_active)
      setClearwayEnforced(data.recommended_clearway_enforced)
      setHeavyVehicleRestricted(data.recommended_heavy_vehicle_restricted)
      setRecommendation(data)
      
      // Immediately run the simulation with recommended parameters
      startSimulation()
      const simPayload = {
        event_type: selectedEvent.event_type,
        latitude: selectedEvent.lat,
        longitude: selectedEvent.lon,
        start_datetime: selectedEvent.start_datetime,
        manpower: data.recommended_manpower,
        barricades: data.recommended_barricades,
        diversion_active: data.recommended_diversion_active,
        start_time_offset_minutes: data.recommended_offset_minutes,
        signal_optimized: data.recommended_signal_optimized,
        vms_active: data.recommended_vms_active,
        clearway_enforced: data.recommended_clearway_enforced,
        heavy_vehicle_restricted: data.recommended_heavy_vehicle_restricted,
        weather: weather
      }
      
      const simResponse = await client.post('/simulate/', simPayload)
      setSimulationResults(simResponse.data, simPayload)
    } catch (err) {
      console.error('Recommendation fetch failed:', err)
      setError(err.response?.data?.message || 'Error occurred fetching recommendations.')
      clearSimulation()
    } finally {
      setIsRecommending(false)
    }
  }

  const handleCopyBrief = () => {
    if (!selectedEvent) return
    
    const brief = `=== TRAFFIC OPERATIONS DISPATCH BRIEFING ===
Incident: ${selectedEvent.event_cause || selectedEvent.event_type.replace('_', ' ')}
Priority: ${selectedEvent.priority || 'medium'}
Location: Ward ${selectedEvent.zone_id || 'N/A'} (Centroid: Lat ${selectedEvent.lat}, Lon ${selectedEvent.lon})
Weather Condition: ${weather.toUpperCase()}

DISPATCH INSTRUCTIONS:
- Police Officers deployed: ${manpower} officers
- Barricades deployed: ${barricades} barricades
- Detour status: ${diversionActive ? 'ACTIVE (Divert traffic to green alternate routes)' : 'INACTIVE'}
- Active Traffic Policies:
  * Signal Optimization: ${signalOptimized ? 'ACTIVE (30% speedup)' : 'INACTIVE'}
  * VMS display boards: ${vmsActive ? 'ACTIVE' : 'INACTIVE'}
  * Clearway parking restrictions: ${clearwayEnforced ? 'ACTIVE (20% speedup)' : 'INACTIVE'}
  * Heavy vehicle ban: ${heavyVehicleRestricted ? 'ACTIVE' : 'INACTIVE'}

EXPECTED IMPACT OUTCOME:
- Estimated travel delay saved: ${simulationDelaySaved} minutes
- New projected congestion duration: ${predictedDuration} minutes
- Status: Operations plan simulated and active.`

    navigator.clipboard.writeText(brief)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error('Failed to copy dispatch brief:', err)
      })
  }

  // Auto-run simulation on parameter changes with a small 200ms debounce
  useEffect(() => {
    if (!selectedEvent) return

    const timer = setTimeout(() => {
      handleRunSimulation()
    }, 200)

    return () => clearTimeout(timer)
  }, [
    selectedEvent?.id,
    manpower,
    barricades,
    diversionActive,
    offsetMinutes,
    signalOptimized,
    vmsActive,
    clearwayEnforced,
    heavyVehicleRestricted,
    weather,
    handleRunSimulation
  ])

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
        
        {/* Weather Scenario Selector */}
        <div>
          <span style={{ fontSize: '0.74rem', color: '#a1a1aa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Weather Scenario
          </span>
          <div className="weather-tabs-container">
            {['sunny', 'rainy', 'monsoon', 'thunderstorm'].map((w) => {
              const label = w === 'sunny' ? '☀️ Sun' : w === 'rainy' ? '🌧️ Rain' : w === 'monsoon' ? '⛈️ Monsoon' : '🌪️ Storm'
              const active = weather === w
              const activeClass = active ? `is-${w}-active` : ''
              return (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`weather-tab-btn ${activeClass}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        
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
            style={{ width: '100%', cursor: 'pointer' }}
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
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Start Time Offset (TimeOffsetSlider) */}
        <TimeOffsetSlider value={offsetMinutes} onChange={setOffsetMinutes} />

        {/* Diversion Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ fontSize: '0.82rem', color: '#e4e4e7', fontWeight: '600' }}>Activate Diversion Routes</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={diversionActive} 
              onChange={() => setDiversionActive(!diversionActive)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Advanced Mitigation Policies Board */}
        <div className="policy-board">
          <p className="policy-board__title">Mitigation Policies</p>

          <div className="policy-item">
            <div className="policy-item__info">
              <span className="policy-item__icon">🚦</span>
              <div className="policy-item__text">
                <span className="policy-item__name">Optimize Signal Timing</span>
                <span className="policy-item__desc">Improves average speed by 30%</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={signalOptimized} 
                onChange={() => setSignalOptimized(!signalOptimized)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="policy-item">
            <div className="policy-item__info">
              <span className="policy-item__icon">📺</span>
              <div className="policy-item__text">
                <span className="policy-item__name">Activate VMS Signboards</span>
                <span className="policy-item__desc">Alert drivers of detour ahead</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={vmsActive} 
                onChange={() => setVmsActive(!vmsActive)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="policy-item">
            <div className="policy-item__info">
              <span className="policy-item__icon">🚫</span>
              <div className="policy-item__text">
                <span className="policy-item__name">Enforce Clearway (No-Parking)</span>
                <span className="policy-item__desc">Removes curb lane obstructions</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={clearwayEnforced} 
                onChange={() => setClearwayEnforced(!clearwayEnforced)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="policy-item">
            <div className="policy-item__info">
              <span className="policy-item__icon">🚛</span>
              <div className="policy-item__text">
                <span className="policy-item__name">Heavy Vehicle Restriction</span>
                <span className="policy-item__desc">Bans multi-axle freight trucks</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={heavyVehicleRestricted} 
                onChange={() => setHeavyVehicleRestricted(!heavyVehicleRestricted)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--color-crimson)', fontSize: '0.78rem', margin: '0' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button 
            onClick={handleAutoRecommend} 
            disabled={isRecommending || isSimulating}
            className="chip btn-recommend"
            style={{ 
              flex: 1,
              fontWeight: '700',
              color: 'var(--color-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              background: 'rgba(6, 182, 212, 0.08)',
              textAlign: 'center',
              cursor: (isRecommending || isSimulating) ? 'not-allowed' : 'pointer'
            }}
          >
            {isRecommending ? 'Analyzing...' : '💡 Auto-Recommend'}
          </button>
          
          <button 
            onClick={handleRunSimulation} 
            disabled={isSimulating || isRecommending}
            className="chip btn-simulate"
            style={{ 
              flex: 1.2,
              fontWeight: '700',
              color: '#ffffff',
              border: '1px solid var(--border-highlight)',
              background: 'rgba(255, 255, 255, 0.05)',
              textAlign: 'center',
              cursor: (isSimulating || isRecommending) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {recommendation && (
          <div className="recommendation-card">
            <h4 style={{ margin: 0, color: 'var(--color-cyan)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💡</span> Smart Recommendation
            </h4>
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#d4d4d8', lineHeight: '1.4' }}>
              {recommendation.explanation}
            </p>
            
            {recommendation.similar_events && recommendation.similar_events.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <span className="panel__label" style={{ fontSize: '0.64rem', display: 'block', marginBottom: '6px' }}>
                  Similar Ward Incidents
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {recommendation.similar_events.map((ev, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.72rem', 
                      padding: '5px 8px', 
                      background: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px' 
                    }}>
                      <span style={{ color: '#f4f4f5', fontWeight: '500' }}>{ev.event_cause} ({ev.priority})</span>
                      <span style={{ color: 'var(--color-slate)', fontFamily: 'var(--font-mono)' }}>{ev.duration_minutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {simulationActive && (
          <div className="simulation-outcome-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <h4 style={{ margin: 0, color: 'var(--color-emerald)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📊</span> Simulation Results
              </h4>
              <button 
                onClick={handleCopyBrief}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  color: 'var(--color-emerald)',
                  padding: '3px 6px',
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                {copied ? '✅ COPIED!' : '📋 COPY BRIEF'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Delay Saved</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>{simulationDelaySaved} mins</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>New Duration</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{predictedDuration} mins</span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#d4d4d8', lineHeight: '1.4' }}>
              {diversionActive ? (
                <p style={{ margin: 0 }}>
                  ✅ Alternate routes active. Traffic diverted around the epicenter.
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-amber)' }}>
                  ⚠️ Route diversion inactive. Congestion remains highly localized.
                </p>
              )}
            </div>

            {resourceAllocation && Object.keys(resourceAllocation).length > 0 && (
              <div>
                <span className="panel__label" style={{ fontSize: '0.64rem', display: 'block', marginBottom: '6px' }}>
                  Smart Resource Dispatch
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto', paddingRight: '2px' }}>
                  {Object.entries(resourceAllocation)
                    .filter(([_, alloc]) => alloc.police > 0 || alloc.barricades > 0)
                    .slice(0, 4)
                    .map(([zoneId, alloc]) => (
                      <div key={zoneId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px'
                      }}>
                        <span style={{ color: '#f4f4f5', fontWeight: '600' }}>Ward {zoneId}</span>
                        <span style={{ color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                          👮 {alloc.police} • 🚧 {alloc.barricades}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WhatIfPanel
