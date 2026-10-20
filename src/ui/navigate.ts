import type { SectionId } from '../data/sections'
import { goTo } from '../hooks/useSceneNavigation'
import { useStage } from '../store/useStage'

/** Navigate in whichever mode is active: camera journey in 3D, smooth scroll in the standard layout. */
export function navigate(section: SectionId, opts: { keepJourney?: boolean } = {}): void {
  if (useStage.getState().immersive) {
    goTo(section, opts)
    return
  }
  const el = document.getElementById(`section-${section}`)
  const reduced = useStage.getState().reducedMotion
  if (el) {
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
  } else {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }
}
