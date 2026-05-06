interface CtaBarProps {
  onPrimaryCta: () => void
}

export function CtaBar({ onPrimaryCta }: CtaBarProps) {
  return (
    <footer className="cta-bar">
      <p className="cta-copy">
        You’ve previewed one step. In Svivva you can run the full workflow with versioning, collaboration, cost tracking, and production-ready exports. Try Svivva free.
      </p>
      <button type="button" className="cta-btn" onClick={onPrimaryCta}>
        Try Svivva free
      </button>
    </footer>
  )
}
