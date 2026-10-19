import { useStage } from '../store/useStage'

/** Sound toggle, reduced-motion toggle and the exit to the standard layout. */
export function Controls() {
  const soundOn = useStage((s) => s.soundOn)
  const setSoundOn = useStage((s) => s.setSoundOn)
  const reduced = useStage((s) => s.reducedMotion)
  const setReduced = useStage((s) => s.setReducedMotion)
  const setImmersive = useStage((s) => s.setImmersive)

  return (
    <div className="controls" role="group" aria-label="Experience settings">
      <button
        type="button"
        className="ctl"
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'}
        onClick={() => setSoundOn(!soundOn)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
          {soundOn ? <path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
        </svg>
        <span className="ctl__label">Sound</span>
      </button>
      <button
        type="button"
        className="ctl"
        aria-pressed={reduced}
        aria-label={reduced ? 'Reduced motion on. Turn it off' : 'Reduced motion off. Turn it on'}
        onClick={() => setReduced(!reduced, true)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="12" cy="12" r="8" />
          <path d={reduced ? 'M9 12h6' : 'M8 12h8M12 8v8'} />
        </svg>
        <span className="ctl__label">Reduce motion</span>
      </button>
      <button
        type="button"
        className="ctl"
        aria-label="Exit immersive mode and view the standard portfolio"
        onClick={() => setImmersive(false)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 10h8M8 14h5" />
        </svg>
        <span className="ctl__label">View as page</span>
      </button>
    </div>
  )
}
