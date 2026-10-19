import { useMemo } from 'react'
import { useStage } from '../store/useStage'
import { plaques } from '../data/experience'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import { getMaterials } from './materials'
import { Box, Cyl } from './primitives'
import { labelTexture } from './textures'
import { ROOM } from './layout'

const Z = ROOM.zBack
const DEPTH = 0.6

function Louvres({ w, h, z }: { w: number; h: number; z: number }) {
  const m = getMaterials()
  const rows = 9
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          size={[w * 0.62, 0.012, 0.012]}
          pos={[0, h * 0.28 - i * 0.05, z]}
          mat={m.blackMetal}
          cast={false}
        />
      ))}
    </group>
  )
}

/** A closed locker: walnut body, recessed door, vents, handle and number plate. */
function ClosedLocker({ x, w, number }: { x: number; w: number; number: string }) {
  const m = getMaterials()
  const plate = useMemo(
    () => labelTexture(`n${number}`, number, { w: 128, h: 64, bg: '#1a1714', fg: '#DCA45B', spacing: 2 }),
    [number],
  )
  return (
    <group position={[x, 0, Z + DEPTH / 2]}>
      <Box size={[w, 2.7, DEPTH]} pos={[0, 1.35, 0]} mat={m.walnut} />
      <Box size={[w - 0.14, 2.52, 0.04]} pos={[0, 1.36, DEPTH / 2 + 0.01]} mat={m.walnutDark} />
      <group position={[0, 1.7, DEPTH / 2 + 0.035]}>
        <Louvres w={w} h={1.4} z={0} />
      </group>
      <Box size={[0.03, 0.2, 0.035]} pos={[w / 2 - 0.15, 1.2, DEPTH / 2 + 0.05]} mat={m.steel} />
      <mesh position={[0, 2.3, DEPTH / 2 + 0.034]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshStandardMaterial map={plate} roughness={0.6} />
      </mesh>
    </group>
  )
}

export function LockerSystem() {
  const m = getMaterials()
  const section = useStage((s) => s.section)
  const labels = useMemo(
    () =>
      plaques.map((p, i) =>
        labelTexture(`plaque${i}`, p, {
          w: 512,
          h: 128,
          bg: '#171310',
          fg: '#7a746b',
          font: '700 56px Inter, Arial, sans-serif',
          spacing: 10,
        }),
      ),
    [],
  )

  const open = { x0: -3.6, x1: -1.6 }
  const ow = open.x1 - open.x0
  const ox = (open.x0 + open.x1) / 2

  return (
    <group>
      {/* Plinth under the whole bank */}
      <Box size={[4.4, 0.1, DEPTH + 0.06]} pos={[-3.8, 0.05, Z + DEPTH / 2 + 0.01]} mat={m.blackMetal} cast={false} />

      {/* Closed lockers + plaque cabinets: "The Journey" */}
      <Interactive id="journey" section="journey">
        <HoverGlow id="journey" position={[-4.7, 2.2, -3.0]} size={[3.6, 3.6]} strength={0.2} active={section === 'journey'} />
        <ClosedLocker x={-5.325} w={1.15} number="03" />
        <ClosedLocker x={-4.175} w={1.15} number="07" />
        {labels.map((tex, i) => (
          <group key={i} position={[-5.18 + i * 1.46, 3.18, Z + 0.3]}>
            <Box size={[1.4, 0.68, 0.6]} mat={m.walnutDark} />
            <mesh position={[0, 0, 0.301]}>
              <planeGeometry args={[1.12, 0.28]} />
              <meshStandardMaterial map={tex} roughness={0.5} metalness={0.2} />
            </mesh>
          </group>
        ))}
      </Interactive>

      {/* The open locker */}
      <group position={[ox, 0, Z]}>
        {/* back panel */}
        <Box size={[ow, 2.7, 0.04]} pos={[0, 1.35, 0.03]} mat={m.lightWood} />
        {/* sides, top */}
        <Box size={[0.06, 2.7, DEPTH]} pos={[-ow / 2 + 0.03, 1.35, DEPTH / 2]} mat={m.walnut} />
        <Box size={[0.06, 2.7, DEPTH]} pos={[ow / 2 - 0.03, 1.35, DEPTH / 2]} mat={m.walnut} />
        <Box size={[ow, 0.08, DEPTH]} pos={[0, 2.66, DEPTH / 2]} mat={m.walnut} />
        {/* shelves */}
        <Box size={[ow - 0.1, 0.045, DEPTH - 0.04]} pos={[0, 0.98, DEPTH / 2]} mat={m.walnut} />
        <Box size={[ow - 0.1, 0.045, DEPTH - 0.04]} pos={[0, 0.2, DEPTH / 2]} mat={m.walnut} />
        {/* hanging rail */}
        <Cyl r={0.014} h={ow - 0.1} rot={[0, 0, Math.PI / 2]} pos={[0, 2.42, 0.36]} mat={m.steel} seg={10} />
        {/* warm strip under the top and shelf */}
        <Box size={[ow - 0.3, 0.02, 0.03]} pos={[0, 2.6, DEPTH - 0.08]} mat={m.warmEmit} cast={false} receive={false} />
        <Box size={[ow - 0.3, 0.015, 0.025]} pos={[0, 0.955, DEPTH - 0.06]} mat={m.warmEmit} cast={false} receive={false} />
        {/* ajar door, hinged on the right */}
        <group position={[ow / 2 - 0.02, 0, DEPTH]} rotation={[0, 1.75, 0]}>
          <Box size={[0.96, 2.6, 0.04]} pos={[-0.48, 1.35, 0]} mat={m.walnut} />
          <group position={[-0.48, 1.7, 0.025]}>
            <Louvres w={0.96} h={1.4} z={0} />
          </group>
          <Box size={[0.03, 0.18, 0.03]} pos={[-0.12, 1.2, 0.03]} mat={m.steel} />
        </group>
      </group>
    </group>
  )
}

