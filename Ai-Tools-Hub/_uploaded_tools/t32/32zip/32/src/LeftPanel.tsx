import type { FormState } from './types'

const MODES: { value: FormState['mode']; label: string }[] = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'play', label: 'Play' },
  { value: 'idea', label: 'Idea' },
  { value: 'team', label: 'Team' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'build', label: 'Build' },
]

interface LeftPanelProps {
  form: FormState
  onChange: (form: FormState) => void
  onSubmit: () => void
  loading: boolean
  error: string | null
  onModuleInterest: (mode: string) => void
}

export function LeftPanel({ form, onChange, onSubmit, loading, error, onModuleInterest }: LeftPanelProps) {
  const update = (patch: Partial<FormState>) => onChange({ ...form, ...patch })

  return (
    <aside className="panel left-panel">
      <h2 className="panel-title">Your brief</h2>
      <label className="field">
        <span>Short description <em>(required)</em></span>
        <textarea
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="e.g. Lo-fi beat, 90 BPM, vinyl crackle, Rhodes chord stab"
          rows={3}
        />
      </label>
      <label className="field">
        <span>Mode or category</span>
        <select
          value={form.mode}
          onChange={(e) => {
            const mode = e.target.value as FormState['mode']
            update({ mode })
            onModuleInterest(mode)
          }}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </label>
      <div className="constraints">
        <span className="constraints-label">Optional constraints</span>
        <label className="field inline">
          <span>Budget</span>
          <input
            type="text"
            value={form.budget}
            onChange={(e) => update({ budget: e.target.value })}
            placeholder="e.g. $500"
          />
        </label>
        <label className="field inline">
          <span>Genre</span>
          <input
            type="text"
            value={form.genre}
            onChange={(e) => update({ genre: e.target.value })}
            placeholder="e.g. ambient, hip-hop"
          />
        </label>
        <label className="field inline">
          <span>Materials</span>
          <input
            type="text"
            value={form.materials}
            onChange={(e) => update({ materials: e.target.value })}
            placeholder="e.g. analog, samples"
          />
        </label>
        <label className="field inline">
          <span>Region</span>
          <input
            type="text"
            value={form.region}
            onChange={(e) => update({ region: e.target.value })}
            placeholder="e.g. EU, US"
          />
        </label>
        <label className="field inline">
          <span>Collaboration size</span>
          <input
            type="text"
            value={form.collaborationSize}
            onChange={(e) => update({ collaborationSize: e.target.value })}
            placeholder="e.g. 3 people"
          />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <button
        type="button"
        className="submit-btn"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? 'Generating…' : 'Generate sound preview'}
      </button>
    </aside>
  )
}
