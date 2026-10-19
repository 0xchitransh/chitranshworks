import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStage } from '../store/useStage'
import { ROOM, SUN_FROM, WIN } from './layout'
import { mood } from './mood'
import { rng } from './textures'

/* -------------------------------------------------------------------------- */
/* Burst particles (jersey cleaning, completion drift)                         */
/* -------------------------------------------------------------------------- */

export interface BurstOptions {
  spread?: number
  speed?: number
  life?: number
  /** Upward drift multiplier. */
  lift?: number
}

type Spawner = (x: number, y: number, z: number, count: number, opts?: BurstOptions) => void
let spawner: Spawner | null = null

/** Emit dust at a world position. Safe to call when the scene is not mounted. */
export function spawnDust(x: number, y: number, z: number, count: number, opts?: BurstOptions): void {
  spawner?.(x, y, z, count, opts)
}

const POOL = 260

const burstVertex = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  uniform float uPixel;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel / max(0.1, -mv.z);
  }
`
const burstFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

function BurstDust() {
  const ref = useRef<THREE.Points>(null)
  const state = useMemo(() => {
    const positions = new Float32Array(POOL * 3)
    const alpha = new Float32Array(POOL)
    const size = new Float32Array(POOL)
    const vel = new Float32Array(POOL * 3)
    const age = new Float32Array(POOL).fill(Infinity)
    const ttl = new Float32Array(POOL).fill(1)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: burstVertex,
      fragmentShader: burstFragment,
      uniforms: { uPixel: { value: 600 }, uColor: { value: new THREE.Color('#b9a58c') } },
      transparent: true,
      depthWrite: false,
    })
    return { positions, alpha, size, vel, age, ttl, geo, mat, cursor: 0, rand: rng(99) }
  }, [])

  useEffect(() => {
    spawner = (x, y, z, count, opts = {}) => {
      const { spread = 0.04, speed = 0.12, life = 1.4, lift = 0.05 } = opts
      for (let n = 0; n < count; n++) {
        const i = state.cursor
        state.cursor = (state.cursor + 1) % POOL
        const r = state.rand
        state.positions[i * 3] = x + (r() - 0.5) * spread * 2
        state.positions[i * 3 + 1] = y + (r() - 0.5) * spread * 2
        state.positions[i * 3 + 2] = z + 0.05 + r() * 0.05
        state.vel[i * 3] = (r() - 0.5) * speed
        state.vel[i * 3 + 1] = (r() - 0.3) * speed * 0.6 + lift
        state.vel[i * 3 + 2] = (r() - 0.2) * speed * 0.8
        state.age[i] = 0
        state.ttl[i] = life * (0.6 + r() * 0.8)
        state.size[i] = 5 + r() * 9
      }
    }
    return () => {
      spawner = null
    }
  }, [state])

  useEffect(
    () => () => {
      state.geo.dispose()
      state.mat.dispose()
    },
    [state],
  )

  useFrame((frame, dt) => {
    const { positions, alpha, vel, age, ttl, geo, mat } = state
    const h = frame.size.height
    const fov = (frame.camera as THREE.PerspectiveCamera).fov
    mat.uniforms.uPixel.value = (h / (2 * Math.tan((fov * Math.PI) / 360))) * 0.0035 * frame.viewport.dpr
    let any = false
    for (let i = 0; i < POOL; i++) {
      if (age[i] >= ttl[i]) {
        if (alpha[i] !== 0) {
          alpha[i] = 0
          any = true
        }
        continue
      }
      any = true
      age[i] += dt
      const damping = Math.exp(-0.9 * dt)
      vel[i * 3] *= damping
      vel[i * 3 + 1] = vel[i * 3 + 1] * damping + 0.02 * dt
      vel[i * 3 + 2] *= damping
      positions[i * 3] += vel[i * 3] * dt
      positions[i * 3 + 1] += vel[i * 3 + 1] * dt
      positions[i * 3 + 2] += vel[i * 3 + 2] * dt
      const k = 1 - age[i] / ttl[i]
      alpha[i] = Math.pow(Math.max(k, 0), 1.3) * 0.7
    }
    if (any) {
      geo.attributes.position.needsUpdate = true
      geo.attributes.aAlpha.needsUpdate = true
      geo.attributes.aSize.needsUpdate = true
    }
  })

  return <points ref={ref} geometry={state.geo} material={state.mat} frustumCulled={false} renderOrder={8} />
}

/* -------------------------------------------------------------------------- */
/* Ambient motes in the window light                                           */
/* -------------------------------------------------------------------------- */

const moteVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixel;
  uniform vec3 uBeamOrigin;
  uniform vec3 uBeamDir;
  varying float vA;
  void main() {
    vec3 p = position;
    float t = uTime * 0.05 + aSeed * 20.0;
    p.x += sin(t * 1.3 + aSeed * 6.28) * 0.35;
    p.y += sin(t * 0.9 + aSeed * 12.0) * 0.22 + mod(uTime * 0.012 + aSeed, 1.0) * 0.0;
    p.z += cos(t * 1.1 + aSeed * 3.0) * 0.3;

    // Motes are only really visible where the window light crosses them.
    vec3 rel = p - uBeamOrigin;
    float along = dot(rel, uBeamDir);
    float d = length(rel - uBeamDir * along);
    float inBeam = exp(-d * d * 0.55) * step(0.0, along);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.55 + 0.9 * fract(aSeed * 7.3)) * uPixel / max(0.1, -mv.z);
    float twinkle = 0.55 + 0.45 * sin(uTime * 0.8 + aSeed * 30.0);
    vA = (0.14 + 0.86 * inBeam) * twinkle;
  }
`
const moteFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`

function AmbientMotes({ count }: { count: number }) {
  const { geo, mat } = useMemo(() => {
    const r = rng(2026)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = ROOM.x0 + 1 + r() * 10
      pos[i * 3 + 1] = 0.3 + r() * 3.4
      pos[i * 3 + 2] = ROOM.zBack + 0.4 + r() * 8
      seed[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const dir = new THREE.Vector3(-SUN_FROM[0], -SUN_FROM[1], -SUN_FROM[2]).normalize()
    const m = new THREE.ShaderMaterial({
      vertexShader: moteVertex,
      fragmentShader: moteFragment,
      uniforms: {
        uTime: { value: 0 },
        uPixel: { value: 600 },
        uOpacity: { value: 1 },
        uColor: { value: new THREE.Color('#ffc58a') },
        uBeamOrigin: { value: new THREE.Vector3(WIN.cx, WIN.cy + 0.2, ROOM.zBack) },
        uBeamDir: { value: dir },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo: g, mat: m }
  }, [count])

  useEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )

  useFrame((frame) => {
    const reduced = useStage.getState().reducedMotion
    // Reduced motion: motes stay put instead of drifting.
    if (!reduced) mat.uniforms.uTime.value = frame.clock.elapsedTime
    const fov = (frame.camera as THREE.PerspectiveCamera).fov
    mat.uniforms.uPixel.value = (frame.size.height / (2 * Math.tan((fov * Math.PI) / 360))) * 0.012 * frame.viewport.dpr
    mat.uniforms.uOpacity.value = (0.35 + 0.65 * mood.reveal) * (1 - mood.twilight * 0.55)
  })

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={7} />
}

export function DustParticles() {
  const quality = useStage((s) => s.quality)
  const count = quality === 'high' ? 280 : quality === 'medium' ? 170 : 80
  return (
    <>
      <AmbientMotes count={count} />
      <BurstDust />
    </>
  )
}
