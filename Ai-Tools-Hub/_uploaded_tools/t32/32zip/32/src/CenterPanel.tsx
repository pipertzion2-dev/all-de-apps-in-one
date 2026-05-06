import type { PreviewResult } from './types'

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
            <p>Enter a description and choose a mode, then click <strong>Generate sound preview</strong>.</p>
            <p className="muted">You’ll get a production-style sound preview in under 3 seconds—no account needed.</p>
          </div>
        )}
        {!loading && preview && (
          <>
            <div className="preview-artifact">
              {preview.waveform ? (
                <WaveformView waveform={preview.waveform} />
              ) : (
                <div className="artifact-audio">
                  <div className="waveform" />
                  <span>Audio clip</span>
                </div>
              )}
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

function WaveformView({ waveform }: { waveform: { bars: number[]; durationSec: number; label?: string } }) {
  return (
    <div className="waveform-view">
      {waveform.label && <span className="waveform-label">{waveform.label}</span>}
      <div className="waveform-bars" role="img" aria-label="Audio waveform preview">
        {waveform.bars.map((h, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{ height: `${Math.max(4, h * 100)}%` }}
          />
        ))}
      </div>
      <span className="waveform-duration">~{waveform.durationSec.toFixed(1)}s</span>
    </div>
  )
}
