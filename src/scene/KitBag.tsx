import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { useStage } from '../store/useStage'
import { BlobShadow } from './BlobShadow'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import { POS } from './layout'
import { getMaterials } from './materials'
import { Ball, Box, Cyl } from './primitives'
import { labelTexture } from './textures'

const OPEN_ANGLE = -1.95

/** Duffel bag whose lid swings open while the Skills section is focused. */
export function KitBag() {
  const m = getMaterials()
  const open = useStage((s) => s.section === 'skills')
  const lid = useRef<THREE.Group>(null)
  const glow = useRef<THREE.PointLight>(null)
  const openness = useRef(0)

  const crest = useMemo(
    () =>
      labelTexture('bag-c', 'C.', {
        w: 128,
        h: 128,
        fg: '#E87535',
        font: '800 96px Georgia, serif',
        spacing: 0,
      }),
    [],
  )

  useEffect(() => {
    const target = open ? OPEN_ANGLE : 0
    const reduced = useStage.getState().reducedMotion
    if (!lid.current) return
    gsap.killTweensOf(lid.current.rotation)
    if (reduced) {
      lid.current.rotation.x = target
      return
    }
    gsap.to(lid.current.rotation, {
      x: target,
      duration: open ? 1.0 : 0.8,
      delay: open ? 0.45 : 0,
      ease: open ? 'back.out(1.25)' : 'power2.inOut',
    })
  }, [open])

  useFrame((_, dt) => {
    if (!lid.current || !glow.current) return
    const k = THREE.MathUtils.clamp(lid.current.rotation.x / OPEN_ANGLE, 0, 1)
    openness.current += (k - openness.current) * (1 - Math.exp(-12 * dt))
    glow.current.intensity = openness.current * 2.2
  })

  return (
    <group position={POS.bag} rotation={[0, -0.38, 0]}>
      <BlobShadow pos={[0, 0]} size={[1.9, 1.2]} opacity={0.6} />
      <Interactive id="skills" section="skills">
        <HoverGlow id="skills" position={[0, 0.4, 0.5]} size={[2.2, 1.4]} active={open} />
        {/* Body */}
        <RoundedBox args={[1.1, 0.34, 0.56]} radius={0.07} smoothness={4} position={[0, 0.19, 0]} castShadow receiveShadow material={m.canvasBag} />
        {/* Front straps, crest, pocket */}
        <Box size={[0.06, 0.3, 0.012]} pos={[-0.3, 0.19, 0.282]} mat={m.leatherDark} />
        <Box size={[0.06, 0.3, 0.012]} pos={[0.3, 0.19, 0.282]} mat={m.leatherDark} />
        <Box size={[0.4, 0.2, 0.03]} pos={[0, 0.16, 0.285]} mat={m.canvasBag} />
        <mesh position={[0.38, 0.2, 0.289]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshStandardMaterial map={crest} transparent roughness={0.6} />
        </mesh>
        {/* End pockets */}
        <Box size={[0.05, 0.22, 0.4]} pos={[-0.57, 0.17, 0]} mat={m.leatherDark} />
        <Box size={[0.05, 0.22, 0.4]} pos={[0.57, 0.17, 0]} mat={m.leatherDark} />
        {/* Interior, visible once the lid is open */}
        <Box size={[1.04, 0.01, 0.5]} pos={[0, 0.355, 0]} mat={m.rubber} cast={false} />
        <Ball r={0.038} pos={[0.28, 0.4, 0.05]} mat={m.ballRed} />
        <Cyl r={0.06} h={0.34} rot={[0, 0, Math.PI / 2]} pos={[-0.15, 0.4, -0.05]} mat={m.towel} />
        <Box size={[0.2, 0.05, 0.14]} pos={[0.05, 0.385, 0.08]} rot={[0, 0.3, 0]} mat={m.leatherDark} />
        <Box size={[0.12, 0.06, 0.1]} pos={[-0.4, 0.39, 0.1]} rot={[0, -0.4, 0]} mat={m.cream} />
        <pointLight position={[0.2, 1.1, 0.9]} color="#ffc48f" intensity={2.2} distance={3.5} decay={2} />
        <pointLight ref={glow} position={[0, 0.7, 0.1]} color="#ffb36b" intensity={0} distance={2.4} decay={2} />

        {/* Lid hinged on the back edge */}
        <group ref={lid} position={[0, 0.355, -0.28]}>
          <mesh position={[0, 0, 0.28]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]} material={m.canvasBag} castShadow receiveShadow>
            <cylinderGeometry args={[0.28, 0.28, 1.08, 24, 1, false, 0, Math.PI]} />
          </mesh>
          <Box size={[0.07, 0.012, 0.56]} pos={[0, 0.275, 0.28]} mat={m.leatherDark} />
          {/* Carry handle */}
          <mesh position={[0, 0.27, 0.28]} rotation={[0, Math.PI / 2, 0]} material={m.leatherDark}>
            <torusGeometry args={[0.1, 0.014, 8, 20, Math.PI]} />
          </mesh>
        </group>
      </Interactive>
    </group>
  )
}
