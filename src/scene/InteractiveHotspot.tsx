import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { SectionId } from '../data/sections'
import { goTo } from '../hooks/useSceneNavigation'
import { useStage } from '../store/useStage'
import { radialTexture } from './textures'

type V3 = [number, number, number]

function setCursor(value: string) {
  document.body.style.cursor = value
}

interface InteractiveProps {
  /** Unique id; used to link 3D hover and the HTML hotspot. */
  id: string
  section: SectionId
  position?: V3
  rotation?: V3
  /** Custom activation (defaults to navigating to `section`). */
  onSelect?: () => void
  disabled?: boolean
  children: ReactNode
}

/**
 * Makes a group of meshes clickable: hover highlight, pointer cursor, navigation.
 * Pointer events bubble up from child meshes through R3F's event system.
 */
export function Interactive({ id, section, position, rotation, onSelect, disabled, children }: InteractiveProps) {
  const setHovered = useStage((s) => s.setHovered)
  const hoveredHere = useRef(false)

  useEffect(
    () => () => {
      if (hoveredHere.current) setCursor('')
    },
    [],
  )

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (disabled) return
    e.stopPropagation()
    hoveredHere.current = true
    setHovered(id)
    setCursor('pointer')
  }
  const out = () => {
    if (!hoveredHere.current) return
    hoveredHere.current = false
    if (useStage.getState().hovered === id) setHovered(null)
    setCursor('')
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (disabled) return
    e.stopPropagation()
    if (onSelect) onSelect()
    else goTo(section)
  }

  return (
    <group position={position} rotation={rotation} onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
    </group>
  )
}

/** Soft additive halo that fades in when an object is hovered or selected. */
export function HoverGlow({
  id,
  position,
  size,
  color = '#E87535',
  strength = 0.32,
  active,
}: {
  id: string
  position: V3
  size: [number, number]
  color?: string
  strength?: number
  /** Keep glowing while this is true (e.g. the object is the current section). */
  active?: boolean
}) {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: radialTexture('glow', [
          [0, 'rgba(255,255,255,0.9)'],
          [0.4, 'rgba(255,255,255,0.25)'],
          [1, 'rgba(255,255,255,0)'],
        ]),
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [color],
  )
  useEffect(() => () => mat.dispose(), [mat])

  useFrame((_, dt) => {
    const hovered = useStage.getState().hovered === id
    const target = hovered ? strength : active ? strength * 0.4 : 0
    mat.opacity += (target - mat.opacity) * (1 - Math.exp(-10 * dt))
  })

  return <sprite position={position} scale={[size[0], size[1], 1]} material={mat} renderOrder={6} />
}
