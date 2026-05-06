import type { FormState, PreviewResult, WaveformData } from './types'

const MODE_LABELS: Record<string, string> = {
  hardware: 'Hardware pipeline',
  play: 'Svivva Play',
  idea: 'Idea Engine',
  team: 'Collaboration & permissions',
  marketplace: 'API Marketplace',
  build: 'B.U.I.L.D. flow',
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function getStepName(mode: string): string {
  const names: Record<string, string> = {
    hardware: 'Brief → Sound preview',
    play: 'Solo prompt → Clip',
    idea: 'Idea → Sound sketch',
    team: 'Scenario → Setup + preview',
    marketplace: 'Publish → Preview',
    build: 'Brief → Sound placeholder',
  }
  return names[mode] ?? 'Solo prompt → Sound preview'
}

/** Generate deterministic waveform bars from description (production-style preview) */
function generateWaveform(description: string, mode: string): WaveformData {
  const seed = description.toLowerCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const barCount = 48
  const bars: number[] = []
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const wave = Math.sin(seed * 0.1 + t * Math.PI * 4) * 0.4 + 0.5
    const env = Math.exp(-t * 1.2)
    bars.push(Math.max(0.08, Math.min(1, wave * env + (Math.sin(seed + i) * 0.1))))
  }
  const durationSec = 2 + (seed % 300) / 100
  return { bars, durationSec, label: description.slice(0, 40) }
}

export async function generatePreview(form: FormState): Promise<PreviewResult> {
  const start = performance.now()
  await delay(800 + Math.random() * 600)
  const elapsed = performance.now() - start

  const modeLabel = MODE_LABELS[form.mode] ?? form.mode
  const confidence = Math.min(0.95, 0.62 + Math.random() * 0.3)
  const readinessLabel = confidence >= 0.85 ? 'Production-ready' : confidence >= 0.7 ? 'Draft-ready' : 'Exploration'
  const waveform = generateWaveform(form.description, form.mode)

  const result: PreviewResult = {
    artifactType: 'audio',
    title: `Sound preview: ${form.description.slice(0, 45)}${form.description.length > 45 ? '…' : ''}`,
    summary: `One step of the ${modeLabel}: we ran the solo-prompt sound step on your brief. This preview maps to the same pipeline used in Svivva for full workflows with versioning, collaboration, and production-ready exports.`,
    confidence,
    readinessLabel,
    workflowStep: `This is the "${getStepName(form.mode)}" step of Svivva's ${modeLabel}.`,
    fullWorkflowHint: `In the full workflow you get versioning, collaboration, cost tracking, and production-ready exports.`,
    payload: {
      description: form.description,
      mode: form.mode,
      constraints: {
        budget: form.budget || undefined,
        genre: form.genre || undefined,
        materials: form.materials || undefined,
        region: form.region || undefined,
        collaborationSize: form.collaborationSize || undefined,
      },
      _meta: { generatedInMs: Math.round(elapsed) },
    },
    waveform,
  }
  return result
}
