import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { sfx } from '../audio/engine'
import { useStage } from '../store/useStage'
import { spawnDust } from './DustParticles'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import {
  DIRT_H,
  DIRT_W,
  JERSEY_WORLD_H as JH,
  JERSEY_WORLD_W as JW,
  buildSilhouetteMask,
  drawBrush,
  drawCleanJersey,
  drawDirtLayer,
} from './jerseyTextures'
import { getMaterials } from './materials'
import { Box, Cyl } from './primitives'
import { POS } from './layout'
import { weaveBump } from './textures'

/** Share of the dust that must be gone before the jersey counts as restored. */
export const RESTORE_THRESHOLD = 0.78
const BRUSH_RADIUS = 40 // texture pixels

let finishHandler: ((fast: boolean) => void) | null = null

/** Completes the cleaning (used by the "Skip interaction" button). Works even if the scene is not mounted. */
export function finishJersey(fast = true): void {
  if (finishHandler) finishHandler(fast)
  else useStage.getState().restoreJersey()
}

function buildGeometry(): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(JW, JH, 56, 42)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / JW
    const t = 0.5 - pos.getY(i) / JH // 0 at the collar, 1 at the hem
    const ax = Math.abs(x)
    let z = 0.032 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - Math.pow(Math.min(1, ax * 2.3), 2))
    z += 0.011 * Math.sin(x * 38 + t * 6) * (0.2 + t)
    z += 0.016 * Math.sin(x * 17 + 1.7 + t * 2) * Math.pow(t, 1.2)
    if (ax > 0.31) z -= (0.05 * (ax - 0.31)) / 0.19 + 0.008 * Math.sin(t * 40)
    pos.setZ(i, z)
  }
  g.computeVertexNormals()
  return g
}

export function Jersey() {
  const section = useStage((s) => s.section)
  const jersey = useStage((s) => s.jersey)
  const cleaning = jersey === 'cleaning' && section === 'about'
  const restored = jersey === 'restored'

  const swing = useRef<THREE.Group>(null)
  const dirtMesh = useRef<THREE.Mesh>(null)
  const spring = useRef({ angle: 0, vel: 0 })
  const painting = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const dirty = useRef(false)
  const sinceMeasure = useRef(0)
  const done = useRef(false)
  const cleaningRef = useRef(cleaning)
  cleaningRef.current = cleaning

  const assets = useMemo(() => {
    const cleanCanvas = drawCleanJersey()
    const cleanTex = new THREE.CanvasTexture(cleanCanvas)
    cleanTex.colorSpace = THREE.SRGBColorSpace
    cleanTex.anisotropy = 8

    const dirtCanvas = drawDirtLayer()
    const dirtCtx = dirtCanvas.getContext('2d', { willReadFrequently: false })!
    const dirtTex = new THREE.CanvasTexture(dirtCanvas)
    dirtTex.colorSpace = THREE.SRGBColorSpace

    const sample = document.createElement('canvas')
    sample.width = 64
    sample.height = Math.round((64 * DIRT_H) / DIRT_W)
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true })!

    const measure = () => {
      sampleCtx.clearRect(0, 0, sample.width, sample.height)
      sampleCtx.drawImage(dirtCanvas, 0, 0, sample.width, sample.height)
      const d = sampleCtx.getImageData(0, 0, sample.width, sample.height).data
      let sum = 0
      for (let i = 3; i < d.length; i += 4) sum += d[i]
      return sum
    }

    const geometry = buildGeometry()
    const mask = buildSilhouetteMask()
    // Pointer hits only count on the shirt itself, not on the empty corners of its plane.
    const raycast = function (this: THREE.Mesh, raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
      const hits: THREE.Intersection[] = []
      THREE.Mesh.prototype.raycast.call(this, raycaster, hits)
      for (const h of hits) if (h.uv && mask.test(h.uv.x, h.uv.y)) intersects.push(h)
    }
    const cleanMat = new THREE.MeshStandardMaterial({
      map: cleanTex,
      alphaTest: 0.5,
      roughness: 0.9,
      bumpMap: weaveBump(70),
      bumpScale: 0.5,
      side: THREE.DoubleSide,
    })
    const dirtMat = new THREE.MeshStandardMaterial({
      map: dirtTex,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.DoubleSide,
    })
    return {
      cleanTex,
      dirtTex,
      dirtCanvas,
      dirtCtx,
      brush: drawBrush(),
      mask,
      raycast,
      measure,
      initial: measure(),
      geometry,
      cleanMat,
      dirtMat,
    }
  }, [])

  useEffect(
    () => () => {
      assets.cleanTex.dispose()
      assets.dirtTex.dispose()
      assets.geometry.dispose()
      assets.cleanMat.dispose()
      assets.dirtMat.dispose()
    },
    [assets],
  )

  // A freshly mounted scene starts with a fresh dust layer unless already restored.
  useEffect(() => {
    done.current = useStage.getState().jersey === 'restored'
    if (!done.current) useStage.getState().setJerseyProgress(0)
    if (done.current) assets.dirtMat.opacity = 0
  }, [assets])

  const complete = (fast: boolean) => {
    if (done.current) return
    done.current = true
    painting.current = false
    const store = useStage.getState()
    const reduced = store.reducedMotion
    store.setJerseyProgress(1)
    spawnDust(POS.jersey[0], POS.jersey[1] + 0.1, POS.jersey[2] + 0.15, 140, {
      spread: 0.45,
      speed: 0.32,
      life: 3.2,
      lift: 0.14,
    })
    const fade = reduced ? 0 : fast ? 0.6 : 1.1
    const wait = reduced ? 0 : fast ? 0.45 : 0.85
    gsap.to(assets.dirtMat, {
      opacity: 0,
      duration: fade,
      ease: 'power2.out',
      onComplete: () => {
        if (dirtMesh.current) dirtMesh.current.visible = false
      },
    })
    if (fade === 0 && dirtMesh.current) dirtMesh.current.visible = false
    gsap.delayedCall(wait, () => useStage.getState().restoreJersey())
  }
  const completeRef = useRef(complete)
  completeRef.current = complete

  useEffect(() => {
    finishHandler = (fast) => completeRef.current(fast)
    return () => {
      finishHandler = null
    }
  }, [])

  const stamp = (x: number, y: number) => {
    const r = BRUSH_RADIUS
    assets.dirtCtx.drawImage(assets.brush, x - r, y - r, r * 2, r * 2)
  }

  const stroke = (uv: THREE.Vector2, point: THREE.Vector3) => {
    const ctx = assets.dirtCtx
    ctx.globalCompositeOperation = 'destination-out'
    const x = uv.x * DIRT_W
    const y = (1 - uv.y) * DIRT_H
    const prev = last.current
    if (prev) {
      const dist = Math.hypot(x - prev.x, y - prev.y)
      const steps = Math.max(1, Math.ceil(dist / (BRUSH_RADIUS * 0.3)))
      for (let i = 1; i <= steps; i++) stamp(prev.x + ((x - prev.x) * i) / steps, prev.y + ((y - prev.y) * i) / steps)
      spring.current.vel += (x - prev.x) * 0.0004
    } else {
      stamp(x, y)
    }
    ctx.globalCompositeOperation = 'source-over'
    last.current = { x, y }
    assets.dirtTex.needsUpdate = true
    dirty.current = true
    sfx.scrub()
    spawnDust(point.x, point.y, point.z, 2, { spread: 0.05, speed: 0.2, life: 1.1, lift: 0.03 })
  }

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!cleaningRef.current || done.current || !e.uv) return
    e.stopPropagation()
    if (!assets.mask.test(e.uv.x, e.uv.y)) return
    painting.current = true
    last.current = null
    ;(e.target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId)
    stroke(e.uv, e.point)
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return
    // Dragging onto the shirt with the button (or finger) already down starts a stroke too.
    if (!painting.current) {
      if (!cleaningRef.current || done.current || (e.buttons & 1) === 0) return
      painting.current = true
      last.current = null
    }
    e.stopPropagation()
    stroke(e.uv, e.point)
  }
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!painting.current) return
    painting.current = false
    last.current = null
    ;(e.target as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(e.pointerId)
  }

  useFrame((frame, dt) => {
    // Gentle hanging sway, with a kick whenever the shirt is wiped.
    if (swing.current) {
      const reduced = useStage.getState().reducedMotion
      const sp = spring.current
      const idle = reduced ? 0 : Math.sin(frame.clock.elapsedTime * 0.55) * 0.0012
      const accel = -38 * sp.angle - 3.2 * sp.vel
      sp.vel += accel * dt
      sp.vel = THREE.MathUtils.clamp(sp.vel, -0.6, 0.6)
      sp.angle = THREE.MathUtils.clamp(sp.angle + sp.vel * dt, -0.05, 0.05)
      swing.current.rotation.z = sp.angle + idle
    }

    if (!dirty.current || done.current) return
    sinceMeasure.current += dt
    if (sinceMeasure.current < 0.14) return
    sinceMeasure.current = 0
    dirty.current = false
    const progress = THREE.MathUtils.clamp(1 - assets.measure() / assets.initial, 0, 1)
    const store = useStage.getState()
    if (Math.abs(progress - store.jerseyProgress) > 0.004) store.setJerseyProgress(progress)
    if (progress >= RESTORE_THRESHOLD) complete(false)
  })

  const m = getMaterials()
  const topY = POS.jersey[1] + JH / 2

  return (
    <Interactive id="jersey" section="about" disabled={cleaning}>
      <HoverGlow id="jersey" position={[POS.jersey[0], POS.jersey[1], POS.jersey[2] + 0.5]} size={[2.2, 1.7]} active={section === 'about'} />
      <group position={[POS.jersey[0], topY, POS.jersey[2]]}>
        <group ref={swing}>
          {/* Wooden hanger, hooked over the rail */}
          <group position={[0, 0, -0.025]}>
            <Cyl r={0.006} h={0.2} pos={[0, 0.12, 0]} mat={m.steel} seg={8} />
            <mesh position={[0, 0.235, 0]} rotation={[0, 0, 0]} material={m.steel}>
              <torusGeometry args={[0.022, 0.005, 8, 20, Math.PI * 1.35]} />
            </mesh>
            <Box size={[0.34, 0.016, 0.02]} pos={[-0.17, -0.02, 0]} rot={[0, 0, 0.3]} mat={m.lightWood} cast={false} />
            <Box size={[0.34, 0.016, 0.02]} pos={[0.17, -0.02, 0]} rot={[0, 0, -0.3]} mat={m.lightWood} cast={false} />
          </group>
          <group position={[0, -JH / 2, 0]}>
            <mesh
              geometry={assets.geometry}
              material={assets.cleanMat}
              raycast={assets.raycast}
              castShadow
              receiveShadow
            />
            <mesh
              ref={dirtMesh}
              raycast={assets.raycast}
              geometry={assets.geometry}
              material={assets.dirtMat}
              position={[0, 0, 0.004]}
              visible={!restored}
              renderOrder={3}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
          </group>
        </group>
      </group>
    </Interactive>
  )
}
