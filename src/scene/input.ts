import { useStage } from '../store/useStage'
import { enterJourney } from './cameraState'

/**
 * Raw visitor input, kept outside React so high-frequency events never cause a
 * re-render. The camera controller reads and smooths these once per frame.
 */
export const input = {
  /** Pointer position in normalised device coordinates (-1..1, y up). */
  x: 0,
  y: 0,
  /** True when the last input came from a finger rather than a mouse. */
  touch: false,
  /** A pointer button / finger is currently down. */
  pressed: false,
  /** Scroll progress requested since the last frame, in journey units. */
  scrollDelta: 0,
}

/** Journey progress per wheel pixel: roughly 2,800px of scrolling covers the whole room. */
const WHEEL_TO_PROGRESS = 1 / 2800
/** Journey progress per pixel of vertical swipe, relative to the viewport height. */
const SWIPE_VIEWPORTS = 2.0

function normaliseWheel(e: WheelEvent): number {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
  // A single mouse-wheel notch is ~100px; cap it so one flick never skips a whole phase.
  return Math.max(-140, Math.min(140, e.deltaY * unit))
}

function cleaningNow(): boolean {
  const s = useStage.getState()
  return s.section === 'about' && s.jersey === 'cleaning'
}

/** Whether the scroll journey is currently the thing wheel / swipe should drive. */
export function scrollOwnsInput(): boolean {
  const s = useStage.getState()
  return s.section === 'home'
}

/** Wires wheel, mouse and touch input. Returns a cleanup function. */
export function attachInput(): () => void {
  const ndc = (e: PointerEvent) => {
    input.x = (e.clientX / window.innerWidth) * 2 - 1
    input.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || !scrollOwnsInput()) return
    // Panels and the mobile menu scroll natively.
    if ((e.target as Element | null)?.closest('.panel.is-open, .nav__sheet')) return
    input.scrollDelta += normaliseWheel(e) * WHEEL_TO_PROGRESS
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    input.touch = false
    ndc(e)
  }
  const onPointerDown = (e: PointerEvent) => {
    input.pressed = true
    if (e.pointerType !== 'touch') ndc(e)
  }
  const onPointerUp = () => {
    input.pressed = false
  }
  const onLeave = (e: MouseEvent) => {
    // Pointer left the window: ease back to the neutral framing.
    if (!e.relatedTarget) {
      input.x = 0
      input.y = 0
    }
  }

  // Touch: a horizontal drag leans the camera, a vertical swipe moves along the path.
  let touchId = -1
  let sx = 0
  let sy = 0
  let lastY = 0
  let axis: 'none' | 'h' | 'v' = 'none'
  const onTouchDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || touchId !== -1 || cleaningNow()) return
    // Gestures may start anywhere on the scene (including on a hotspot), but not on panels or menus.
    if ((e.target as Element | null)?.closest('.panel, .nav, .controls, .hud')) return
    touchId = e.pointerId
    sx = lastY = 0
    sx = e.clientX
    sy = e.clientY
    lastY = e.clientY
    axis = 'none'
    input.touch = true
  }
  const onTouchMove = (e: PointerEvent) => {
    if (e.pointerId !== touchId) return
    if (cleaningNow()) return
    const dx = e.clientX - sx
    const dy = e.clientY - sy
    if (axis === 'none' && Math.hypot(dx, dy) > 8) axis = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h'
    if (axis === 'v' && scrollOwnsInput()) {
      input.scrollDelta += (-(e.clientY - lastY) / (window.innerHeight * SWIPE_VIEWPORTS)) * 1
    } else if (axis === 'h') {
      input.x = Math.max(-1, Math.min(1, dx / (window.innerWidth * 0.35)))
      input.y = Math.max(-1, Math.min(1, -dy / (window.innerHeight * 0.35)))
    }
    lastY = e.clientY
  }
  const onTouchUp = (e: PointerEvent) => {
    if (e.pointerId !== touchId) return
    touchId = -1
    axis = 'none'
    input.x = 0
    input.y = 0
  }

  // Keyboard users can step inside without a mouse or touch screen.
  const onKey = (e: KeyboardEvent) => {
    const s = useStage.getState()
    if (s.entered || s.section !== 'home') return
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
      if ((e.target as Element | null)?.closest('button, a, input')) return
      e.preventDefault()
      enterJourney(false)
    }
  }

  window.addEventListener('keydown', onKey)
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerUp, { passive: true })
  document.documentElement.addEventListener('mouseout', onLeave)
  window.addEventListener('pointerdown', onTouchDown, { passive: true })
  window.addEventListener('pointermove', onTouchMove, { passive: true })
  window.addEventListener('pointerup', onTouchUp, { passive: true })
  window.addEventListener('pointercancel', onTouchUp, { passive: true })
  return () => {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    document.documentElement.removeEventListener('mouseout', onLeave)
    window.removeEventListener('pointerdown', onTouchDown)
    window.removeEventListener('pointermove', onTouchMove)
    window.removeEventListener('pointerup', onTouchUp)
    window.removeEventListener('pointercancel', onTouchUp)
  }
}
