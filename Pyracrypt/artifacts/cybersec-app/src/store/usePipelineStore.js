import { create } from 'zustand'

import { api } from '../api/client'

function layoutGraph(graph) {
  const nodes = graph?.nodes || []
  const n = Math.max(nodes.length, 1)
  return nodes.map((node, i) => {
    const angle = (i / n) * Math.PI * 2
    const r = 2.6
    return {
      ...node,
      position: [Math.cos(angle) * r, Math.sin(angle) * r, 0.35 * Math.sin(i * 1.9)],
    }
  })
}

function buildEdgeList(nodes, edges) {
  const byId = new Map(nodes.map((x) => [x.node_id, x]))
  return (edges || [])
    .map((e) => {
      const a = byId.get(e.from)
      const b = byId.get(e.to)
      if (!a?.position || !b?.position) return null
      return { id: e.id, from: a.position, to: b.position, trust: e.trust }
    })
    .filter(Boolean)
}

const steps = [
  { id: 'hypothesis', label: 'Hypothesize' },
  { id: 'combine', label: 'Combine' },
  { id: 'mutate', label: 'Mutate' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'remedy', label: 'Remedy' },
]

export const usePipelineStore = create((set, get) => ({
  system: '',
  error: null,
  busy: false,
  activeStepIndex: -1,
  visualPhase: 'IDLE',
  pipelineSteps: steps,

  hypotheses: [],
  combined: null,
  mutated: null,
  simulated: null,
  remedy: null,
  suite: null,
  features: [],

  laidOutNodes: [],
  laidOutEdges: [],

  setSystem: (system) => set({ system }),
  loadFeatures: async () => {
    try {
      const rows = await api.features()
      set({ features: rows || [] })
    } catch {
      set({ features: [] })
    }
  },
  setVisualPhase: (visualPhase) => set({ visualPhase }),

  resetResults: () =>
    set({
      error: null,
      hypotheses: [],
      combined: null,
      mutated: null,
      simulated: null,
      remedy: null,
      suite: null,
      laidOutNodes: [],
      laidOutEdges: [],
      activeStepIndex: -1,
    }),

  applyGraphLayout: (structure) => {
    const nodes = layoutGraph(structure)
    const edges = buildEdgeList(nodes, structure?.edges)
    set({ laidOutNodes: nodes, laidOutEdges: edges })
  },

  runPipeline: async () => {
    const { system, resetResults, applyGraphLayout } = get()
    resetResults()
    set({ busy: true, error: null, visualPhase: 'DISCOVERY', activeStepIndex: 0 })
    try {
      const hy = await api.hypothesis(system)
      set({ hypotheses: hy, activeStepIndex: 1 })

      const co = await api.combine(system)
      set({ combined: co, activeStepIndex: 2 })
      applyGraphLayout(co.new_structure)

      const mu = await api.mutate(co.new_structure)
      set({ mutated: mu, activeStepIndex: 3 })

      set({ visualPhase: 'ATTACK' })
      const primary = hy[0] || { hypothesis: 'Authorization gaps across components', confidence: 0.7 }
      const sim = await api.simulate(primary)
      set({ simulated: sim, activeStepIndex: 4 })

      const rem = await api.remedy({
        hypothesis: primary.hypothesis,
        attack_steps: sim.attack_steps,
        graph: co.new_structure,
      })
      set({ remedy: rem, activeStepIndex: 5, visualPhase: 'REMEDY' })

      setTimeout(() => {
        set({ visualPhase: 'IDLE' })
      }, 1400)
    } catch (e) {
      set({ error: e?.message || 'Pipeline failed', visualPhase: 'IDLE' })
    } finally {
      set({ busy: false })
    }
  },

  runSuite: async () => {
    const { system, resetResults, applyGraphLayout } = get()
    resetResults()
    set({ busy: true, error: null, visualPhase: 'DISCOVERY', suite: null, activeStepIndex: -1 })
    try {
      const data = await api.suite(system)
      const p = data.pipeline
      set({
        hypotheses: p.hypotheses,
        combined: p.combined,
        mutated: p.mutated,
        simulated: p.simulated,
        remedy: p.remedy,
        suite: data,
      })
      applyGraphLayout(p.combined.new_structure)
      set({ visualPhase: 'ATTACK' })
      setTimeout(() => set({ visualPhase: 'REMEDY' }), 700)
      setTimeout(() => set({ visualPhase: 'IDLE' }), 2400)
    } catch (e) {
      set({ error: e?.message || 'Suite failed', visualPhase: 'IDLE' })
    } finally {
      set({ busy: false })
    }
  },
}))
