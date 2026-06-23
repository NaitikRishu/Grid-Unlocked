import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Simulation States
  isSimulating: false,
  simulationActive: false,
  simulationScores: null,      // { zone_id: score }
  simulationRoutes: null,      // alternate route GeoJSON FeatureCollection
  simulationDelaySaved: 0,
  predictedDuration: 0,
  highImpact: false,
  resourceAllocation: null,    // { zone_id: { police, barricades } }
  baselineScores: {},          // { zone_id: score }
  replayActive: false,
  replayScores: null,          // { zone_id: score }
  replayProgress: 0,           // 0-100 progress percent
  simSignalOptimized: false,
  simVmsActive: false,
  simClearwayEnforced: false,
  simHeavyVehicleRestricted: false,
  simBarricades: 0,
  simManpower: 0,
  simDraftBarricades: null,    // Real-time slider draft value
  deployedBarricadeIds: [],    // Node IDs of active barricades on map
  currentEventRoutes: null,    // Cache of fetched alternate routes for active event
  currentPeakScore: 1.0,       // Max score at peak/start of simulation/replay for stable scaling
  isPlanning: false,
  planningLat: 12.9784,
  planningLon: 77.5994,

  setBaselineScores: (scores) => set({ baselineScores: scores }),
  setReplayScores: (scores) => set({ replayScores: scores }),
  setReplayProgress: (progress) => set({ replayProgress: progress }),
  startReplay: () => set({ replayActive: true }),
  stopReplay: () => set({ replayActive: false, replayScores: null, replayProgress: 0, currentPeakScore: 1.0 }),
  setIsPlanning: (val) => set({ isPlanning: val }),
  setPlanningCoords: (lat, lon) => set({ planningLat: lat, planningLon: lon }),
  setSimDraftBarricades: (val) => set({ simDraftBarricades: val }),
  setDeployedBarricadeIds: (ids) => set({ deployedBarricadeIds: ids }),
  setCurrentEventRoutes: (routes) => set({ currentEventRoutes: routes }),
  setCurrentPeakScore: (val) => set({ currentPeakScore: val }),

  setSimulationResults: (data, params = {}) => {
    const scores = data.zone_scores || {}
    const maxScore = Math.max(...Object.values(scores).map(Number), 1)
    return set({
      simulationScores: scores,
      currentPeakScore: maxScore,
      simulationRoutes: data.alternate_routes ? { type: 'FeatureCollection', features: data.alternate_routes } : null,
      simulationDelaySaved: data.delay_saved_minutes || 0,
      predictedDuration: data.predicted_duration_minutes || 0,
      highImpact: data.high_impact || false,
      resourceAllocation: data.resource_allocation || {},
      simulationActive: true,
      isSimulating: false,
      simSignalOptimized: params.signal_optimized || false,
      simVmsActive: params.vms_active || false,
      simClearwayEnforced: params.clearway_enforced || false,
      simHeavyVehicleRestricted: params.heavy_vehicle_restricted || false,
      simBarricades: params.barricades || 0,
      simManpower: params.manpower || 0,
      simDraftBarricades: null // Reset draft once official simulation results load
    })
  },

  startSimulation: () => set({ isSimulating: true }),

  clearSimulation: () => set({
    simulationActive: false,
    simulationScores: null,
    simulationRoutes: null,
    simulationDelaySaved: 0,
    predictedDuration: 0,
    highImpact: false,
    resourceAllocation: null,
    isSimulating: false,
    simSignalOptimized: false,
    simVmsActive: false,
    simClearwayEnforced: false,
    simHeavyVehicleRestricted: false,
    simBarricades: 0,
    simManpower: 0,
    simDraftBarricades: null,
    deployedBarricadeIds: [],
    currentEventRoutes: null,
    currentPeakScore: 1.0
  })
}))
