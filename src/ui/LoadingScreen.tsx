import { useEffect, useState } from 'react'
import { useStage } from '../store/useStage'

/** Branded loading state. The bar is indeterminate on purpose: there is no real percentage to show. */
export function LoadingScreen() {
  const ready = useStage((s) => s.sceneReady)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => setGone(true), 700)
    return () => window.clearTimeout(id)
  }, [ready])

  if (gone) return null
  return (
    <div className={`loading${ready ? ' is-done' : ''}`} role="status" aria-live="polite">
      <span className="loading__mark" aria-hidden="true">
        C.
      </span>
      <p className="loading__text">{ready ? 'Ready' : 'Setting up the dressing room'}</p>
      <span className="loading__bar" aria-hidden="true">
        <i />
      </span>
    </div>
  )
}
