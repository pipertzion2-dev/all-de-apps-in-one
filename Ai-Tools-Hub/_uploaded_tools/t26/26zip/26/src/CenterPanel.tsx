import type { PreviewResult } from './types'
import type { RiskComplianceItem } from './types'

interface CenterPanelProps {
  preview: PreviewResult | null
  loading: boolean
  onSecondaryCta: () => void
}

export function CenterPanel({ preview, loading, onSecondaryCta }: CenterPanelProps) {
  return (
    <main className="panel center-panel">
      <h2 className="panel-title">Preview</h2>
      <div className="preview-area">
        {loading && (
          <div className="preview-loading">
            <div className="spinner" />
            <p>Running one step of the Svivva pipeline…</p>
          </div>
        )}
        {!loading && !preview && (
          <div className="preview-empty">
            <p>Enter a description and choose a mode, then click <strong>Run risk & compliance scan</strong>.</p>
            <p className="muted">You’ll get a production-style preview in under 3 seconds—no account needed.</p>
          </div>
        )}
        {!loading && preview && (
          <>
            <div className="preview-artifact">
              <PreviewArtifact result={preview} />
            </div>
            <div className="confidence-row">
              <span className="confidence-label">Readiness</span>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: `${preview.confidence * 100}%` }} />
              </div>
              <span className="confidence-value">{preview.readinessLabel}</span>
            </div>
            <p className="preview-summary">{preview.summary}</p>
            <button type="button" className="secondary-cta" onClick={onSecondaryCta}>
              Open this preview inside a real Svivva project
            </button>
          </>
        )}
      </div>
    </main>
  )
}

function PreviewArtifact({ result }: { result: PreviewResult }) {
  if (result.artifactType === 'bom' && result.riskTable && result.riskTable.length > 0) {
    return <RiskComplianceTable rows={result.riskTable} />
  }
  const type = result.artifactType
  if (type === '3d') {
    return (
      <div className="artifact-3d">
        <div className="cube" />
        <span>3D placeholder</span>
      </div>
    )
  }
  if (type === 'schematic') {
    return (
      <div className="artifact-schematic">
        <div className="schematic-lines" />
        <span>Schematic preview</span>
      </div>
    )
  }
  if (type === 'audio') {
    return (
      <div className="artifact-audio">
        <div className="waveform" />
        <span>Audio clip</span>
      </div>
    )
  }
  if (type === 'flow') {
    return (
      <div className="artifact-flow">
        <div className="flow-nodes" />
        <span>Flow graph</span>
      </div>
    )
  }
  return (
    <div className="artifact-generic">
      <div className="generic-icon" />
      <span>{type.replace('_', ' ')}</span>
    </div>
  )
}

function RiskComplianceTable({ rows }: { rows: RiskComplianceItem[] }) {
  return (
    <div className="risk-table-wrap">
      <table className="risk-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Item</th>
            <th>Status</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.category}</td>
              <td>{r.item}</td>
              <td>
                <span className={`status status-${r.status}`}>{r.status}</span>
              </td>
              <td>{r.note ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
