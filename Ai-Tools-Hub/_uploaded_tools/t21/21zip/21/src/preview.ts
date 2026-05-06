import type { FormState, PreviewResult } from './types'

const MODE_LABELS: Record<string, string> = {
  hardware: 'Hardware pipeline',
  play: 'Svivva Play',
  idea: 'Idea Engine',
  team: 'Collaboration & permissions',
  marketplace: 'API Marketplace',
  build: 'B.U.I.L.D. flow',
}

export async function generatePreview(form: FormState): Promise<PreviewResult> {
  const start = performance.now()
  await delay(800 + Math.random() * 600)
  const elapsed = performance.now() - start

  const modeLabel = MODE_LABELS[form.mode] ?? form.mode
  const artifactType = modeToArtifact(form.mode)
  const confidence = Math.min(0.95, 0.6 + Math.random() * 0.3)
  const readinessLabel = confidence >= 0.85 ? 'Production-ready' : confidence >= 0.7 ? 'Draft-ready' : 'Exploration'

  const result: PreviewResult = {
    artifactType,
    title: `Preview: ${form.description.slice(0, 40)}${form.description.length > 40 ? '…' : ''}`,
    summary: `One step of the ${modeLabel} workflow: we generated a ${artifactType.replace('_', ' ')} preview from your brief.`,
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
  }
  return result
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function modeToArtifact(mode: string): PreviewResult['artifactType'] {
  const map: Record<string, PreviewResult['artifactType']> = {
    hardware: 'schematic',
    play: 'audio',
    idea: 'idea_report',
    team: 'setup_map',
    marketplace: 'flow',
    build: '3d',
  }
  return map[mode] ?? '3d'
}

function getStepName(mode: string): string {
  const names: Record<string, string> = {
    hardware: 'Concept → Schematic',
    play: 'Intent → Clip',
    idea: 'Idea → Report',
    team: 'Scenario → Setup map',
    marketplace: 'Publish → Flow',
    build: 'Brief → 3D placeholder',
  }
  return names[mode] ?? 'Preview step'
}
