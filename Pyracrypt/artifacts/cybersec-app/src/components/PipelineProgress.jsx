import { usePipelineStore } from '../store/usePipelineStore'

export function PipelineProgress() {
  const steps = usePipelineStore((s) => s.pipelineSteps)
  const activeStepIndex = usePipelineStore((s) => s.activeStepIndex)
  const busy = usePipelineStore((s) => s.busy)

  return (
    <div className="u-card u-border u-ring-accent rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold u-text">Pipeline</p>
        <p className="text-xs u-muted">
          {busy ? 'Running…' : activeStepIndex >= steps.length ? 'Complete' : 'Idle'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((st, idx) => {
          const state = idx < activeStepIndex ? 'done' : idx === activeStepIndex && busy ? 'active' : 'todo'
          return (
            <div key={st.id} className="flex items-center gap-2">
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium u-border border',
                  state === 'done' ? 'u-bg-success-soft u-success' : '',
                  state === 'active' ? 'u-bg-accent-soft u-accent u-ring-accent' : '',
                  state === 'todo' ? 'u-muted' : '',
                ].join(' ')}
              >
                {st.label}
              </span>
              {idx < steps.length - 1 ? <span className="text-xs u-muted">→</span> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
