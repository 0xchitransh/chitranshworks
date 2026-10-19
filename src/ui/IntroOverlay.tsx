import { useEffect } from 'react'
import { profile } from '../data/profile'
import { syncCameraToStore } from '../scene/cameraState'
import { useStage } from '../store/useStage'

function enterPavilion(instant: boolean) {
  useStage.getState().enter()
  if (instant) syncCameraToStore({ instant: true })
}

/** First view: identity, one primary action, and an always-available skip. */
export function IntroOverlay() {
  const entered = useStage((s) => s.entered)
  const ready = useStage((s) => s.sceneReady)

  // Scrolling or swiping up also moves into the room.
  useEffect(() => {
    if (entered || !ready) return
    let touchY = 0
    const wheel = (e: WheelEvent) => {
      if (e.deltaY > 8) enterPavilion(false)
    }
    const start = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const end = (e: TouchEvent) => {
      if (touchY - e.changedTouches[0].clientY > 40) enterPavilion(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') enterPavilion(false)
    }
    window.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchend', end)
      window.removeEventListener('keydown', key)
    }
  }, [entered, ready])

  return (
    <section className={`intro${entered ? ' is-gone' : ''}${ready ? ' is-ready' : ''}`} aria-label="Introduction" aria-hidden={entered}>
      <div className="intro__inner">
        <p className="eyebrow intro__eyebrow">The Pavilion</p>
        <h1 className="intro__name">{profile.name}</h1>
        <p className="intro__tagline">“{profile.tagline}”</p>
        <p className="intro__roles">{profile.roles.slice(0, 3).join(' · ')}</p>
        <div className="intro__actions">
          <button type="button" className="btn btn--primary btn--lg" tabIndex={entered ? -1 : 0} onClick={() => enterPavilion(false)}>
            Enter the pavilion
          </button>
          <button type="button" className="btn btn--ghost" tabIndex={entered ? -1 : 0} onClick={() => enterPavilion(true)}>
            Skip intro
          </button>
        </div>
        <p className="intro__hint" aria-hidden="true">
          Scroll or swipe to step inside
        </p>
      </div>
    </section>
  )
}
