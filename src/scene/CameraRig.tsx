import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { isPanelOpen, useStage } from '../store/useStage'
import {
  ENVELOPE,
  HOME_P,
  cancelFly,
  enterJourney,
  isCameraBusy,
  journey,
  markEntered,
  nearestProgress,
  rig,
  sampleJourney,
  syncCameraToStore,
} from './cameraState'
import { attachInput, input } from './input'
import { damp, mood } from './mood'

const UP = new THREE.Vector3(0, 1, 0)
const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _sample = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 0, shiftX: 0, shiftY: 0 }
const sstep = THREE.MathUtils.smoothstep
/** Maximum journey progress per second (the full path in ~5s, roughly walking pace). */
const MAX_PATH_SPEED = 0.2
const lerp = THREE.MathUtils.lerp
const clamp = THREE.MathUtils.clamp

/** Points of interest whose lighting responds to where the camera is looking. */
const AREAS = {
  jersey: [-2.6, 1.7, -3.6],
  board: [2.0, 2.2, -3.9],
  desk: [3.45, 1.3, -3.5],
  window: [4.8, 2.25, -4.1],
} as const
const SECTION_AREA: Partial<Record<string, keyof typeof AREAS>> = {
  about: 'jersey',
  strategy: 'board',
  projects: 'desk',
  contact: 'window',
}

function attention(c: readonly [number, number, number], camX: number, camY: number, camZ: number): number {
  const dx = c[0] - camX
  const dy = c[1] - camY
  const dz = c[2] - camZ
  const len = Math.hypot(dx, dy, dz)
  const cos = (dx * _fwd.x + dy * _fwd.y + dz * _fwd.z) / len
  return sstep(cos, 0.8, 0.985) * (1 - sstep(len, 5.5, 14))
}

const root = typeof document !== 'undefined' ? document.documentElement : null
function setVar(name: string, value: number, cache: Record<string, number>) {
  if (!root || Math.abs((cache[name] ?? -1) - value) < 0.002) return
  cache[name] = value
  root.style.setProperty(name, value.toFixed(3))
}

/**
 * The scene's single camera controller. Priority, highest first:
 *   1. explicit navigation / object selection (a GSAP transition writes `rig`)
 *   2. the scroll journey (a spline sampled into `rig` while the pavilion is the focus)
 *   3. pointer / touch parallax, added on top of whatever the above produced
 * Nothing else writes the camera.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  const smooth = useRef({ x1: 0, y1: 0, x2: 0, y2: 0, lastX: 0, lastY: 0, energy: 0, weight: 0, scrollDusk: 0 })
  const lastStep = useRef(0)
  const varCache = useRef<Record<string, number>>({})

  useEffect(() => {
    if (useStage.getState().entered) markEntered()
    syncCameraToStore({ instant: true })
    return useStage.subscribe((s, prev) => {
      if (s.entered && !prev.entered) markEntered()
      if (
        s.entered !== prev.entered ||
        s.section !== prev.section ||
        s.jersey !== prev.jersey ||
        s.reducedMotion !== prev.reducedMotion
      ) {
        syncCameraToStore()
      }
    })
  }, [])

  // Viewport changes re-fit the current pose without animating.
  useEffect(() => {
    syncCameraToStore({ instant: true })
  }, [size.width, size.height])

  useEffect(() => attachInput(), [])

  useEffect(
    () => () => {
      cancelFly()
      gsap.killTweensOf(journey)
    },
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useStage.getState()
    const reduced = s.reducedMotion
    const homeMode = s.section === 'home'
    const sm = smooth.current

    /* ---- 1. Scroll journey ---------------------------------------------- */
    const delta = input.scrollDelta
    input.scrollDelta = 0
    if (homeMode && delta !== 0) {
      if (isCameraBusy()) {
        // Scrolling interrupts a return-to-room transition and resumes from where the camera is.
        cancelFly()
        if (s.entered) journey.p = journey.target = nearestProgress()
      }
      gsap.killTweensOf(journey)
      journey.direct = false
      if (reduced) {
        // Reduced motion: one discrete step per gesture, no travelling.
        const now = performance.now()
        if (Math.abs(delta) > 0.012 && now - lastStep.current > 450) {
          lastStep.current = now
          if (!s.entered) {
            if (delta > 0) enterJourney(true)
          } else {
            const idx = Math.round(journey.target / HOME_P) + (delta > 0 ? 1 : -1)
            journey.target = journey.p = clamp(idx * HOME_P, journey.min, 1)
          }
        }
      } else {
        journey.target = clamp(journey.target + delta, journey.min, 1)
      }
    }

    if (homeMode) {
      if (reduced || journey.direct) journey.p = journey.target
      else {
        // Eased follow with a speed governor: the camera has weight, and a big backlog of scroll
        // (or a slow frame) can never turn into a lurch. The whole path takes at least ~5s to cross.
        const diff = journey.target - journey.p
        const step = diff * (1 - Math.exp(-4.2 * dt))
        const cap = MAX_PATH_SPEED * dt
        journey.p += clamp(step, -cap, cap)
        if (Math.abs(journey.target - journey.p) < 1e-4) journey.p = journey.target
      }
      if (!s.entered && journey.p >= HOME_P - 0.004) s.enter()
      if (!isCameraBusy()) {
        sampleJourney(journey.p, _sample)
        rig.px = _sample.px
        rig.py = _sample.py
        rig.pz = _sample.pz
        rig.lx = _sample.lx
        rig.ly = _sample.ly
        rig.lz = _sample.lz
        rig.fov = _sample.fov
        rig.shiftX = _sample.shiftX
        rig.shiftY = _sample.shiftY
      }
    }

    // Intro dissolves as the camera glides in; the room's light comes up with it.
    if (!s.entered) mood.reveal = sstep(journey.p, 0, HOME_P)
    setVar('--journey', clamp((journey.p - HOME_P) / (1 - HOME_P), 0, 1), varCache.current)

    /* ---- 2. Pointer / touch parallax: heavy, damped, two-stage ----------- */
    const focusDist = Math.hypot(rig.px - rig.lx, rig.py - rig.ly, rig.pz - rig.lz)
    const k = sstep(focusDist, 2.5, 9)
    const ampX = lerp(0.15, 0.4, k)
    const ampY = lerp(0.08, 0.2, k)
    const lookX = lerp(0.15, 0.35, k)
    const lookY = lerp(0.05, 0.15, k)

    // Quick pointer movement briefly strengthens the response; it relaxes once the pointer rests.
    const speed = Math.min(4, Math.hypot(input.x - sm.lastX, input.y - sm.lastY) / Math.max(dt, 1e-3))
    sm.lastX = input.x
    sm.lastY = input.y
    sm.energy = damp(sm.energy, speed, speed > sm.energy ? 10 : 2.2, dt)
    const gain = 1 + 0.16 * Math.min(sm.energy, 2.5)

    let w = reduced ? 0 : 1
    if (s.section === 'about' && s.jersey === 'cleaning') w = 0 // never move the view under the brush
    else {
      if (isPanelOpen(s)) w *= 0.5
      if (isCameraBusy()) w *= 0.25
      if (input.touch) w *= 0.6
    }
    sm.weight = damp(sm.weight, w, 3.5, dt)

    // Cascade of two critically-damped stages: soft start, soft settle, no overshoot.
    sm.x1 = damp(sm.x1, input.x, 7, dt)
    sm.y1 = damp(sm.y1, input.y, 7, dt)
    sm.x2 = damp(sm.x2, sm.x1, 4, dt)
    sm.y2 = damp(sm.y2, sm.y1, 4, dt)

    _fwd.set(rig.lx - rig.px, rig.ly - rig.py, rig.lz - rig.pz).normalize()
    _right.crossVectors(_fwd, UP).normalize()
    _up.crossVectors(_right, _fwd)

    // Mouse left → the camera slides right (revealing right-hand faces) while the look target follows
    // more slowly, so the lens turns back towards the subject. Translation dominates: near objects
    // slide further across the frame than the back wall, which is what makes it read as real depth.
    const offR = -sm.x2 * ampX * gain * sm.weight
    const offU = sm.y2 * ampY * gain * sm.weight
    const lookR = -sm.x2 * lookX * 0.55 * sm.weight
    const lookU = sm.y2 * lookY * 0.55 * sm.weight

    const px = clamp(rig.px + _right.x * offR + _up.x * offU, ENVELOPE.x0, ENVELOPE.x1)
    const py = clamp(rig.py + _right.y * offR + _up.y * offU, ENVELOPE.y0, ENVELOPE.y1)
    const pz = clamp(rig.pz + _right.z * offR + _up.z * offU, ENVELOPE.z0, ENVELOPE.z1)
    camera.position.set(px, py, pz)
    camera.lookAt(
      rig.lx + _right.x * lookR + _up.x * lookU,
      rig.ly + _right.y * lookR + _up.y * lookU,
      rig.lz + _right.z * lookR + _up.z * lookU,
    )

    if (Math.abs(camera.fov - rig.fov) > 0.001) {
      camera.fov = rig.fov
      camera.updateProjectionMatrix()
    }
    const w0 = state.size.width
    const h0 = state.size.height
    if (Math.abs(rig.shiftX) > 1e-4 || Math.abs(rig.shiftY) > 1e-4) {
      camera.setViewOffset(w0, h0, rig.shiftX * w0, rig.shiftY * h0, w0, h0)
    } else if (camera.view?.enabled) {
      camera.clearViewOffset()
    }
    // Everything after us (hotspots, dust) projects through an up-to-date matrix.
    camera.updateMatrixWorld()

    /* ---- 3. Lighting follows attention ---------------------------------- */
    _fwd.set(0, 0, -1).applyQuaternion(camera.quaternion)
    const focusedArea = SECTION_AREA[s.section]
    const duskTarget = homeMode && s.entered ? 0.55 * sstep(journey.p, 0.82, 1) : 0
    sm.scrollDusk = damp(sm.scrollDusk, duskTarget, 2.5, dt)
    mood.dusk = Math.min(1, mood.twilight + sm.scrollDusk)
    for (const name of Object.keys(AREAS) as (keyof typeof AREAS)[]) {
      const target = focusedArea === name ? 1 : attention(AREAS[name], px, py, pz)
      mood.area[name] = damp(mood.area[name], target, 3, dt)
    }

    // Dev-only readout used by the browser tests; compiled out of production builds.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __cam?: unknown }).__cam = {
        pos: [px, py, pz],
        p: journey.p,
        target: journey.target,
        busy: isCameraBusy(),
        weight: sm.weight,
        area: { ...mood.area },
        dusk: mood.dusk,
        input: { x: input.x, y: input.y, touch: input.touch, x2: sm.x2 },
      }
    }
  })

  return null
}
