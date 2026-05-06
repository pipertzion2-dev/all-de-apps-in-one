import type { FormState, PreviewResult, RiskComplianceItem } from './types'

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

function modeToArtifact(mode: string): PreviewResult['artifactType'] {
  const map: Record<string, PreviewResult['artifactType']> = {
    hardware: 'bom',
    play: 'audio',
    idea: 'idea_report',
    team: 'setup_map',
    marketplace: 'flow',
    build: '3d',
  }
  return map[mode] ?? 'bom'
}

function getStepName(mode: string): string {
  const names: Record<string, string> = {
    hardware: 'Risk & Compliance scan',
    play: 'Intent → Clip',
    idea: 'Idea → Report',
    team: 'Scenario → Setup map',
    marketplace: 'Publish → Flow',
    build: 'Brief → 3D placeholder',
  }
  return names[mode] ?? 'Risk & Compliance scan'
}

function generateRiskTable(description: string): RiskComplianceItem[] {
  const words = description.toLowerCase().split(/\s+/)
  const hasPower = words.some((w) => /power|battery|ac|dc|voltage/.test(w))
  const hasRadio = words.some((w) => /wireless|bluetooth|wifi|rf|radio/.test(w))
  const hasEnv = words.some((w) => /outdoor|industrial|rohs|weee/.test(w))
  const statuses: Array<'pass' | 'review' | 'fail'> = ['pass', 'review', 'fail']
  return [
    { id: '1', category: 'Safety & EMC', item: 'Electrical safety (IEC 60950)', status: hasPower ? 'review' : 'pass', note: hasPower ? 'Power mentioned—verify isolation' : undefined },
    { id: '2', category: 'Safety & EMC', item: 'EMC emissions (FCC/CE)', status: hasRadio ? 'review' : 'pass', note: hasRadio ? 'RF intent—plan pre-compliance' : undefined },
    { id: '3', category: 'Environmental', item: 'RoHS / REACH', status: 'pass', note: undefined },
    { id: '4', category: 'Environmental', item: 'WEEE / recycling', status: 'review', note: 'Define EOL strategy' },
    { id: '5', category: 'Supply chain', item: 'Conflict minerals', status: 'pass', note: undefined },
    { id: '6', category: 'Certification', item: 'Target markets (CE, FCC, etc.)', status: 'review', note: 'Set target regions' },
    { id: '7', category: 'Documentation', item: 'Technical file / DoC', status: 'review', note: 'Required for CE' },
  ]
}

export async function generatePreview(form: FormState): Promise<PreviewResult> {
  const start = performance.now()
  await delay(600 + Math.random() * 500)
  const elapsed = performance.now() - start

  const modeLabel = MODE_LABELS[form.mode] ?? form.mode
  const artifactType = modeToArtifact(form.mode)
  const confidence = Math.min(0.95, 0.65 + Math.random() * 0.28)
  const readinessLabel = confidence >= 0.85 ? 'Production-ready' : confidence >= 0.7 ? 'Draft-ready' : 'Exploration'

  const riskTable = form.mode === 'hardware' ? generateRiskTable(form.description) : undefined

  const result: PreviewResult = {
    artifactType,
    title: `Risk & Compliance: ${form.description.slice(0, 45)}${form.description.length > 45 ? '…' : ''}`,
    summary:
      form.mode === 'hardware'
        ? `One step of the ${modeLabel}: we ran a risk & compliance scan on your brief. Review the table for safety, EMC, environmental, and certification items.`
        : `One step of the ${modeLabel} workflow: we generated a ${artifactType.replace('_', ' ')} preview from your brief.`,
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
    riskTable,
  }
  return result
}
