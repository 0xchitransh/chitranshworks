import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORK_AREAS, projects } from '../data/projects'
import { useStage } from '../store/useStage'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import { getMaterials } from './materials'
import { Box, Cyl } from './primitives'
import { makeCanvas, labelTexture } from './textures'

const W = 1024
const H = 600
const MONO = '"JetBrains Mono", Menlo, monospace'

function drawScreen(ctx: CanvasRenderingContext2D, caret: boolean, active: boolean) {
  ctx.fillStyle = '#0c0c0e'
  ctx.fillRect(0, 0, W, H)

  // Title bar
  ctx.fillStyle = '#151518'
  ctx.fillRect(0, 0, W, 54)
  ;['#4a4743', '#4a4743', '#4a4743'].forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(34 + i * 26, 27, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.fillStyle = '#92908B'
  ctx.font = `500 20px ${MONO}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText('innings — chitransh.raj', W / 2, 28)

  // Sidebar
  ctx.fillStyle = '#101013'
  ctx.fillRect(0, 54, 300, H - 54)
  ctx.textAlign = 'left'
  ctx.font = `500 15px ${MONO}`
  ctx.fillStyle = '#6d6a64'
  ctx.fillText('WORK AREAS', 28, 96)
  ctx.font = `400 19px ${MONO}`
  WORK_AREAS.forEach((area, i) => {
    const y = 140 + i * 48
    if (i === 0) {
      ctx.fillStyle = 'rgba(232,117,53,0.12)'
      ctx.fillRect(14, y - 24, 272, 40)
      ctx.fillStyle = '#E87535'
      ctx.fillRect(14, y - 24, 3, 40)
    }
    ctx.fillStyle = i === 0 ? '#F1E9DB' : '#92908B'
    ctx.fillText(area.length > 24 ? `${area.slice(0, 23)}…` : area, 32, y)
  })

  // Terminal pane
  const x = 336
  let y = 112
  const line = (text: string, color: string, size = 21) => {
    ctx.font = `400 ${size}px ${MONO}`
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
    y += size + 16
  }
  line('$ ls ./innings', '#92908B')
  projects.forEach((p, i) => {
    line(`  ${String(i + 1).padStart(2, '0')}  ${p.name.toLowerCase().replace(/ /g, '-')}/`, active && i === 0 ? '#E87535' : '#DCA45B')
  })
  y += 14
  line('$ cat approach.md', '#92908B')
  line('  Same hunger.', '#F1E9DB', 26)
  line('  Different field.', '#F1E9DB', 26)
  y += 6
  ctx.font = `400 21px ${MONO}`
  ctx.fillStyle = '#E87535'
  ctx.fillText('$', x, y)
  if (caret) ctx.fillRect(x + 22, y - 16, 12, 26)
}

/** Desk, monitor and the stack of "identity" books. The monitor opens the project explorer. */
export function Workstation() {
  const m = getMaterials()
  const focused = useStage((s) => s.section === 'projects')
  const blink = useRef(0)
  const caret = useRef(true)

  const screen = useMemo(() => {
    const [canvas, ctx] = makeCanvas(W, H)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: '#d9d4ca' })
    const redraw = (c: boolean, active: boolean) => {
      drawScreen(ctx, c, active)
      tex.needsUpdate = true
    }
    redraw(true, false)
    return { tex, mat, redraw }
  }, [])

  const books = useMemo(
    () =>
      ['BLOCKCHAIN', 'PRODUCT', 'GROWTH', 'CRICKET'].map((label, i) => ({
        label,
        tex: labelTexture(`book-${label}`, label, {
          w: 512,
          h: 96,
          bg: ['#2a2420', '#25201c', '#2d2723', '#211c18'][i],
          fg: '#c9b79a',
          font: '700 44px Inter, Arial, sans-serif',
          spacing: 8,
        }),
      })),
    [],
  )

  useEffect(() => {
    if (!('fonts' in document)) return
    document.fonts
      .load('400 20px "JetBrains Mono"')
      .then(() => screen.redraw(caret.current, focused))
      .catch(() => undefined)
  }, [screen, focused])

  useEffect(
    () => () => {
      screen.tex.dispose()
      screen.mat.dispose()
    },
    [screen],
  )

  useEffect(() => {
    screen.redraw(caret.current, focused)
  }, [focused, screen])

  useFrame((_, dt) => {
    if (useStage.getState().reducedMotion) return
    blink.current += dt
    if (blink.current > 0.55) {
      blink.current = 0
      caret.current = !caret.current
      screen.redraw(caret.current, focused)
    }
  })

  return (
    <group>
      {/* Desk */}
      <Box size={[3.3, 0.06, 0.85]} pos={[4.25, 0.83, -3.52]} mat={m.walnut} />
      <Box size={[0.06, 0.8, 0.8]} pos={[2.64, 0.4, -3.52]} mat={m.walnutDark} />
      <Box size={[0.06, 0.8, 0.8]} pos={[5.86, 0.4, -3.52]} mat={m.walnutDark} />
      <Box size={[3.1, 0.5, 0.03]} pos={[4.25, 0.55, -3.9]} mat={m.walnutDark} />
      <Box size={[0.8, 0.7, 0.75]} pos={[5.35, 0.45, -3.5]} mat={m.walnutDark} />
      {[0.55, 0.3].map((y) => (
        <group key={y}>
          <Box size={[0.7, 0.2, 0.02]} pos={[5.35, y + 0.12, -3.125]} mat={m.walnut} />
          <Box size={[0.2, 0.02, 0.03]} pos={[5.35, y + 0.18, -3.105]} mat={m.steel} />
        </group>
      ))}

      <Interactive id="projects" section="projects">
        <HoverGlow id="projects" position={[3.55, 1.3, -3.2]} size={[2.4, 1.5]} active={focused} />
        <group position={[3.45, 0.86, -3.55]} rotation={[0, -0.22, 0]}>
          {/* Monitor */}
          <Cyl r={0.11} h={0.015} pos={[0, 0.0075, 0]} mat={m.blackMetal} />
          <Box size={[0.05, 0.22, 0.03]} pos={[0, 0.12, -0.02]} mat={m.blackMetal} />
          <Box size={[0.94, 0.56, 0.035]} pos={[0, 0.5, 0]} mat={m.blackMetal} />
          <mesh position={[0, 0.5, 0.0185]} material={screen.mat}>
            <planeGeometry args={[0.89, 0.52]} />
          </mesh>
          {/* Keyboard and mouse */}
          <Box size={[0.42, 0.015, 0.14]} pos={[0.02, 0.0075, 0.27]} mat={m.blackMetal} />
          <Box size={[0.04, 0.012, 0.065]} pos={[0.36, 0.006, 0.28]} mat={m.blackMetal} />
        </group>
      </Interactive>

      {/* Desk lamp */}
      <group position={[4.55, 0.86, -3.7]}>
        <Cyl r={0.07} h={0.02} pos={[0, 0.01, 0]} mat={m.blackMetal} />
        <Box size={[0.014, 0.42, 0.014]} pos={[0, 0.22, 0]} rot={[0, 0, 0.12]} mat={m.blackMetal} />
        <Box size={[0.014, 0.3, 0.014]} pos={[0.07, 0.5, 0]} rot={[0, 0, -1.1]} mat={m.blackMetal} />
        <Cyl r={0.07} r2={0.025} h={0.1} pos={[0.2, 0.5, 0]} rot={[0, 0, 0.3]} mat={m.blackMetal} />
        <Cyl r={0.03} h={0.02} pos={[0.2, 0.44, 0]} mat={m.warmEmit} cast={false} />
      </group>
      <pointLight position={[4.5, 1.25, -3.5]} color="#ffb870" intensity={1.8} distance={2.6} decay={2} />
      <pointLight position={[3.4, 1.32, -3.0]} color="#e5d6c0" intensity={0.8} distance={2} decay={2} />

      {/* Identity books */}
      {books.map((b, i) => (
        <group key={b.label} position={[4.95, 0.86 + 0.025 + i * 0.052, -3.45]} rotation={[0, (i % 2 ? 0.06 : -0.05), 0]}>
          <Box size={[0.42, 0.05, 0.28]} mat={m.leatherDark} />
          <mesh position={[0, 0, 0.1405]}>
            <planeGeometry args={[0.4, 0.048]} />
            <meshStandardMaterial map={b.tex} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Mug */}
      <Cyl r={0.04} h={0.09} pos={[3.95, 0.915, -3.3]} mat={m.cream} />
    </group>
  )
}
