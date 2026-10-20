import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getMaterials } from './materials'
import { Box } from './primitives'
import { ROOM, SUN_FROM, WALL_THICKNESS, WIN } from './layout'
import { mood } from './mood'
import { beamTexture, floorRoughness, woodTexture } from './textures'

function withRepeat(tex: THREE.Texture, rx: number, ry: number): THREE.Texture {
  const t = tex.clone()
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  return t
}

function backWallGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(ROOM.x0, 0)
  shape.lineTo(ROOM.x1, 0)
  shape.lineTo(ROOM.x1, ROOM.height)
  shape.lineTo(ROOM.x0, ROOM.height)
  shape.closePath()
  const hole = new THREE.Path()
  const x0 = WIN.cx - WIN.w / 2
  const x1 = WIN.cx + WIN.w / 2
  const y0 = WIN.cy - WIN.h / 2
  const y1 = WIN.cy + WIN.h / 2
  hole.moveTo(x0, y0)
  hole.lineTo(x0, y1)
  hole.lineTo(x1, y1)
  hole.lineTo(x1, y0)
  hole.closePath()
  shape.holes.push(hole)
  return new THREE.ExtrudeGeometry(shape, { depth: WALL_THICKNESS, bevelEnabled: false })
}

export function RoomEnvironment() {
  const m = getMaterials()
  const depth = ROOM.zFront - ROOM.zBack
  const midZ = (ROOM.zFront + ROOM.zBack) / 2

  const assets = useMemo(() => {
    const wallBase = woodTexture('wall', { planks: 10, base: [78, 54, 36], seed: 41, grime: 0.45 }, [1 / 2.4, 1 / 2.4])
    const sideWall = woodTexture('side', { planks: 10, base: [66, 46, 32], seed: 57, grime: 0.45 }, [1, 1])
    const floorBase = woodTexture('floor', { planks: 8, base: [76, 54, 38], seed: 77, grime: 0.5 }, [1, 1])
    const floor = withRepeat(floorBase, 7.5, depth / 3)
    const left = withRepeat(sideWall, depth / 2.4, ROOM.height / 2.4)
    const right = withRepeat(sideWall, depth / 2.4, ROOM.height / 2.4)
    const rough = floorRoughness().clone()
    rough.repeat.set(3.7, depth / 11)
    rough.needsUpdate = true
    return {
      backGeo: backWallGeometry(),
      wallMat: new THREE.MeshStandardMaterial({ color: '#ffffff', map: wallBase, roughness: 0.82 }),
      leftMat: new THREE.MeshStandardMaterial({ color: '#ffffff', map: left, roughness: 0.85 }),
      rightMat: new THREE.MeshStandardMaterial({ color: '#ffffff', map: right, roughness: 0.85 }),
      floorMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: floor,
        roughness: 1,
        roughnessMap: rough,
        envMapIntensity: 0.9,
      }),
      ceilMat: new THREE.MeshStandardMaterial({ color: '#1a1512', roughness: 0.95 }),
      extra: [floor, left, right, rough],
    }
  }, [depth])

  useEffect(
    () => () => {
      assets.backGeo.dispose()
      ;[assets.wallMat, assets.leftMat, assets.rightMat, assets.floorMat, assets.ceilMat].forEach((x) => x.dispose())
      assets.extra.forEach((t) => t.dispose())
    },
    [assets],
  )

  return (
    <group>
      {/* Back wall, with a real opening for the stadium window */}
      <mesh
        geometry={assets.backGeo}
        material={assets.wallMat}
        position={[0, 0, ROOM.zBack - WALL_THICKNESS]}
        castShadow
        receiveShadow
      />
      {/* Side walls */}
      <mesh
        material={assets.leftMat}
        position={[ROOM.x0, ROOM.height / 2, midZ]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[depth, ROOM.height]} />
      </mesh>
      <mesh
        material={assets.rightMat}
        position={[ROOM.x1, ROOM.height / 2, midZ]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[depth, ROOM.height]} />
      </mesh>
      {/* Floor */}
      <mesh material={assets.floorMat} position={[0, 0, midZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, depth]} />
      </mesh>
      {/* Ceiling and beams */}
      <mesh material={assets.ceilMat} position={[0, ROOM.height, midZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, depth]} />
      </mesh>
      {[-3.4, -0.4, 2.6, 5.6, 8.6].map((z) => (
        <Box key={z} size={[12, 0.28, 0.3]} pos={[0, ROOM.height - 0.14, z]} mat={m.walnutDark} cast={false} />
      ))}
      {/* Ceiling strip lights */}
      {[-3.2, 2.8].map((x) => (
        <group key={x}>
          <Box size={[0.07, 0.03, 7.5]} pos={[x, ROOM.height - 0.32, 2.0]} mat={m.stripEmit} cast={false} receive={false} />
          <Box size={[0.26, 0.05, 7.6]} pos={[x, ROOM.height - 0.29, 2.0]} mat={m.blackMetal} cast={false} receive={false} />
        </group>
      ))}
      {/* Skirting along the back wall */}
      <Box size={[12, 0.14, 0.04]} pos={[0, 0.07, ROOM.zBack + 0.02]} mat={m.walnutDark} cast={false} />
      <LightShafts />
    </group>
  )
}

/** Cheap volumetric light: additive planes aligned to the sun direction, fading with the mood. */
function LightShafts() {
  const tex = useMemo(() => beamTexture(), [])
  const dir = useMemo(() => new THREE.Vector3(-SUN_FROM[0], -SUN_FROM[1], -SUN_FROM[2]).normalize(), [])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), [dir])
  const mats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            map: tex,
            color: '#ffb067',
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
          }),
      ),
    [tex],
  )
  useEffect(() => () => mats.forEach((x) => x.dispose()), [mats])

  useFrame(() => {
    const o = 0.13 * (0.35 + 0.65 * mood.reveal) * (1 - mood.dusk * 0.85) * (1 + mood.lift * 0.2) * (0.88 + 0.35 * mood.area.window)
    mats.forEach((mm, i) => (mm.opacity = o * [1, 0.8, 0.9][i]))
  })

  const L = 9
  const shafts = [
    { x: WIN.cx - 0.62, w: 0.8, m: 0 },
    { x: WIN.cx + 0.05, w: 1.1, m: 1 },
    { x: WIN.cx + 0.68, w: 0.7, m: 2 },
  ]
  return (
    <group>
      {shafts.map((s) => {
        const start = new THREE.Vector3(s.x, WIN.cy + 0.3, ROOM.zBack + 0.1)
        const mid = start.clone().addScaledVector(dir, L / 2)
        return (
          <group key={s.m} position={mid} quaternion={quat}>
            <mesh material={mats[s.m]} renderOrder={5}>
              <planeGeometry args={[s.w, L]} />
            </mesh>
            <mesh material={mats[s.m]} rotation={[0, Math.PI / 2, 0]} renderOrder={5}>
              <planeGeometry args={[s.w, L]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
