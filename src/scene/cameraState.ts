import gsap from 'gsap'
import { MOBILE_BREAKPOINT, RAIL_BREAKPOINT, RAIL_WIDTH } from '../hooks/useViewport'
import { isPanelOpen, useStage } from '../store/useStage'

type V3 = [number, number, number]

export interface Pose {
  pos: V3
  look: V3
  fov: number
  /** World-space extent (metres) around `look` that should stay visible. */
  w: number
  h: number
}

export type PoseKey =
  | 'intro'
  | 'home'
  | 'jerseyDusty'
  | 'jerseyClean'
  | 'jerseyRestored'
  | 'skills'
  | 'projects'
  | 'strategy'
  | 'journey'
  | 'achievements'
  | 'contact'

/**
 * Every camera destination in one place. The room runs from z = -4 (back wall)
 * towards +z (the entrance); the camera always looks into the room.
 */
export const POSES: Record<PoseKey, Pose> = {
  intro: { pos: [1.6, 2.05, 9.4], look: [0.4, 1.55, -3.5], fov: 42, w: 10, h: 4 },
  home: { pos: [0.5, 1.85, 5.1], look: [0.3, 1.5, -3.5], fov: 46, w: 10.5, h: 4 },
  jerseyDusty: { pos: [-2.45, 1.8, -0.35], look: [-2.6, 1.72, -3.6], fov: 36, w: 2.1, h: 1.7 },
  jerseyClean: { pos: [-2.6, 1.76, -0.9], look: [-2.6, 1.72, -3.6], fov: 34, w: 1.75, h: 1.45 },
  jerseyRestored: { pos: [-2.55, 1.74, -1.25], look: [-2.6, 1.72, -3.6], fov: 34, w: 1.75, h: 1.45 },
  skills: { pos: [0.9, 1.5, 1.2], look: [0.2, 0.3, -1.0], fov: 40, w: 2.3, h: 1.4 },
  projects: { pos: [3.45, 1.6, -0.9], look: [3.3, 1.18, -3.5], fov: 34, w: 2.0, h: 1.4 },
  strategy: { pos: [2.0, 2.1, -0.4], look: [2.0, 2.18, -3.9], fov: 36, w: 2.5, h: 1.75 },
  journey: { pos: [-4.1, 2.15, -0.3], look: [-4.3, 2.0, -3.6], fov: 40, w: 3.3, h: 2.4 },
  achievements: { pos: [-0.4, 2.05, -0.8], look: [-0.4, 2.0, -3.8], fov: 36, w: 2.3, h: 1.7 },
  contact: { pos: [4.3, 2.05, -1.3], look: [4.8, 2.3, -4.2], fov: 42, w: 3.0, h: 2.6 },
}

/** Mutable camera state. Only `CameraRig` reads it every frame; only `flyTo` writes it. */
export const rig = {
  px: POSES.intro.pos[0],
  py: POSES.intro.pos[1],
  pz: POSES.intro.pos[2],
  lx: POSES.intro.look[0],
  ly: POSES.intro.look[1],
  lz: POSES.intro.look[2],
  fov: POSES.intro.fov,
  /** Fraction of viewport size the view window is shifted by (keeps subject clear of the panel). */
  shiftX: 0,
  shiftY: 0,
  /** Horizontal look offset for drag-to-look on touch devices (home view only). */
  panX: 0,
}

export interface Layout {
  width: number
  height: number
  mobile: boolean
  aspect: number
  /** Fraction of the viewport still free for the 3D subject. */
  freeW: number
  freeH: number
  shiftX: number
  shiftY: number
}

export function computeLayout(panelOpen: boolean, focused: boolean, hudBelow = false): Layout {
  const width = window.innerWidth
  const height = window.innerHeight
  const mobile = width < MOBILE_BREAKPOINT
  const rail = focused && width >= RAIL_BREAKPOINT ? RAIL_WIDTH : 0
  const panel = panelOpen && !mobile ? Math.min(560, width * 0.42) : 0
  let freeH = 1
  let shiftY = 0
  if (panelOpen && mobile) {
    freeH = 0.46
    shiftY = 0.27
  } else if (hudBelow && width < RAIL_BREAKPOINT) {
    // The cleaning prompt sits along the bottom edge on narrow screens: lift the jersey clear of it.
    freeH = 0.6
    shiftY = 0.2
  }
  const freeW = 1 - (rail + panel) / width
  // Centre the subject in the space between the rail and the panel.
  const shiftX = (panel - rail) / 2 / width
  return { width, height, mobile, aspect: width / height, freeW, freeH, shiftX, shiftY }
}

export function poseKeyFor(state: {
  entered: boolean
  section: string
  jersey: string
}): PoseKey {
  if (!state.entered) return 'intro'
  switch (state.section) {
    case 'about':
      if (state.jersey === 'restored') return 'jerseyRestored'
      return state.jersey === 'cleaning' ? 'jerseyClean' : 'jerseyDusty'
    case 'skills':
    case 'projects':
    case 'strategy':
    case 'journey':
    case 'achievements':
    case 'contact':
      return state.section
    default:
      return 'home'
  }
}

interface Target {
  px: number
  py: number
  pz: number
  lx: number
  ly: number
  lz: number
  fov: number
  shiftX: number
  shiftY: number
}

/** Fits a pose to the current viewport so the subject is never cropped on narrow screens. */
export function fitPose(pose: Pose, layout: Layout): Target {
  const { aspect, freeW, freeH, mobile } = layout
  let fov = pose.fov
  if (aspect < 1) fov = Math.min(68, fov * (1 + (1 - aspect) * 0.55))
  const halfTan = Math.tan((fov * Math.PI) / 360)
  const dx = pose.pos[0] - pose.look[0]
  const dy = pose.pos[1] - pose.look[1]
  const dz = pose.pos[2] - pose.look[2]
  const base = Math.hypot(dx, dy, dz)
  const needW = pose.w / (2 * halfTan * aspect * freeW)
  const needH = pose.h / (2 * halfTan * freeH)
  // Home / intro are wide establishing shots: on phones keep a constrained view instead of zooming out.
  const establishing = pose === POSES.home || pose === POSES.intro
  const needed = establishing && mobile ? 0 : Math.max(needW, needH)
  const d = Math.max(base, needed)
  const k = d / base
  return {
    px: pose.look[0] + dx * k,
    py: pose.look[1] + dy * k,
    pz: pose.look[2] + dz * k,
    lx: pose.look[0],
    ly: pose.look[1],
    lz: pose.look[2],
    fov,
    shiftX: layout.shiftX,
    shiftY: layout.shiftY,
  }
}

let activeTween: gsap.core.Tween | null = null

export interface FlyOptions {
  /** Force an instant move (resize, reduced motion). */
  instant?: boolean
  duration?: number
}

/** The only function that animates the camera. Interruptible: a new call retargets from the current state. */
export function flyTo(key: PoseKey, panelOpen: boolean, opts: FlyOptions = {}): void {
  const layout = computeLayout(panelOpen, key !== 'home' && key !== 'intro', key === 'jerseyClean')
  const t = fitPose(POSES[key], layout)
  const reduced = useStage.getState().reducedMotion
  activeTween?.kill()
  activeTween = null

  if (key !== 'home') rig.panX = 0

  if (opts.instant || reduced) {
    Object.assign(rig, t)
    return
  }
  const dist = Math.hypot(t.px - rig.px, t.py - rig.py, t.pz - rig.pz)
  const duration = opts.duration ?? gsap.utils.clamp(0.8, 1.5, 0.7 + dist * 0.12)
  activeTween = gsap.to(rig, {
    ...t,
    duration,
    ease: 'power3.inOut',
    overwrite: true,
  })
}

/** Convenience: fly to wherever the current store state says the camera belongs. */
export function syncCameraToStore(opts: FlyOptions = {}): void {
  const s = useStage.getState()
  flyTo(poseKeyFor(s), isPanelOpen(s), opts)
}
