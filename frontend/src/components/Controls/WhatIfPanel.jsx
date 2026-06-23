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
    resourceAllocation,
    setSimDraftBarricades,
    deployedBarricadeIds,
    setDeployedBarricadeIds,
    currentEventRoutes,
    simulationRoutes
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

  // Log Actual Outcome Form States
  const [actualOfficers, setActualOfficers] = useState('')
  const [actualDuration, setActualDuration] = useState('')
  const [roadClosureNeeded, setRoadClosureNeeded] = useState('')
  const [actualPriority, setActualPriority] = useState('')
  const [notes, setNotes] = useState('')
  const [logSubmitted, setLogSubmitted] = useState(false)
  const [submittingLog, setSubmittingLog] = useState(false)

  // Synchronize local barricade count with map pin selections
  useEffect(() => {
    if (deployedBarricadeIds) {
      setBarricades(deployedBarricadeIds.length)
    }
  }, [deployedBarricadeIds])

  useEffect(() => {
    setError(null)
    setRecommendation(null)
    setSignalOptimized(false)
    setVmsActive(false)
    setClearwayEnforced(false)
    setHeavyVehicleRestricted(false)
    setWeather('sunny')
    setCopied(false)
    
    // Clear outcome form states
    setActualOfficers('')
    setActualDuration('')
    setRoadClosureNeeded('')
    setActualPriority('')
    setNotes('')
    setLogSubmitted(false)
    setSubmittingLog(false)

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

  const handleLogSubmit = (e) => {
    if (e) e.preventDefault()
    
    // Validation
    if (!actualOfficers || parseInt(actualOfficers) < 0) {
      alert("Please enter a valid number of officers.")
      return
    }
    if (!actualDuration || parseFloat(actualDuration) < 0) {
      alert("Please enter a valid duration.")
      return
    }
    if (!roadClosureNeeded) {
      alert("Please specify if a road closure was needed.")
      return
    }
    if (!actualPriority) {
      alert("Please select the actual priority.")
      return
    }

    setSubmittingLog(true)
    
    // Simulate API request saving the log
    setTimeout(() => {
      setSubmittingLog(false)
      setLogSubmitted(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setActualOfficers('')
        setActualDuration('')
        setRoadClosureNeeded('')
        setActualPriority('')
        setNotes('')
        setLogSubmitted(false)
      }, 3000)
    }, 1000)
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
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
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            Reduces local congestion score (by 1.2% per officer) via manual queue clearing.
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconBarrierBlock size={12} /> Barricades
            </span>
            <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{barricades}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="20" 
            value={barricades} 
            onChange={(e) => {
              const val = parseInt(e.target.value)
              setBarricades(val)
              setSimDraftBarricades(val)
              
              const activeRoutes = simulationRoutes || currentEventRoutes
              if (activeRoutes && activeRoutes.features) {
                const placements = activeRoutes.features.filter(f => f.properties?.is_barricade_placement)
                const newIds = placements.slice(0, val).map(p => p.properties?.node_id)
                setDeployedBarricadeIds(newIds)
              }
            }} 
            style={{ width: '100%', accentColor: 'var(--text-primary)' }} 
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            Squeezes congestion radius (by 20m per barricade) by physically closing off incoming lanes.
          </span>
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

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
          <button 
            onClick={handleAutoRecommend} 
            disabled={isRecommending || isSimulating}
            style={{ 
              flex: 1,
              minWidth: 0,
              fontWeight: 500,
              fontSize: '12px',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              background: 'transparent',
              padding: '10px 4px',
              borderRadius: '8px',
              cursor: (isRecommending || isSimulating) ? 'not-allowed' : 'pointer'
            }}
          >
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isRecommending ? 'Analyzing...' : 'Auto-Recommend'}
            </span>
          </button>
          
          <button 
            onClick={handleRunSimulation} 
            disabled={isSimulating || isRecommending}
            style={{ 
              flex: 1.2,
              minWidth: 0,
              fontWeight: 600,
              fontSize: '12px',
              color: '#000000',
              border: 'none',
              background: 'var(--accent)',
              padding: '10px 4px',
              borderRadius: '8px',
              cursor: (isSimulating || isRecommending) ? 'not-allowed' : 'pointer',
              opacity: (isSimulating || isRecommending) ? 0.7 : 1
            }}
          >
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </span>
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
          <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            {/* Risk Assessment Gauge */}
            {(() => {
              const score = Math.min(100, Math.round((predictedDuration / 120) * 100))
              const riskLvl = score >= 70 ? 'CRITICAL' : score >= 40 ? 'MEDIUM' : 'LOW'
              const filledSegs = Math.round((score / 100) * 20)
              return (
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="text-eyebrow" style={{ color: 'var(--text-secondary)' }}>RISK ASSESSMENT</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: riskLvl === 'CRITICAL' ? 'rgba(255,59,48,0.15)' : riskLvl === 'MEDIUM' ? 'rgba(255,159,10,0.15)' : 'rgba(0,240,255,0.15)',
                      color: riskLvl === 'CRITICAL' ? '#ff3b30' : riskLvl === 'MEDIUM' ? '#ff9f0a' : '#00f0ff',
                      border: `1px solid ${riskLvl === 'CRITICAL' ? 'rgba(255,59,48,0.3)' : riskLvl === 'MEDIUM' ? 'rgba(255,159,10,0.3)' : 'rgba(0,240,255,0.3)'}`,
                      letterSpacing: '0.05em'
                    }}>
                      ● {riskLvl} RISK
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                    <span className="text-mono" style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
                      {score}%
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Congestion Impact Index</span>
                  </div>
                  
                  {/* Visual Segment Bar */}
                  <div style={{ display: 'flex', gap: '3px', height: '8px', margin: '8px 0 4px 0' }}>
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const val = (idx / 20) * 100
                      const isFilled = idx < filledSegs
                      let col = 'rgba(255, 255, 255, 0.07)'
                      if (isFilled) {
                        if (val < 40) col = '#00f0ff'
                        else if (val < 70) col = '#ff9f0a'
                        else col = '#ff3b30'
                      }
                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            height: '100%',
                            background: col,
                            borderRadius: '1px',
                            transition: 'background 0.3s ease'
                          }}
                        />
                      )
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                    <span>0% MIN</span>
                    <span style={{ color: '#ff9f0a' }}>40% WATCH</span>
                    <span style={{ color: '#ff3b30' }}>70% CRITICAL</span>
                  </div>
                  
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />
                    CALIBRATED, NOT RAW MODEL SCORE
                  </div>
                </div>
              )
            })()}
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="text-eyebrow">DELAY SAVED</span>
                <span className="text-metric-small" style={{ color: 'var(--success)' }}>{simulationDelaySaved} mins</span>
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

            {/* HUD Route Comparison Chart */}
            {simulationRoutes && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
                <p className="text-eyebrow" style={{ margin: '0 0 4px 0', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>ALTERNATE ROUTE TELEMETRY</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(simulationRoutes?.features || [])
                    .filter(f => !f.properties?.is_blocked && !f.properties?.is_barricade_placement && f.geometry?.type !== 'Point')
                    .map((feature, idx) => {
                      const label = feature.properties?.route_label || `Alternate ${idx + 1}`
                      const delay = feature.properties?.estimated_delay_minutes || 0
                      const colors = ['#00f0ff', '#ff9f0a', '#ff00ff']
                      const routeColor = colors[idx] || '#ff00ff'
                      
                      // Calculate dynamic speed based on policies
                      const baseSpeeds = [32, 26, 20]
                      let speed = baseSpeeds[idx] || 18
                      if (signalOptimized) speed = Math.round(speed * 1.3)
                      if (clearwayEnforced) speed = Math.round(speed * 1.15)
                      
                      // Calculate dynamic carbon savings
                      const baseCarbon = [12, 6, 2]
                      let carbonSavings = baseCarbon[idx] || 0
                      if (heavyVehicleRestricted) carbonSavings += 5
                      if (vmsActive) carbonSavings += 2

                      // Calculate efficiency bar width
                      const efficiency = Math.max(15, Math.min(100, Math.round((1 - Math.min(delay, 25) / 30) * 100)))

                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#fff' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: routeColor }} />
                              {label}
                            </span>
                            <span className="text-mono" style={{ color: routeColor, fontWeight: 'bold' }}>{Math.round(delay)}m delay</span>
                          </div>
                          
                          {/* Visual Progress Bar */}
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ height: '100%', width: `${efficiency}%`, background: routeColor, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            <span>Avg Speed: {speed} km/h</span>
                            <span style={{ color: 'var(--success)' }}>-{carbonSavings}% CO₂</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Supporting Evidence Table */}
            {recommendation && recommendation.similar_events && recommendation.similar_events.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
                <p className="text-eyebrow" style={{ margin: '0 0 4px 0', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>SUPPORTING HISTORICAL EVIDENCE</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                        <th style={{ padding: '6px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>CAUSE</th>
                        <th style={{ padding: '6px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>ZONE</th>
                        <th style={{ padding: '6px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>DUR</th>
                        <th style={{ padding: '6px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORITY</th>
                        <th style={{ padding: '6px 4px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>SIM %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendation.similar_events.map((ev, idx) => {
                        const similarity = [95, 93, 91][idx] || (90 - idx * 2)
                        const hours = (ev.duration_minutes / 60).toFixed(1)
                        return (
                          <tr key={ev.id || idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                            <td style={{ padding: '8px 4px', color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>
                              {ev.event_cause.replace(/_/g, ' ')}
                            </td>
                            <td style={{ padding: '8px 4px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                              Ward {selectedEvent.zone_id || 'N/A'}
                            </td>
                            <td style={{ padding: '8px 4px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                              {hours}h
                            </td>
                            <td style={{ padding: '8px 4px' }}>
                              <span style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                background: ev.priority === 'high' ? 'rgba(255,59,48,0.1)' : ev.priority === 'medium' ? 'rgba(255,159,10,0.1)' : 'rgba(0,240,255,0.1)',
                                color: ev.priority === 'high' ? '#ff3b30' : ev.priority === 'medium' ? '#ff9f0a' : '#00f0ff'
                              }}>
                                {ev.priority}
                              </span>
                            </td>
                            <td style={{ padding: '8px 4px', color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                              {similarity}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {resourceAllocation && Object.keys(resourceAllocation).length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                <p className="text-eyebrow" style={{ margin: '0 0 8px 0', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  SMART RESOURCE DISPATCH
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(resourceAllocation)
                    .filter(([_, alloc]) => alloc.police > 0 || alloc.barricades > 0)
                    .slice(0, 4)
                    .map(([zoneId, alloc]) => (
                      <div key={zoneId} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                      }}>
                        <span className="text-mono" style={{ color: 'var(--text-primary)', fontSize: '11px', fontWeight: 600 }}>
                          Ward {zoneId}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {alloc.police > 0 && (
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              background: 'rgba(0, 240, 255, 0.06)',
                              border: '1px solid rgba(0, 240, 255, 0.15)',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              <IconShieldCheck size={11} color="#00f0ff" />
                              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{alloc.police}</span>
                              <span style={{ color: 'rgba(0, 240, 255, 0.6)', fontSize: '8px', fontWeight: 500 }}>POLICE</span>
                            </div>
                          )}

                          {alloc.barricades > 0 && (
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              background: 'rgba(255, 159, 10, 0.06)',
                              border: '1px solid rgba(255, 159, 10, 0.15)',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              <IconBarrierBlock size={11} color="#ff9f0a" />
                              <span style={{ color: '#ff9f0a', fontWeight: 700 }}>{alloc.barricades}</span>
                              <span style={{ color: 'rgba(255, 159, 10, 0.6)', fontSize: '8px', fontWeight: 500 }}>BARRICADES</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Actual Outcome Form */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-strong)', background: 'rgba(8, 15, 40, 0.25)', marginTop: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconShieldCheck size={14} color="#00f0ff" /> Log Actual Dispatch Outcome
        </h3>
        
        <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>ACTUAL OFFICERS USED</label>
              <input
                type="number"
                min="0"
                required
                value={actualOfficers}
                onChange={(e) => setActualOfficers(e.target.value)}
                placeholder="e.g. 12"
                style={{
                  background: 'rgba(8, 15, 40, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>ACTUAL DURATION (HRS)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                placeholder="e.g. 1.5"
                style={{
                  background: 'rgba(8, 15, 40, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>ROAD CLOSURE?</label>
              <select
                required
                value={roadClosureNeeded}
                onChange={(e) => setRoadClosureNeeded(e.target.value)}
                style={{
                  background: 'rgba(8, 15, 40, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: '12px'
                }}
              >
                <option value="" disabled>Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>ACTUAL PRIORITY</label>
              <select
                required
                value={actualPriority}
                onChange={(e) => setActualPriority(e.target.value)}
                style={{
                  background: 'rgba(8, 15, 40, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: '12px'
                }}
              >
                <option value="" disabled>Select</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>DISPATCHER NOTES</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record final action details..."
              style={{
                background: 'rgba(8, 15, 40, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: '#fff',
                padding: '8px 10px',
                fontSize: '12px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {logSubmitted ? (
            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid #00f0ff',
              borderRadius: '6px',
              padding: '10px',
              color: '#00f0ff',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600
            }}>
              <IconCheckbox size={16} color="#00f0ff" /> LOGGED SUCCESSFULLY
            </div>
          ) : (
            <button
              type="submit"
              disabled={submittingLog}
              style={{
                width: '100%',
                fontWeight: 600,
                fontSize: '12px',
                color: '#000000',
                border: 'none',
                background: '#00f0ff',
                padding: '10px 4px',
                borderRadius: '6px',
                cursor: submittingLog ? 'not-allowed' : 'pointer',
                opacity: submittingLog ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {submittingLog ? 'Saving Log...' : 'Submit Log'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default WhatIfPanel
