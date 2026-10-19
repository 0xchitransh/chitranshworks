import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { useStage } from '../store/useStage'
import { SUN_FROM, WIN, ROOM } from './layout'
import { damp, mood, syncMoodToStore } from './mood'

const SUN_WARM = new THREE.Color('#ff9a4d')
const SUN_COOL = new THREE.Color('#7e97d4')
const SKY_WARM = new THREE.Color('#7b5a40')
const SKY_COOL = new THREE.Color('#3b4c78')

/** All practical + atmospheric lights. Their strength is driven by the shared `mood`. */
export function LightingRig() {
  const quality = useStage((s) => s.quality)
  const gl = useThree((s) => s.gl)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const locker = useRef<THREE.PointLight>(null)
  const shelf = useRef<THREE.PointLight>(null)
  const ceilL = useRef<THREE.PointLight>(null)
  const ceilR = useRef<THREE.PointLight>(null)
  const exposure = useRef(0.9)

  // Re-target the mood whenever navigation state changes.
  useEffect(() => {
    syncMoodToStore()
    return useStage.subscribe((s, prev) => {
      if (
        s.entered !== prev.entered ||
        s.section !== prev.section ||
        s.jersey !== prev.jersey ||
        s.reducedMotion !== prev.reducedMotion
      ) {
        syncMoodToStore()
      }
    })
  }, [])

  const sunTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, 0, 2)
    return o
  }, [])

  const shadowSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512

  useFrame((_, dt) => {
    const s = useStage.getState()
    const t = mood.twilight
    const r = mood.reveal
    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(3.6, 0.45, t) * (0.55 + 0.45 * r) * (1 + mood.lift * 0.15)
      sun.current.color.copy(SUN_WARM).lerp(SUN_COOL, t)
    }
    if (hemi.current) {
      hemi.current.intensity = (1.15 + mood.lift * 0.25) * (0.65 + 0.35 * r)
      hemi.current.color.copy(SKY_WARM).lerp(SKY_COOL, t)
    }
    const aboutFocus = s.section === 'about' ? 1 : 0
    if (locker.current) {
      locker.current.intensity =
        (7 + aboutFocus * 4 + mood.lift * 3) * (0.65 + 0.35 * r) * (1 - t * 0.5)
    }
    if (shelf.current) shelf.current.intensity = (3.4 + mood.lift * 1.2) * (0.6 + 0.4 * r)
    const ceil = (6.5 + mood.lift * 2) * (0.5 + 0.5 * r) * (1 - t * 0.45)
    if (ceilL.current) ceilL.current.intensity = ceil
    if (ceilR.current) ceilR.current.intensity = ceil
    const targetExposure = 1.12 + 0.22 * r + mood.lift * 0.14 - t * 0.04
    exposure.current = damp(exposure.current, targetExposure, 8, dt)
    gl.toneMappingExposure = exposure.current
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#7b5a40', '#150e08', 0.42]} />
      <primitive object={sunTarget} />
      <directionalLight
        ref={sun}
        position={[SUN_FROM[0], SUN_FROM[1], SUN_FROM[2] + 2]}
        target={sunTarget}
        color="#ff9a4d"
        intensity={3.6}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {/* The open locker glows like a real one */}
      <pointLight ref={locker} position={[-2.6, 2.55, -3.05]} color="#ffb36b" intensity={5} distance={5} decay={2} />
      <pointLight ref={shelf} position={[-2.6, 0.9, -3.15]} color="#ff9a52" intensity={2.4} distance={3} decay={2} />
      <pointLight ref={ceilL} position={[-3.2, 3.95, 2]} color="#ffc48a" intensity={6.5} distance={11} decay={2} />
      <pointLight ref={ceilR} position={[2.8, 3.95, 2]} color="#ffc48a" intensity={6.5} distance={11} decay={2} />
      <Environment resolution={128} frames={1} environmentIntensity={0.45}>
        <Lightformer
          form="rect"
          intensity={6}
          color="#ff9a52"
          position={[WIN.cx, WIN.cy, ROOM.zBack + 0.1]}
          scale={[WIN.w, WIN.h, 1]}
        />
        <Lightformer form="rect" intensity={1.6} color="#ffc48a" position={[0, 4, 2]} rotation-x={Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#5b6b92" position={[0, 2, 9]} scale={[10, 4, 1]} />
      </Environment>
    </>
  )
}
