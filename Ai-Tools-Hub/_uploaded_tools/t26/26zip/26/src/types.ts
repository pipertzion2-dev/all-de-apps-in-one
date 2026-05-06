export type Mode = 'hardware' | 'play' | 'idea' | 'team' | 'marketplace' | 'build'

export interface FormState {
  description: string
  mode: Mode
  budget: string
  genre: string
  materials: string
  region: string
  collaborationSize: string
}

export interface RiskComplianceItem {
  id: string
  category: string
  item: string
  status: 'pass' | 'review' | 'fail'
  note?: string
}

export interface PreviewResult {
  artifactType: 'schematic' | 'bom' | '3d' | 'audio' | 'flow' | 'idea_report' | 'setup_map'
  title: string
  summary: string
  confidence: number
  readinessLabel: string
  workflowStep: string
  fullWorkflowHint: string
  payload: Record<string, unknown>
  /** Hardware Risk & Compliance: table rows for preview */
  riskTable?: RiskComplianceItem[]
}
