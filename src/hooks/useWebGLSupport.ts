import { useEffect } from 'react'
import { useStage, type Quality } from '../store/useStage'

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

export function detectQuality(): Quality {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 760
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  if ((coarse && narrow) || cores <= 2 || memory <= 2) return 'low'
  if (coarse || narrow || cores <= 4 || memory <= 4) return 'medium'
  return 'high'
}

/** Decides at start-up whether the immersive scene can run and at which quality tier. */
export function useCapabilityCheck(): void {
  useEffect(() => {
    const ok = detectWebGL()
    const { setWebgl, setImmersive, setQuality } = useStage.getState()
    setWebgl(ok ? 'ok' : 'failed')
    setQuality(detectQuality())
    if (!ok) setImmersive(false)
  }, [])
}
