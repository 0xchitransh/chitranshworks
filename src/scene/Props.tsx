import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { BlobShadow } from './BlobShadow'
import { getMaterials } from './materials'
import { Ball, Box, Cyl } from './primitives'
import { labelTexture, rng } from './textures'

function Bench() {
  const m = getMaterials()
  const crest = useMemo(
    () => labelTexture('towel-c', 'C.', { w: 128, h: 128, fg: '#E87535', font: '800 88px Georgia, serif', spacing: 0 }),
    [],
  )
  return (
    <group position={[-2.9, 0, -2.3]}>
      <BlobShadow pos={[0, 0]} size={[3.6, 1.1]} opacity={0.55} />
      <Box size={[2.9, 0.07, 0.5]} pos={[0, 0.465, 0]} mat={m.walnut} />
      <Box size={[2.7, 0.04, 0.4]} pos={[0, 0.14, 0]} mat={m.walnutDark} />
      {[-1.3, 1.3].map((x) =>
        [-0.2, 0.2].map((z) => <Box key={`${x}${z}`} size={[0.07, 0.46, 0.07]} pos={[x, 0.23, z]} mat={m.blackMetal} />),
      )}

      {/* Towel with crest */}
      <group position={[1.35, 0.5, 0.0]} rotation={[0, 0.18, 0]}>
        <Box size={[0.42, 0.05, 0.3]} pos={[0, 0.025, 0]} mat={m.towel} />
        <Box size={[0.42, 0.012, 0.3]} pos={[0, 0.056, 0]} mat={m.towel} />
        <mesh position={[0.1, 0.064, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshStandardMaterial map={crest} transparent roughness={0.9} />
        </mesh>
      </group>
      {/* Ball, bottle, notebook */}
      <Ball r={0.036} pos={[0.85, 0.536, 0.05]} mat={m.ballRed} />
      <mesh position={[0.85, 0.536, 0.05]} rotation={[0.4, 0, 0.2]}>
        <torusGeometry args={[0.0365, 0.0028, 6, 28]} />
        <meshStandardMaterial color="#e6dcc6" roughness={0.8} />
      </mesh>
      <Cyl r={0.035} h={0.23} pos={[0.35, 0.615, 0.08]} mat={m.blackMetal} />
      <Cyl r={0.025} h={0.04} pos={[0.35, 0.75, 0.08]} mat={m.rubber} />
      <Box size={[0.22, 0.025, 0.16]} pos={[0.6, 0.512, -0.08]} rot={[0, 0.3, 0]} mat={m.leatherDark} />
      <Box size={[0.2, 0.012, 0.145]} pos={[0.6, 0.528, -0.08]} rot={[0, 0.3, 0]} mat={m.paper} />

      {/* Helmet */}
      <group position={[-1.1, 0.5, 0.0]} rotation={[0, 0.35, 0]}>
        <mesh material={m.helmet} position={[0, 0.0, 0]} scale={[1, 1, 1.1]} castShadow>
          <sphereGeometry args={[0.115, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
        </mesh>
        <Box size={[0.2, 0.012, 0.09]} pos={[0, 0.06, 0.13]} rot={[0.3, 0, 0]} mat={m.helmet} />
        {[-0.05, 0, 0.05].map((x) => (
          <Cyl key={x} r={0.004} h={0.09} pos={[x, 0.035, 0.125]} mat={m.steel} seg={6} />
        ))}
        {[0.02, 0.055].map((y) => (
          <mesh key={y} position={[0, y, 0.095]} material={m.steel}>
            <torusGeometry args={[0.09 - y * 0.25, 0.004, 6, 22, Math.PI]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Bat() {
  const m = getMaterials()
  return (
    <group position={[-4.15, 0, -3.27]} rotation={[-0.14, 0.18, 0.03]}>
      <Box size={[0.108, 0.54, 0.032]} pos={[0, 0.29, 0]} mat={m.lightWood} />
      <Box size={[0.09, 0.07, 0.03]} pos={[0, 0.595, 0]} mat={m.lightWood} />
      <Cyl r={0.015} h={0.27} pos={[0, 0.72, 0]} mat={m.lightWood} seg={10} />
      <Cyl r={0.019} h={0.19} pos={[0, 0.74, 0]} mat={m.rubber} seg={10} />
      <Box size={[0.07, 0.12, 0.004]} pos={[0, 0.34, 0.019]} mat={m.accent} cast={false} />
    </group>
  )
}

function Pads() {
  const m = getMaterials()
  return (
    <group>
      <BlobShadow pos={[-5.45, -3.0]} size={[0.9, 0.5]} opacity={0.5} />
      {[-5.62, -5.34].map((x, i) => (
        <group key={x} position={[x, 0, -3.28]} rotation={[-0.13, i ? -0.05 : 0.06, 0]}>
          <Box size={[0.2, 0.78, 0.06]} pos={[0, 0.4, 0]} mat={m.cream} />
          <Box size={[0.14, 0.2, 0.08]} pos={[0, 0.58, 0.01]} mat={m.cream} />
          {[0.2, 0.42, 0.62].map((y) => (
            <Box key={y} size={[0.215, 0.025, 0.065]} pos={[0, y, 0]} mat={m.leatherDark} />
          ))}
        </group>
      ))}
    </group>
  )
}

function LockerItems() {
  const m = getMaterials()
  const shoe = (x: number, z: number, r: number, key: string) => (
    <group key={key} position={[x, 1.003, z]} rotation={[0, r, 0]}>
      <Box size={[0.1, 0.025, 0.29]} pos={[0, 0.0125, 0]} mat={m.rubber} />
      <Box size={[0.09, 0.06, 0.17]} pos={[0, 0.055, -0.04]} mat={m.leatherDark} />
      <Box size={[0.085, 0.035, 0.1]} pos={[0, 0.04, 0.09]} mat={m.leatherDark} />
    </group>
  )
  return (
    <group>
      {shoe(-3.3, -3.62, 0.15, 's1')}
      {shoe(-3.15, -3.6, -0.1, 's2')}
      {/* Gloves */}
      {[-2.15, -1.95].map((x, i) => (
        <group key={x} position={[x, 1.005, -3.62]} rotation={[0, i ? 0.4 : -0.3, 0]}>
          <Box size={[0.1, 0.03, 0.14]} pos={[0, 0.015, 0]} mat={m.cream} />
          {[-0.036, -0.012, 0.012, 0.036].map((fx) => (
            <Box key={fx} size={[0.021, 0.026, 0.07]} pos={[fx, 0.015, -0.1]} mat={m.cream} />
          ))}
          <Box size={[0.1, 0.03, 0.05]} pos={[0, 0.015, 0.09]} mat={m.leatherDark} />
        </group>
      ))}
      {/* Cap on the lower shelf */}
      <Cyl r={0.09} h={0.05} pos={[-2.7, 0.245, -3.6]} mat={m.helmet} />
    </group>
  )
}

function Stool({ x, z }: { x: number; z: number }) {
  const m = getMaterials()
  return (
    <group position={[x, 0, z]}>
      <BlobShadow pos={[0, 0]} size={[0.8, 0.8]} opacity={0.5} />
      <Cyl r={0.17} h={0.05} pos={[0, 0.72, 0]} mat={m.walnutDark} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        return (
          <Cyl
            key={i}
            r={0.013}
            h={0.72}
            pos={[Math.cos(a) * 0.14, 0.36, Math.sin(a) * 0.14]}
            rot={[Math.sin(a) * 0.05, 0, -Math.cos(a) * 0.05]}
            mat={m.blackMetal}
            seg={8}
          />
        )
      })}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.blackMetal}>
        <torusGeometry args={[0.145, 0.008, 6, 24]} />
      </mesh>
    </group>
  )
}

function FlightCase({ pos, size, rot = 0 }: { pos: [number, number, number]; size: [number, number, number]; rot?: number }) {
  const m = getMaterials()
  const plate = useMemo(
    () => labelTexture('case-c', 'C.', { w: 128, h: 128, fg: '#E87535', font: '800 90px Georgia, serif', spacing: 0 }),
    [],
  )
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box size={size} mat={m.case} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <Box
            key={`${sx}${sy}`}
            size={[0.06, 0.06, 0.06]}
            pos={[(sx * size[0]) / 2, (sy * size[1]) / 2, size[2] / 2]}
            mat={m.steel}
            cast={false}
          />
        )),
      )}
      <Box size={[size[0] + 0.01, 0.025, size[2] + 0.01]} pos={[0, size[1] * 0.2, 0]} mat={m.blackMetal} cast={false} />
      <mesh position={[size[0] * 0.28, 0, size[2] / 2 + 0.003]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshStandardMaterial map={plate} transparent roughness={0.6} />
      </mesh>
    </group>
  )
}

function Plant() {
  const m = getMaterials()
  const leaves = useMemo(() => {
    const r = rng(14)
    return Array.from({ length: 14 }, (_, i) => ({
      a: (i / 14) * Math.PI * 2 + r() * 0.5,
      lean: 0.25 + r() * 0.7,
      s: 0.7 + r() * 0.6,
    }))
  }, [])
  const geo = useMemo(() => new THREE.SphereGeometry(1, 10, 8), [])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <group position={[5.6, 0, -2.6]}>
      <BlobShadow pos={[0, 0]} size={[1.0, 1.0]} opacity={0.45} />
      <Cyl r={0.2} r2={0.15} h={0.34} pos={[0, 0.17, 0]} mat={m.blackMetal} />
      {leaves.map((l, i) => (
        <group key={i} rotation={[0, l.a, 0]}>
          <group position={[0.02, 0.34, 0]} rotation={[0, 0, -l.lean]}>
            <mesh geometry={geo} material={m.leaf} position={[0, 0.3 * l.s, 0]} scale={[0.07 * l.s, 0.3 * l.s, 0.012]} castShadow />
          </group>
        </group>
      ))}
    </group>
  )
}

/** Everything that makes the room feel lived in. */
export function Props() {
  return (
    <group>
      <Bench />
      <Bat />
      <Pads />
      <LockerItems />
      <Stool x={1.45} z={-2.7} />
      <Stool x={3.35} z={-2.55} />
      <FlightCase pos={[5.2, 0.3, -1.4]} size={[0.95, 0.6, 0.6]} rot={0.1} />
      <FlightCase pos={[5.18, 0.9, -1.42]} size={[0.8, 0.55, 0.5]} rot={-0.08} />
      <BlobShadow pos={[5.2, -1.4]} size={[1.9, 1.5]} opacity={0.55} />
      <Plant />
    </group>
  )
}
