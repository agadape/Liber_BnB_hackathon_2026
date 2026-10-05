export function GhostJourney({ steps, current }: { steps: readonly string[]; current: number }) {
  return <ol className="ghost-journey ghost-no-print" aria-label="Your progress">
    {steps.map((label, index) => <li key={label} data-state={index < current ? "complete" : index === current ? "current" : "next"} aria-current={index === current ? "step" : undefined}>
      <span className="ghost-journey-number" aria-hidden="true">{index < current ? "✓" : index + 1}</span>
      <span>{label}</span>
      <span className="sr-only">{index < current ? ", completed" : index === current ? ", current step" : ", upcoming"}</span>
    </li>)}
  </ol>;
}
