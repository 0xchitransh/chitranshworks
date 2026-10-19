import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { isPanelOpen, useStage } from '../store/useStage'
import { rig, syncCameraToStore } from './cameraState'
import { damp } from './mood'

/**
 * Applies the shared camera rig to the real camera. This is the only per-frame
 * camera writer; `flyTo` (GSAP) only mutates the rig object.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const dom = useThree((s) => s.gl.domElement)
  const par = useRef({ x: 0, y: 0 })
  const lastFov = useRef(0)
  const noHover = useRef(typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches)

  useEffect(() => {
    syncCameraToStore({ instant: true })
    return useStage.subscribe((s, prev) => {
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

  // Touch: horizontal drag looks around the room on the home view.
  useEffect(() => {
    let startX = 0
    let startPan = 0
    let active = false
    const down = (e: PointerEvent) => {
      const s = useStage.getState()
      if (e.pointerType !== 'touch' || !s.entered || s.section !== 'home') return
      active = true
      startX = e.clientX
      startPan = rig.panX
    }
    const move = (e: PointerEvent) => {
      if (!active) return
      rig.panX = THREE.MathUtils.clamp(startPan - (e.clientX - startX) * 0.012, -3.2, 4.2)
    }
    const up = () => {
      active = false
    }
    dom.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      dom.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [dom])

  useFrame((state, dt) => {
    const s = useStage.getState()
    const cleaning = s.jersey === 'cleaning' && s.section === 'about'
    const still = s.reducedMotion || noHover.current || cleaning
    const tx = still ? 0 : state.pointer.x
    const ty = still ? 0 : state.pointer.y
    const panelDamp = isPanelOpen(s) ? 0.5 : 1
    par.current.x = damp(par.current.x, tx * panelDamp, 3, dt)
    par.current.y = damp(par.current.y, ty * panelDamp, 3, dt)

    const dist = Math.hypot(rig.px - rig.lx, rig.py - rig.ly, rig.pz - rig.lz)
    const amp = THREE.MathUtils.clamp(dist * 0.03, 0.06, 0.3)
    const pan = s.section === 'home' ? rig.panX : 0
    camera.position.set(rig.px + pan + par.current.x * amp, rig.py + par.current.y * amp * 0.5, rig.pz)
    camera.lookAt(rig.lx + pan, rig.ly, rig.lz)

    if (Math.abs(camera.fov - rig.fov) > 0.001 || lastFov.current !== rig.fov) {
      camera.fov = rig.fov
      lastFov.current = rig.fov
      camera.updateProjectionMatrix()
    }
    const w = state.size.width
    const h = state.size.height
    if (Math.abs(rig.shiftX) > 1e-4 || Math.abs(rig.shiftY) > 1e-4) {
      camera.setViewOffset(w, h, rig.shiftX * w, rig.shiftY * h, w, h)
    } else if (camera.view?.enabled) {
      camera.clearViewOffset()
    }
  })

  return null
}
