import type { PreviewResult } from './types'
import type { Mode } from './types'

const MODULE_LINKS: Record<Mode, string> = {
  hardware: 'https://svivva.com/hardware',
  play: 'https://svivva.com/play',
  idea: 'https://svivva.com/idea',
  team: 'https://svivva.com/team',
  marketplace: 'https://svivva.com/marketplace',
  build: 'https://svivva.com/build',
}

const STEP_COPY: Record<Mode, string> = {
  hardware:
    'You just previewed the "Brief → Sound" step. In the full Hardware pipeline you get BOM generation, versioning, certification tracking, and export to fabrication.',
  play: 'You just previewed one Play performance step (solo prompt → clip). In Svivva you get full performance modes, routing, and live collaboration.',
  idea: 'You just previewed an Idea Engine sound stage. The full workflow includes validation, costing, and handoff to build or team.',
  team: 'You just previewed a collaboration setup with sound. In Svivva you get permissions, roles, and shared project history.',
  marketplace: 'You just previewed a publish flow. The full API Marketplace adds versioning, docs, and usage analytics.',
  build: 'You just previewed the "Brief → Sound" step. In B.U.I.L.D. you get the full digital/physical flow with iterations and exports.',
}

interface RightPanelProps {
  preview: PreviewResult | null
  mode: Mode
}

export function RightPanel({ preview, mode }: RightPanelProps) {
  const stepCopy = STEP_COPY[mode]
  const moduleUrl = MODULE_LINKS[mode]

  return (
    <aside className="panel right-panel">
      <h2 className="panel-title">Svivva workflow</h2>
      <div className="mapping-copy">
        {preview ? (
          <>
            <p><strong>Which step is this?</strong></p>
            <p>{preview.workflowStep}</p>
            <p>{preview.fullWorkflowHint}</p>
            <p className="step-detail">{stepCopy}</p>
          </>
        ) : (
          <>
            <p>This tool runs <strong>one isolated step</strong> of Svivva’s real pipeline.</p>
            <p>Generate a sound preview to see which step you’re in and what the full workflow offers.</p>
          </>
        )}
      </div>
      <p className="upgrade-hint">
        In Svivva you get versioning, collaboration, cost tracking, and production-ready exports.
      </p>
      <a href={moduleUrl} className="module-link" target="_blank" rel="noopener noreferrer">
        Open {mode} module on Svivva →
      </a>
    </aside>
  )
}
