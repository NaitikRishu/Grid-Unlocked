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
  simSignalOptimized: false,
  simVmsActive: false,
  simClearwayEnforced: false,
  simHeavyVehicleRestricted: false,
  isPlanning: false,
  planningLat: 12.9784,
  planningLon: 77.5994,

  setBaselineScores: (scores) => set({ baselineScores: scores }),
  setIsPlanning: (val) => set({ isPlanning: val }),
  setPlanningCoords: (lat, lon) => set({ planningLat: lat, planningLon: lon }),

  setSimulationResults: (data, params = {}) => set({
    simulationScores: data.zone_scores || {},
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
    simHeavyVehicleRestricted: params.heavy_vehicle_restricted || false
  }),

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
    simHeavyVehicleRestricted: false
  })
}))
