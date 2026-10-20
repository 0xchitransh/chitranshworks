import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { useStage } from '../store/useStage'
import { BOARD_H, BOARD_W, drawBoard } from './boardArt'
import { HoverGlow, Interactive } from './InteractiveHotspot'
import { getMaterials } from './materials'
import { Box } from './primitives'
import { POS } from './layout'
import { mood } from './mood'
import { makeCanvas } from './textures'

/** The whiteboard: a cricket field plan that redraws itself into a product architecture on focus. */
export function StrategyBoard() {
  const focused = useStage((s) => s.section === 'strategy')
  const m = getMaterials()
  const progress = useRef({ t: 0 })

  const art = useMemo(() => {
    const [canvas, ctx] = makeCanvas(BOARD_W, BOARD_H)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    const redraw = () => {
      drawBoard(ctx, progress.current.t)
      tex.needsUpdate = true
    }
    redraw()
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: '#ffffff',
      emissiveIntensity: 0.18,
      roughness: 0.38,
      metalness: 0,
    })
    return { tex, mat, redraw }
  }, [])

  const notes = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: '#e9cf6a', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: '#dcb05a', roughness: 0.9 }),
    ],
    [],
  )

  useEffect(
    () => () => {
      art.tex.dispose()
      art.mat.dispose()
      notes.forEach((n) => n.dispose())
    },
    [art, notes],
  )

  // Handwriting and label fonts load lazily; redraw once they are ready.
  useEffect(() => {
    if (!('fonts' in document)) return
    Promise.all([
      document.fonts.load('600 18px "Inter Variable"'),
      document.fonts.load('700 34px "Bradley Hand"'),
    ])
      .then(() => art.redraw())
      .catch(() => undefined)
  }, [art])

  useFrame(() => {
    art.mat.emissiveIntensity = 0.18 + 0.2 * mood.area.board
  })

  useEffect(() => {
    const reduced = useStage.getState().reducedMotion
    const state = progress.current
    gsap.killTweensOf(state)
    const target = focused ? 1 : 0
    if (reduced) {
      state.t = target
      art.redraw()
      return
    }
    gsap.to(state, {
      t: target,
      duration: focused ? 1.9 : 0.9,
      delay: focused ? 0.55 : 0,
      ease: 'none',
      onUpdate: art.redraw,
    })
    return () => {
      gsap.killTweensOf(state)
    }
  }, [focused, art])

  return (
    <Interactive id="strategy" section="strategy" position={POS.board}>
      <HoverGlow id="strategy" position={[0, 0, 0.4]} size={[3.2, 2.4]} active={focused} />
      {/* Frame and tray */}
      <Box size={[2.14, 1.44, 0.05]} pos={[0, 0, 0.025]} mat={m.steel} />
      <mesh position={[0, 0, 0.052]} material={art.mat} receiveShadow>
        <planeGeometry args={[2.0, 1.3]} />
      </mesh>
      <Box size={[1.7, 0.04, 0.09]} pos={[0, -0.74, 0.06]} mat={m.steel} />
      <Box size={[0.13, 0.02, 0.02]} pos={[-0.3, -0.7, 0.1]} rot={[0, 0.2, 0]} mat={m.accent} />
      <Box size={[0.13, 0.02, 0.02]} pos={[-0.1, -0.7, 0.1]} rot={[0, -0.1, 0]} mat={m.blackMetal} />
      {/* Sticky notes */}
      <Box size={[0.17, 0.17, 0.004]} pos={[1.2, 0.35, 0.03]} rot={[0, 0, 0.08]} mat={notes[0]} />
      <Box size={[0.17, 0.17, 0.004]} pos={[1.22, 0.12, 0.03]} rot={[0, 0, -0.1]} mat={notes[1]} />
    </Interactive>
  )
}
