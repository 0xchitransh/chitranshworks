import type { ReactNode } from 'react'
import type * as THREE from 'three'

type V3 = [number, number, number]

interface BaseProps {
  pos?: V3
  rot?: V3
  scale?: V3 | number
  mat: THREE.Material
  cast?: boolean
  receive?: boolean
  children?: ReactNode
}

export function Box({ size, pos, rot, scale, mat, cast = true, receive = true, children }: BaseProps & { size: V3 }) {
  return (
    <mesh position={pos} rotation={rot} scale={scale} material={mat} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={size} />
      {children}
    </mesh>
  )
}

export function Cyl({
  r,
  h,
  r2,
  seg = 20,
  pos,
  rot,
  scale,
  mat,
  cast = true,
  receive = true,
  children,
}: BaseProps & { r: number; h: number; r2?: number; seg?: number }) {
  return (
    <mesh position={pos} rotation={rot} scale={scale} material={mat} castShadow={cast} receiveShadow={receive}>
      <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
      {children}
    </mesh>
  )
}

export function Ball({
  r,
  seg = 24,
  pos,
  rot,
  scale,
  mat,
  cast = true,
  receive = true,
  children,
}: BaseProps & { r: number; seg?: number }) {
  return (
    <mesh position={pos} rotation={rot} scale={scale} material={mat} castShadow={cast} receiveShadow={receive}>
      <sphereGeometry args={[r, seg, Math.max(8, seg / 2)]} />
      {children}
    </mesh>
  )
}
