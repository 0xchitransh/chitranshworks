import gsap from 'gsap'
import { useStage } from '../store/useStage'

/**
 * Lighting "mood" shared by every light and emissive in the scene. Mutable on
 * purpose: it is read inside frame loops and tweened by GSAP, never React state.
 */
export const mood = {
  /** 0 = dim pavilion before entering, 1 = full dusk amber. */
  reveal: 0,
  /** 0 = warm indoor amber, 1 = cool stadium twilight. */
  twilight: 0,
  /** Extra brightness once the jersey has been restored. */
  lift: 0,
  /** Local emphasis on the current subject (jersey / board / desk...). */
  focus: 0,
}

let tweens: gsap.core.Tween[] = []

export function syncMoodToStore(): void {
  const s = useStage.getState()
  const reduced = s.reducedMotion
  const target = {
    reveal: s.entered ? 1 : 0,
    twilight: s.entered && s.section === 'contact' ? 1 : 0,
    lift: s.jersey === 'restored' ? 1 : 0,
    focus: s.entered && s.section !== 'home' ? 1 : 0,
  }
  tweens.forEach((t) => t.kill())
  tweens = []
  if (reduced) {
    Object.assign(mood, target)
    return
  }
  tweens.push(
    gsap.to(mood, { reveal: target.reveal, duration: 1.6, ease: 'power2.out', overwrite: 'auto' }),
    gsap.to(mood, { twilight: target.twilight, duration: 2.2, ease: 'power2.inOut', overwrite: 'auto' }),
    gsap.to(mood, { lift: target.lift, duration: 2.0, ease: 'power2.out', overwrite: 'auto' }),
    gsap.to(mood, { focus: target.focus, duration: 1.0, ease: 'power2.out', overwrite: 'auto' }),
  )
}

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}
