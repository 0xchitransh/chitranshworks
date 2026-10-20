import { useEffect, useRef } from 'react'
import { goTo } from '../hooks/useSceneNavigation'
import { rig } from '../scene/cameraState'
import { finishJersey, RESTORE_THRESHOLD } from '../scene/Jersey'
import { useStage } from '../store/useStage'

/** Brush cursor sized to the real brush footprint on screen. Mouse only. */
function BrushCursor() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        el.style.opacity = '0'
        return
      }
      const over = (e.target as HTMLElement | null)?.closest('canvas')
      el.style.opacity = over ? '1' : '0'
      const dist = Math.hypot(rig.px - rig.lx, rig.py - rig.ly, rig.pz - rig.lz)
      const px = (0.162 / (2 * dist * Math.tan((rig.fov * Math.PI) / 360))) * window.innerHeight
      el.style.width = el.style.height = `${Math.max(28, px)}px`
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return <div ref={ref} className="brush" aria-hidden="true" />
}

/** Prompt, progress and skip control shown while the jersey is being cleaned. */
export function JerseyHud() {
  const section = useStage((s) => s.section)
  const jersey = useStage((s) => s.jersey)
  const progress = useStage((s) => s.jerseyProgress)
  const active = section === 'about' && jersey === 'cleaning'
  if (!active) return null

  const done = progress >= 1
  // Shown relative to the completion threshold so 100% is exactly when the reveal triggers.
  const pct = done ? 100 : Math.min(99, Math.round((progress / RESTORE_THRESHOLD) * 100))

  return (
    <>
      <BrushCursor />
      <div className="hud" role="region" aria-label="Clean the jersey">
        {done ? (
          <p className="hud__reveal">The player behind the products.</p>
        ) : (
          <>
            <p className="eyebrow">The Player</p>
            <p className="hud__title">Remove the dust to reveal my journey.</p>
            <p className="hud__hint">
              <span className="hud__hint-fine">Hold the mouse button and wipe across the jersey.</span>
              <span className="hud__hint-touch">Drag a finger across the jersey.</span>
            </p>
            <div className="hud__progress">
              <span className="hud__pct" aria-live="off">
                Jersey restored — {pct}%
              </span>
              <span
                className="bar"
                role="progressbar"
                aria-label="Jersey restored"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <i style={{ width: `${pct}%` }} />
              </span>
            </div>
          </>
        )}
        <div className="hud__actions">
          <button type="button" className="btn btn--primary" onClick={() => finishJersey(true)} disabled={done}>
            Skip interaction
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => goTo('home', { keepJourney: true })}>
            Back
          </button>
        </div>
      </div>
    </>
  )
}
