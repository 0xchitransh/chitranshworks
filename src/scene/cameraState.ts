import gsap from 'gsap'
import * as THREE from 'three'
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

/* -------------------------------------------------------------------------- */
/* Scroll journey: one continuous spline through the room                      */
/* -------------------------------------------------------------------------- */

/**
 * Keyframes along the scroll path. They are spaced evenly on the spline
 * (t = i / 5), so progress 0 = intro, 0.2 = pavilion, 0.4 = jersey, 0.6 = strategy
 * board, 0.8 = workstation, 1 = window. The camera travels through the room on a
 * Catmull-Rom curve, so nearby objects pass at a different rate from the back wall.
 */
export const JOURNEY_KEYS: Pose[] = [
  POSES.intro,
  POSES.home,
  { pos: [-2.0, 1.85, 0.8], look: [-2.6, 1.7, -3.6], fov: 40, w: 3.4, h: 2.6 },
  { pos: [1.3, 2.05, 0.5], look: [2.0, 2.1, -3.9], fov: 40, w: 3.8, h: 2.7 },
  { pos: [3.0, 1.75, 0.6], look: [3.6, 1.2, -3.5], fov: 38, w: 3.4, h: 2.5 },
  { pos: [4.0, 2.0, -0.3], look: [4.8, 2.3, -4.5], fov: 44, w: 3.8, h: 3.1 },
]
export const HOME_P = 1 / (JOURNEY_KEYS.length - 1)

/** Scroll state. `target` is where input wants to be; `p` is the smoothed camera position on the path. */
export const journey = {
  p: 0,
  target: 0,
  /** Lowest reachable progress (the intro is not revisited once entered). */
  min: 0,
  /** While true a programmatic tween owns `target` and `p` follows it exactly. */
  direct: false,
}

/**
 * The room as the camera sees it: a conservative envelope that keeps the lens
 * clear of the walls, the locker bank, the desk and every prop, whatever the
 * pointer or scroll inputs add on top of the authored path.
 */
export const ENVELOPE = { x0: -5.3, x1: 5.3, y0: 1.2, y1: 3.6, z0: -2.8, z1: 9.6 }

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _misc = new THREE.Vector3()
let curves: { pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3; misc: THREE.CatmullRomCurve3 } | null = null
let curveKey = ''

function ensureJourney(): void {
  const key = `${window.innerWidth}x${window.innerHeight}`
  if (curves && key === curveKey) return
  const fitted = JOURNEY_KEYS.map((pose, i) => fitPose(pose, computeLayout(false, i >= 2)))
  curves = {
    pos: new THREE.CatmullRomCurve3(fitted.map((f) => new THREE.Vector3(f.px, f.py, f.pz)), false, 'centripetal'),
    look: new THREE.CatmullRomCurve3(fitted.map((f) => new THREE.Vector3(f.lx, f.ly, f.lz)), false, 'centripetal'),
    misc: new THREE.CatmullRomCurve3(fitted.map((f) => new THREE.Vector3(f.fov, f.shiftX, f.shiftY)), false, 'centripetal'),
  }
  curveKey = key
}

/** Writes the camera at journey progress `progress` into `out`. */
export function sampleJourney(progress: number, out: Target): Target {
  ensureJourney()
  const t = Math.min(1, Math.max(0, progress))
  curves!.pos.getPoint(t, _pos)
  curves!.look.getPoint(t, _look)
  curves!.misc.getPoint(t, _misc)
  out.px = _pos.x
  out.py = _pos.y
  out.pz = _pos.z
  out.lx = _look.x
  out.ly = _look.y
  out.lz = _look.z
  out.fov = _misc.x
  out.shiftX = _misc.y
  out.shiftY = _misc.z
  return out
}

/** Progress along the path whose camera is closest to the current rig (used to resume scrolling without a jump). */
export function nearestProgress(): number {
  const probe: Target = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 0, shiftX: 0, shiftY: 0 }
  let best = HOME_P
  let bestD = Infinity
  for (let i = 0; i <= 80; i++) {
    const t = HOME_P + ((1 - HOME_P) * i) / 80
    sampleJourney(t, probe)
    const d =
      (probe.px - rig.px) ** 2 + (probe.py - rig.py) ** 2 + (probe.pz - rig.pz) ** 2 +
      0.5 * ((probe.lx - rig.lx) ** 2 + (probe.ly - rig.ly) ** 2 + (probe.lz - rig.lz) ** 2)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best
}

/* -------------------------------------------------------------------------- */
/* Transitions                                                                 */
/* -------------------------------------------------------------------------- */

let activeTween: gsap.core.Tween | null = null
let busy = false

/** True while a deliberate transition (navigation / object selection) owns the camera. */
export function isCameraBusy(): boolean {
  return busy
}

/** Stops the running transition and hands the camera back to the scroll journey. */
export function cancelFly(): void {
  activeTween?.kill()
  activeTween = null
  busy = false
}

export interface FlyOptions {
  /** Force an instant move (resize, reduced motion). */
  instant?: boolean
  duration?: number
}

const _home: Target = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 0, shiftX: 0, shiftY: 0 }

/**
 * The only function that animates the rig between authored poses. Interruptible:
 * a new call retargets from the current state. The pavilion / intro views are
 * simply points on the journey path, so returning home lands exactly where the
 * scroll position says the camera belongs.
 */
export function flyTo(key: PoseKey, panelOpen: boolean, opts: FlyOptions = {}): void {
  let t: Target
  if (key === 'home' || key === 'intro') {
    journey.direct = false
    gsap.killTweensOf(journey)
    journey.p = journey.target = key === 'intro' ? Math.min(journey.target, HOME_P) : Math.max(journey.target, journey.min)
    t = { ...sampleJourney(journey.target, _home) }
  } else {
    t = fitPose(POSES[key], computeLayout(panelOpen, true, key === 'jerseyClean'))
  }
  const reduced = useStage.getState().reducedMotion
  activeTween?.kill()
  activeTween = null

  if (opts.instant || reduced) {
    Object.assign(rig, t)
    busy = false
    return
  }
  const dist = Math.hypot(t.px - rig.px, t.py - rig.py, t.pz - rig.pz)
  const duration = opts.duration ?? gsap.utils.clamp(0.8, 1.5, 0.7 + dist * 0.12)
  busy = true
  activeTween = gsap.to(rig, {
    ...t,
    duration,
    ease: 'power3.inOut',
    overwrite: true,
    onComplete: () => {
      busy = false
      activeTween = null
    },
  })
}

let lastKey: PoseKey | null = null

/** Convenience: move the camera to wherever the current store state says it belongs. */
export function syncCameraToStore(opts: FlyOptions = {}): void {
  const s = useStage.getState()
  const key = poseKeyFor(s)
  const fromJourney = lastKey === null ? false : lastKey === 'home' || lastKey === 'intro'
  lastKey = key
  // Moving between intro and pavilion is the scroll journey's job, not a tween.
  if ((key === 'home' || key === 'intro') && fromJourney && !opts.instant) return
  flyTo(key, isPanelOpen(s), opts)
}

/** Brings the journey up to date after the intro has been passed by any route. */
export function markEntered(): void {
  journey.min = HOME_P
  if (journey.target < HOME_P) journey.target = HOME_P
  if (journey.p < HOME_P) journey.p = HOME_P
}

/** Enter the pavilion: animate (default) or jump. */
export function enterJourney(instant: boolean): void {
  const store = useStage.getState()
  gsap.killTweensOf(journey)
  if (instant || store.reducedMotion) {
    journey.direct = false
    journey.target = journey.p = HOME_P
    store.enter()
    return
  }
  journey.direct = true
  gsap.to(journey, {
    target: HOME_P,
    duration: 1.7,
    ease: 'power2.inOut',
    onUpdate: () => {
      journey.p = journey.target
    },
    onComplete: () => {
      journey.direct = false
    },
  })
}
