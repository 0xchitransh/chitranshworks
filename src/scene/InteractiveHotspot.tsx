import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { SectionId } from '../data/sections'
import { goTo } from '../hooks/useSceneNavigation'
import { useStage } from '../store/useStage'
import { radialTexture } from './textures'

type V3 = [number, number, number]

/**
 * Stable DOM target for hotspot overlays. drei's <Html> tears down and rebuilds its
 * React root whenever its default target changes, which can leave hotspots empty.
 */
export const hotspotHost: { current: HTMLElement | null } = { current: null }
const HTML_STYLE = { pointerEvents: 'none' } as const
const HTML_RANGE: [number, number] = [12, 0]

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

interface HotspotProps {
  id: string
  section: SectionId
  position: V3
  label: string
  sub: string
  onSelect?: () => void
  /** Place label on the left of the dot. */
  flip?: boolean
}

/** Real <button> anchored to a 3D point: keyboard focusable, labelled, and mirrors 3D hover. */
export function Hotspot({ id, section, position, label, sub, onSelect, flip }: HotspotProps) {
  const entered = useStage((s) => s.entered)
  const current = useStage((s) => s.section)
  const hovered = useStage((s) => s.hovered === id)
  const setHovered = useStage((s) => s.setHovered)
  const immersiveReady = useStage((s) => s.sceneReady)

  // Hidden once a section is focused (the content panel takes over).
  const visible = immersiveReady && current === 'home'
  const compact = !entered

  return (
    <Html
      position={position}
      center
      zIndexRange={HTML_RANGE}
      style={HTML_STYLE}
      portal={hotspotHost.current ? (hotspotHost as React.RefObject<HTMLElement>) : undefined}
    >
      <button
        type="button"
        className={`hotspot${hovered ? ' is-hovered' : ''}${compact ? ' is-compact' : ''}${visible ? '' : ' is-hidden'}${flip ? ' is-flipped' : ''}`}
        aria-label={`${label}: ${sub}`}
        tabIndex={visible ? 0 : -1}
        aria-hidden={visible ? undefined : true}
        onPointerEnter={() => setHovered(id)}
        onPointerLeave={() => useStage.getState().hovered === id && setHovered(null)}
        onFocus={() => setHovered(id)}
        onBlur={() => useStage.getState().hovered === id && setHovered(null)}
        onClick={() => (onSelect ? onSelect() : goTo(section))}
      >
        <span className="hotspot__dot" aria-hidden="true" />
        <span className="hotspot__text">
          <span className="hotspot__label">{label}</span>
          <span className="hotspot__sub">{sub}</span>
        </span>
      </button>
    </Html>
  )
}
