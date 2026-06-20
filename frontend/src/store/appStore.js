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

  setBaselineScores: (scores) => set({ baselineScores: scores }),
  setReplayScores: (scores) => set({ replayScores: scores }),
  setReplayProgress: (progress) => set({ replayProgress: progress }),
  startReplay: () => set({ replayActive: true }),
  stopReplay: () => set({ replayActive: false, replayScores: null, replayProgress: 0 }),

  setSimulationResults: (data) => set({
    simulationScores: data.zone_scores || {},
    simulationRoutes: data.alternate_routes ? { type: 'FeatureCollection', features: data.alternate_routes } : null,
    simulationDelaySaved: data.delay_saved_minutes || 0,
    predictedDuration: data.predicted_duration_minutes || 0,
    highImpact: data.high_impact || false,
    resourceAllocation: data.resource_allocation || {},
    simulationActive: true,
    isSimulating: false
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
    isSimulating: false
  })
}))
