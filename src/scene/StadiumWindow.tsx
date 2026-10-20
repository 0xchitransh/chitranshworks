import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStage } from '../store/useStage'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import { ROOM, WALL_THICKNESS, WIN } from './layout'
import { getMaterials } from './materials'
import { Box } from './primitives'
import { mood } from './mood'
import { makeCanvas, radialTexture, rng } from './textures'

const GROUND_Y = -1.4
const CENTER_Z = -112

/* ---------------------------------- Sky ---------------------------------- */

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFragment = /* glsl */ `
  varying vec3 vDir;
  uniform float uTwilight;
  uniform float uTime;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += noise(p) * a; p *= 2.02; a *= 0.5; }
    return v;
  }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 hzW = vec3(1.0, 0.56, 0.24);
    vec3 miW = vec3(0.72, 0.27, 0.22);
    vec3 tpW = vec3(0.11, 0.10, 0.24);
    vec3 hzC = vec3(0.50, 0.42, 0.60);
    vec3 miC = vec3(0.18, 0.20, 0.42);
    vec3 tpC = vec3(0.03, 0.05, 0.15);
    vec3 hz = mix(hzW, hzC, uTwilight);
    vec3 mi = mix(miW, miC, uTwilight);
    vec3 tp = mix(tpW, tpC, uTwilight);
    vec3 col = mix(hz, mi, smoothstep(0.0, 0.16, h));
    col = mix(col, tp, smoothstep(0.1, 0.55, h));
    vec3 sunDir = normalize(vec3(0.34, 0.07, -1.0));
    float s = max(dot(d, sunDir), 0.0);
    col += vec3(1.0, 0.6, 0.26) * (pow(s, 40.0) * 0.9 + pow(s, 5.0) * 0.28) * (1.0 - uTwilight * 0.75);
    vec2 cp = d.xz / (d.y + 0.32) * 1.4;
    float c = fbm(cp * vec2(1.0, 2.6) + vec2(uTime * 0.003, 0.0));
    c = smoothstep(0.42, 0.78, c);
    vec3 cloud = mix(vec3(1.0, 0.52, 0.26), vec3(0.50, 0.44, 0.66), uTwilight) * (0.55 + 0.6 * c);
    col = mix(col, cloud, c * 0.6 * smoothstep(0.0, 0.1, h));
    col = mix(col, vec3(0.02, 0.025, 0.02), smoothstep(0.0, -0.04, h));
    gl_FragColor = vec4(col, 1.0);
  }
`

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: { uTwilight: { value: 0 }, uTime: { value: 0 } },
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    [],
  )
  useEffect(() => () => mat.dispose(), [mat])
  useFrame((s) => {
    mat.uniforms.uTwilight.value = mood.dusk
    mat.uniforms.uTime.value = s.clock.elapsedTime
  })
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  )
}

/* -------------------------------- Stadium -------------------------------- */

function groundTexture(): THREE.Texture {
  const [c, ctx] = makeCanvas(512, 512)
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? '#2d4a24' : '#27421f'
    ctx.fillRect(0, (i * 512) / 16, 512, 512 / 16)
  }
  ctx.fillStyle = '#556b3b'
  ctx.fillRect(238, 150, 36, 212)
  const rand = rng(5)
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand() * 0.06})`
    ctx.fillRect(rand() * 512, rand() * 512, 3, 3)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function crowdTexture(): THREE.Texture {
  const [c, ctx] = makeCanvas(1024, 256)
  ctx.fillStyle = '#17110d'
  ctx.fillRect(0, 0, 1024, 256)
  const rand = rng(12)
  const colours = ['#c85a2a', '#d9a05a', '#e8d9bd', '#3a5a8a', '#a8402a', '#6b6a66']
  // rows of seated spectators
  for (let row = 0; row < 26; row++) {
    const y = 10 + row * 9.4
    ctx.fillStyle = row % 2 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, y - 4, 1024, 9)
    for (let x = 0; x < 1024; x += 5 + rand() * 5) {
      ctx.fillStyle = colours[(rand() * colours.length) | 0]
      ctx.globalAlpha = 0.25 + rand() * 0.55
      ctx.fillRect(x, y - 3 + rand() * 2, 3.4, 5)
    }
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.repeat.set(14, 1)
  return tex
}

function lampTexture(): THREE.Texture {
  const [c, ctx] = makeCanvas(128, 96)
  ctx.fillStyle = '#c7b8a0'
  ctx.fillRect(0, 0, 128, 96)
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 8; x++) {
      const g = ctx.createRadialGradient(10 + x * 15.5, 10 + y * 15.5, 0, 10 + x * 15.5, 10 + y * 15.5, 8)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(1, 'rgba(255,240,210,0.4)')
      ctx.fillStyle = g
      ctx.fillRect(x * 15.5 + 2, y * 15.5 + 2, 15, 15)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const TOWERS: { x: number; z: number; h: number; s: number }[] = [
  { x: -14, z: -196, h: 20, s: 1.5 },
  { x: 34, z: -190, h: 27, s: 1.4 },
  { x: -62, z: -176, h: 24, s: 1.4 },
  { x: 72, z: -168, h: 36, s: 1.5 },
]

const WARM_STANDS = new THREE.Color('#9a6a46')
const COOL_STANDS = new THREE.Color('#4c5a86')
const WARM_GROUND = new THREE.Color('#a77a4c')
const COOL_GROUND = new THREE.Color('#4d6a6a')

function Stadium() {
  const assets = useMemo(() => {
    const ground = groundTexture()
    const crowd = crowdTexture()
    const lamp = lampTexture()
    return {
      ground,
      crowd,
      lamp,
      groundMat: new THREE.MeshBasicMaterial({ map: ground, color: WARM_GROUND.clone(), fog: false }),
      standsMat: new THREE.MeshBasicMaterial({ map: crowd, color: WARM_STANDS.clone(), side: THREE.DoubleSide, fog: false }),
      roofMat: new THREE.MeshBasicMaterial({ color: '#0d0b0a', side: THREE.DoubleSide, fog: false }),
      poleMat: new THREE.MeshBasicMaterial({ color: '#1a1614', fog: false }),
      lampMat: new THREE.MeshBasicMaterial({ map: lamp, color: '#ffffff', toneMapped: false, fog: false }),
      glowMat: new THREE.SpriteMaterial({
        map: radialTexture('lamp-glow', [
          [0, 'rgba(255,230,190,1)'],
          [0.25, 'rgba(255,190,120,0.45)'],
          [1, 'rgba(255,150,70,0)'],
        ]),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        opacity: 0.6,
      }),
    }
  }, [])

  useEffect(
    () => () => {
      assets.ground.dispose()
      assets.crowd.dispose()
      assets.lamp.dispose()
      ;[assets.groundMat, assets.standsMat, assets.roofMat, assets.poleMat, assets.lampMat, assets.glowMat].forEach((m) => m.dispose())
    },
    [assets],
  )

  useFrame(() => {
    const t = mood.dusk
    assets.standsMat.color.copy(WARM_STANDS).lerp(COOL_STANDS, t)
    assets.groundMat.color.copy(WARM_GROUND).lerp(COOL_GROUND, t)
    assets.glowMat.opacity = 0.55 + t * 0.4
  })

  return (
    <group>
      <mesh material={assets.groundMat} position={[0, GROUND_Y, CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[135, 48]} />
      </mesh>
      {/* Stands */}
      <mesh material={assets.standsMat} position={[0, GROUND_Y + 6, CENTER_Z]}>
        <cylinderGeometry args={[92, 70, 12, 64, 1, true, Math.PI * 0.5 - 0.5, Math.PI + 1.0]} />
      </mesh>
      <mesh material={assets.roofMat} position={[0, GROUND_Y + 12.6, CENTER_Z]}>
        <cylinderGeometry args={[93, 92, 1.6, 64, 1, true, Math.PI * 0.5 - 0.5, Math.PI + 1.0]} />
      </mesh>
      {/* Floodlights */}
      {TOWERS.map((t, i) => (
        <group key={i} position={[t.x, GROUND_Y, t.z]}>
          <mesh material={assets.poleMat} position={[0, t.h / 2, 0]}>
            <cylinderGeometry args={[0.7, 1.1, t.h, 8]} />
          </mesh>
          <mesh material={assets.lampMat} position={[0, t.h + 2.5, 0.8]} rotation={[0.18, 0, 0]} scale={t.s}>
            <planeGeometry args={[11, 7]} />
          </mesh>
          <sprite material={assets.glowMat} position={[0, t.h + 2.5, 2]} scale={[70 * t.s, 52 * t.s, 1]} />
        </group>
      ))}
    </group>
  )
}

/* ---------------------------- Window in the room ---------------------------- */

export function StadiumWindow() {
  const m = getMaterials()
  const section = useStage((s) => s.section)
  const pane = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), [])
  useEffect(() => () => pane.dispose(), [pane])

  const x0 = WIN.cx - WIN.w / 2
  const x1 = WIN.cx + WIN.w / 2
  const y0 = WIN.cy - WIN.h / 2
  const y1 = WIN.cy + WIN.h / 2
  const zf = ROOM.zBack - WALL_THICKNESS / 2
  const f = 0.07

  return (
    <group>
      <Sky />
      <Stadium />
      <Interactive id="contact" section="contact">
        <HoverGlow id="contact" position={[WIN.cx, WIN.cy, ROOM.zBack + 0.5]} size={[3.4, 3.6]} color="#ffb067" strength={0.22} active={section === 'contact'} />
        {/* Hit area filling the opening */}
        <mesh position={[WIN.cx, WIN.cy, ROOM.zBack + 0.01]} material={pane}>
          <planeGeometry args={[WIN.w, WIN.h]} />
        </mesh>
        {/* Frame */}
        <Box size={[WIN.w + 0.16, f, 0.1]} pos={[WIN.cx, y1, zf]} mat={m.blackMetal} />
        <Box size={[WIN.w + 0.16, f, 0.1]} pos={[WIN.cx, y0, zf]} mat={m.blackMetal} />
        <Box size={[f, WIN.h, 0.1]} pos={[x0, WIN.cy, zf]} mat={m.blackMetal} />
        <Box size={[f, WIN.h, 0.1]} pos={[x1, WIN.cy, zf]} mat={m.blackMetal} />
        {/* Mullions */}
        <Box size={[0.05, WIN.h, 0.06]} pos={[WIN.cx, WIN.cy, zf]} mat={m.blackMetal} />
        <Box size={[WIN.w, 0.05, 0.06]} pos={[WIN.cx, WIN.cy + 0.55, zf]} mat={m.blackMetal} />
        <Box size={[WIN.w, 0.05, 0.06]} pos={[WIN.cx, WIN.cy - 0.55, zf]} mat={m.blackMetal} />
        {/* Sill */}
        <Box size={[WIN.w + 0.4, 0.05, 0.45]} pos={[WIN.cx, y0 - 0.02, ROOM.zBack + 0.1]} mat={m.walnut} />
      </Interactive>
    </group>
  )
}
