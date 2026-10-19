import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { achievements } from '../data/achievements'
import { goTo } from '../hooks/useSceneNavigation'
import { useStage } from '../store/useStage'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import { getMaterials } from './materials'
import { Ball, Box } from './primitives'
import { makeCanvas } from './textures'

function cupGeometry(tall: number): THREE.LatheGeometry {
  const pts = [
    [0.001, 0],
    [0.065, 0],
    [0.065, 0.012],
    [0.04, 0.03],
    [0.018, 0.05],
    [0.014, 0.1 * tall],
    [0.034, 0.115 * tall],
    [0.05, 0.14 * tall],
    [0.066, 0.19 * tall],
    [0.072, 0.25 * tall],
    [0.07, 0.27 * tall],
    [0.062, 0.268 * tall],
    [0.058, 0.2 * tall],
    [0.001, 0.15 * tall],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(pts, 28)
}

function photoTexture(): THREE.Texture {
  const [c, ctx] = makeCanvas(512, 384)
  const g = ctx.createLinearGradient(0, 0, 0, 384)
  g.addColorStop(0, '#6b5640')
  g.addColorStop(0.6, '#a98a62')
  g.addColorStop(1, '#4a3a2a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 384)
  // horizon / ground
  ctx.fillStyle = 'rgba(40,30,20,0.55)'
  ctx.fillRect(0, 262, 512, 122)
  // stumps
  ctx.strokeStyle = '#e7d9bd'
  ctx.lineWidth = 6
  for (const x of [338, 354, 370]) {
    ctx.beginPath()
    ctx.moveTo(x, 250)
    ctx.lineTo(x, 330)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(334, 248)
  ctx.lineTo(374, 248)
  ctx.stroke()
  // crouching keeper silhouette
  ctx.fillStyle = '#17120d'
  ctx.beginPath()
  ctx.arc(190, 178, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(165, 205)
  ctx.quadraticCurveTo(150, 260, 175, 300)
  ctx.lineTo(150, 345)
  ctx.lineTo(205, 345)
  ctx.lineTo(235, 300)
  ctx.quadraticCurveTo(262, 250, 232, 208)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(228, 232)
  ctx.lineTo(292, 262)
  ctx.lineTo(284, 280)
  ctx.lineTo(222, 256)
  ctx.closePath()
  ctx.fill()
  // vignette
  const v = ctx.createRadialGradient(256, 192, 90, 256, 192, 300)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, 512, 384)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** A shelf holding exactly the verified milestones from `data/achievements.ts`. */
export function TrophyShelf() {
  const m = getMaterials()
  const section = useStage((s) => s.section)
  const geos = useMemo(() => [cupGeometry(1), cupGeometry(1.2)], [])
  const photo = useMemo(() => photoTexture(), [])
  useEffect(
    () => () => {
      geos.forEach((g) => g.dispose())
      photo.dispose()
    },
    [geos, photo],
  )

  const open = (id: string) => {
    useStage.getState().setAchievement(id)
    goTo('achievements')
  }
  const trophies = achievements.filter((a) => a.kind === 'trophy')
  const frames = achievements.filter((a) => a.kind === 'frame')
  const selected = useStage((s) => s.achievementId)
  const focus = (id: string) => section === 'achievements' && selected === id

  return (
    <group position={[-0.4, 0, -3.93]}>
      {/* Boards and brackets */}
      {[1.5, 2.3].map((y) => (
        <group key={y}>
          <Box size={[1.9, 0.045, 0.3]} pos={[0, y, 0.15]} mat={m.walnut} />
          {[-0.8, 0.8].map((x) => (
            <Box key={x} size={[0.04, 0.16, 0.22]} pos={[x, y - 0.1, 0.12]} mat={m.blackMetal} />
          ))}
        </group>
      ))}

      {trophies.map((t, i) => (
        <Interactive key={t.id} id={`ach-${t.id}`} section="achievements" position={[-0.55 + i * 0.85, 2.325, 0.15]} onSelect={() => open(t.id)}>
          <HoverGlow id={`ach-${t.id}`} position={[0, 0.17, 0.3]} size={[0.8, 0.8]} color="#DCA45B" active={focus(t.id)} />
          <Box size={[0.14, 0.04, 0.14]} pos={[0, 0.02, 0]} mat={m.walnutDark} />
          <mesh geometry={geos[i % 2]} material={m.gold} position={[0, 0.04, 0]} castShadow receiveShadow />
          <mesh position={[-0.085, 0.17 * (i % 2 ? 1.2 : 1), 0]} material={m.gold} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.03, 0.007, 8, 16]} />
          </mesh>
          <mesh position={[0.085, 0.17 * (i % 2 ? 1.2 : 1), 0]} material={m.gold}>
            <torusGeometry args={[0.03, 0.007, 8, 16]} />
          </mesh>
        </Interactive>
      ))}

      {frames.map((f) => (
        <Interactive key={f.id} id={`ach-${f.id}`} section="achievements" position={[-0.05, 1.52, 0.12]} onSelect={() => open(f.id)}>
          <HoverGlow id={`ach-${f.id}`} position={[0, 0.17, 0.2]} size={[0.9, 0.7]} color="#DCA45B" active={focus(f.id)} />
          <group rotation={[-0.1, 0, 0]} position={[0, 0.02, 0]}>
            <Box size={[0.46, 0.35, 0.025]} pos={[0, 0.175, 0]} mat={m.blackMetal} />
            <Box size={[0.4, 0.29, 0.005]} pos={[0, 0.175, 0.014]} mat={m.paper} cast={false} />
            <mesh position={[0, 0.175, 0.018]}>
              <planeGeometry args={[0.34, 0.255]} />
              <meshStandardMaterial map={photo} roughness={0.6} />
            </mesh>
          </group>
        </Interactive>
      ))}

      <pointLight position={[0, 2.85, 0.6]} color="#ffbf80" intensity={5} distance={3.8} decay={2} />
      <pointLight position={[0, 1.2, 0.8]} color="#ffb673" intensity={2} distance={3} decay={2} />
      {/* Small details */}
      <Ball r={0.036} pos={[-0.75, 1.575, 0.18]} mat={m.ballRed} />
      <Ball r={0.036} pos={[0.65, 1.575, 0.18]} mat={m.ballRed} />
    </group>
  )
}
