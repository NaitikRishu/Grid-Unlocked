import { useState, useEffect, useCallback } from 'react'
import TimeOffsetSlider from './TimeOffsetSlider'
import client from '../../api/client'
import { useAppStore } from '../../store/appStore'
import { 
  IconTrafficLights, IconMessageCircle, IconBan, IconTruckOff, 
  IconSun, IconCloudRain, IconCloudStorm, IconTornado,
  IconBulb, IconChartBar, IconCheck, IconAlertTriangle, IconShieldCheck, IconBarrierBlock, IconCopy, IconCheckbox
} from '@tabler/icons-react'

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
    selectedEvent, manpower, barricades, diversionActive, offsetMinutes,
    signalOptimized, vmsActive, clearwayEnforced, heavyVehicleRestricted,
    weather, startSimulation, setSimulationResults, clearSimulation
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
      
      setManpower(data.recommended_manpower)
      setBarricades(data.recommended_barricades)
      setDiversionActive(data.recommended_diversion_active)
      setOffsetMinutes(data.recommended_offset_minutes)
      setSignalOptimized(data.recommended_signal_optimized)
      setVmsActive(data.recommended_vms_active)
      setClearwayEnforced(data.recommended_clearway_enforced)
      setHeavyVehicleRestricted(data.recommended_heavy_vehicle_restricted)
      setRecommendation(data)
      
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
- Detour status: ${diversionActive ? 'ACTIVE' : 'INACTIVE'}
- Active Traffic Policies:
  * Signal Optimization: ${signalOptimized ? 'ACTIVE' : 'INACTIVE'}
  * VMS display boards: ${vmsActive ? 'ACTIVE' : 'INACTIVE'}
  * Clearway parking restrictions: ${clearwayEnforced ? 'ACTIVE' : 'INACTIVE'}
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

  useEffect(() => {
    if (!selectedEvent) return
    const timer = setTimeout(() => {
      handleRunSimulation()
    }, 200)
    return () => clearTimeout(timer)
  }, [
    selectedEvent?.id, manpower, barricades, diversionActive, offsetMinutes,
    signalOptimized, vmsActive, clearwayEnforced, heavyVehicleRestricted,
    weather, handleRunSimulation
  ])

  if (!selectedEvent) {
    return (
      <div style={{ padding: '24px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <p className="text-eyebrow">Scenario Planner</p>
        <h2 className="text-section-heading" style={{ marginBottom: '24px' }}>What-If Simulator</h2>
        
        <div style={{
          flex: 1,
          border: '2px dashed rgba(0, 207, 255, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'rgba(8, 15, 40, 0.4)',
          boxShadow: '0 0 20px rgba(0, 207, 255, 0.05)',
          textAlign: 'center'
        }}>
          <div className="radar-scanner-wrapper" style={{ marginBottom: '20px' }}>
            <div className="radar-sweep"></div>
            <div className="radar-center-dot"></div>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No Incident Selected
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Select an incident from the log to run a mitigation simulation.
          </p>
        </div>
      </div>
    )
  }

  const ToggleSwitch = ({ checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, position: 'absolute' }} />
      <div style={{
        width: '28px',
        height: '16px',
        borderRadius: '8px',
        background: checked ? 'var(--accent)' : 'rgba(120,120,128,0.2)',
        transition: 'background 0.15s ease',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '2px', left: '2px',
          width: '12px', height: '12px',
          borderRadius: '50%', background: '#ffffff',
          transition: 'transform 0.15s ease',
          transform: checked ? 'translateX(12px)' : 'translateX(0px)'
        }} />
      </div>
    </label>
  )

  const ActionRow = ({ icon, title, sub, checked, onChange, hasDivider = true, color = 'var(--text-secondary)' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: hasDivider ? '1px solid var(--border)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: checked ? color : 'var(--text-muted)' }}>{icon}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sub}</span>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {isSimulating && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 11, 24, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '12px', letterSpacing: '0.05em' }}>
            RUNNING MITIGATION SIMULATION...
          </p>
          <div style={{ width: '80%', height: '4px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div className="sim-progress-bar" style={{ height: '100%', background: 'var(--accent)', width: '0%', borderRadius: '2px' }}></div>
          </div>
        </div>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="text-eyebrow" style={{ margin: 0 }}>MITIGATION SCENARIO</p>
          {simulationActive && (
            <button onClick={clearSimulation} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
              Reset
            </button>
          )}
        </div>
        <h2 className="text-section-heading">What-If Simulator</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Weather Scenario Selector */}
        <div>
          <p className="text-eyebrow">WEATHER SCENARIO</p>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['sunny', 'rainy', 'monsoon', 'thunderstorm'].map((w) => {
              const active = weather === w
              return (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 0',
                    fontSize: '11px',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    border: active ? '1px solid rgba(59,158,255,0.25)' : '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {w === 'sunny' && <IconSun size={14} />}
                  {w === 'rainy' && <IconCloudRain size={14} />}
                  {w === 'monsoon' && <IconCloudStorm size={14} />}
                  {w === 'thunderstorm' && <IconTornado size={14} />}
                  <span style={{ textTransform: 'capitalize' }}>{w}</span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Sliders */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconShieldCheck size={12} /> Police Officers
            </span>
            <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{manpower}</span>
          </div>
          <input type="range" min="0" max="50" value={manpower} onChange={(e) => setManpower(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--text-primary)' }} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconBarrierBlock size={12} /> Barricades
            </span>
            <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{barricades}</span>
          </div>
          <input type="range" min="0" max="20" value={barricades} onChange={(e) => setBarricades(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--text-primary)' }} />
        </div>

        {/* Start Time Offset (TimeOffsetSlider) */}
        <div style={{ padding: '4px 0' }}>
           <TimeOffsetSlider value={offsetMinutes} onChange={setOffsetMinutes} />
        </div>

        <ActionRow 
          icon={<IconBarrierBlock size={18} stroke={1.5} />}
          color="var(--success)"
          title="Activate Diversion Routes" 
          sub="Divert traffic away from epicenter" 
          checked={diversionActive} 
          onChange={() => setDiversionActive(!diversionActive)} 
        />

        {/* Policies */}
        <div>
          <p className="text-eyebrow">MITIGATION POLICIES</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ActionRow 
              icon={<IconTrafficLights size={18} stroke={1.5} />}
              color="var(--accent)"
              title="Optimize Signal Timing" 
              sub="Improves average speed by 30%" 
              checked={signalOptimized} 
              onChange={() => setSignalOptimized(!signalOptimized)} 
            />
            <ActionRow 
              icon={<IconMessageCircle size={18} stroke={1.5} />}
              color="var(--accent)"
              title="Activate VMS Signboards" 
              sub="Alert drivers of detour ahead" 
              checked={vmsActive} 
              onChange={() => setVmsActive(!vmsActive)} 
            />
            <ActionRow 
              icon={<IconBan size={18} stroke={1.5} />}
              color="var(--warning)"
              title="Enforce Clearway (No-Parking)" 
              sub="Removes curb lane obstructions" 
              checked={clearwayEnforced} 
              onChange={() => setClearwayEnforced(!clearwayEnforced)} 
            />
            <ActionRow 
              icon={<IconTruckOff size={18} stroke={1.5} />}
              color="var(--danger)"
              title="Heavy Vehicle Restriction" 
              sub="Bans multi-axle freight trucks" 
              checked={heavyVehicleRestricted} 
              onChange={() => setHeavyVehicleRestricted(!heavyVehicleRestricted)} 
              hasDivider={false} 
            />
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '12px', margin: '0' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button 
            onClick={handleAutoRecommend} 
            disabled={isRecommending || isSimulating}
            style={{ 
              flex: 1,
              fontWeight: 600,
              fontSize: '12px',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '10px 0',
              borderRadius: '8px',
              cursor: (isRecommending || isSimulating) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              if (!isRecommending && !isSimulating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (!isRecommending && !isSimulating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }
            }}
          >
            {isRecommending ? 'Analyzing...' : 'Auto-Recommend'}
          </button>
          
          <button 
            onClick={handleRunSimulation} 
            disabled={isSimulating || isRecommending}
            style={{ 
              flex: 1.2,
              fontWeight: 700,
              fontSize: '12px',
              color: '#09090b',
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              padding: '10px 0',
              borderRadius: '8px',
              cursor: (isSimulating || isRecommending) ? 'not-allowed' : 'pointer',
              opacity: (isSimulating || isRecommending) ? 0.7 : 1,
              boxShadow: '0 0 12px rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              if (!isSimulating && !isRecommending) {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSimulating && !isRecommending) {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {recommendation && (
          <div className="card" style={{ padding: '12px', marginTop: '8px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconBulb size={14} color="var(--accent)" /> Smart Recommendation
            </h4>
            <p className="text-body" style={{ margin: '6px 0 0' }}>
              {recommendation.explanation}
            </p>
          </div>
        )}

        {simulationActive && (
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="text-eyebrow" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconChartBar size={12} color="var(--success)" /> SIMULATION RESULTS
              </p>
              <button 
                onClick={handleCopyBrief}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copied ? 'Copied!' : 'Copy Brief'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="text-eyebrow">DELAY SAVED</span>
                <span className="text-metric-small" style={{ color: '#00ff66', textShadow: '0 0 8px rgba(0, 255, 102, 0.3)' }}>{simulationDelaySaved} mins</span>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="text-eyebrow">NEW DURATION</span>
                <span className="text-metric-small" style={{ color: 'var(--text-primary)' }}>{predictedDuration} mins</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {diversionActive ? (
                <>
                  <IconCheckbox size={14} color="var(--success)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Alternate routes active. Traffic diverted.</span>
                </>
              ) : (
                <>
                  <IconAlertTriangle size={14} color="var(--warning)" />
                  <span style={{ fontSize: '11px', color: 'var(--warning)' }}>Route diversion inactive. Congestion localized.</span>
                </>
              )}
            </div>

            {resourceAllocation && Object.keys(resourceAllocation).length > 0 && (
              <div>
                <p className="text-eyebrow" style={{ marginTop: '8px' }}>SMART RESOURCE DISPATCH</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(resourceAllocation)
                    .filter(([_, alloc]) => alloc.police > 0 || alloc.barricades > 0)
                    .slice(0, 4)
                    .map(([zoneId, alloc]) => (
                      <div key={zoneId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <span className="text-mono" style={{ color: 'var(--text-primary)' }}>Ward {zoneId}</span>
                        <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>
                          {alloc.police} police &middot; {alloc.barricades} barricades
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
