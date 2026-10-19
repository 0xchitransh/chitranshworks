import { useEffect } from 'react'
import { useStage } from '../store/useStage'

/** Mirrors the OS-level setting into the store until the visitor overrides it manually. */
export function useSyncReducedMotion(): void {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      const { reducedMotionManual, setReducedMotion } = useStage.getState()
      if (!reducedMotionManual) setReducedMotion(mq.matches)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const reduced = useStage((s) => s.reducedMotion)
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced ? 'true' : 'false'
  }, [reduced])
}

export function useReducedMotion(): boolean {
  return useStage((s) => s.reducedMotion)
}
