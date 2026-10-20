/** Quiet progress cue for the scroll journey. Fill is driven by the --journey CSS variable (no React updates). */
export function JourneyMeter() {
  return (
    <div className="meter" aria-hidden="true">
      <span className="meter__label">Scroll to explore</span>
      <span className="meter__track">
        <span className="meter__fill" />
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <span key={t} className="meter__tick" style={{ left: `${t * 100}%` }} />
        ))}
      </span>
    </div>
  )
}
