import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { radialTexture } from './textures'

/** Cheap soft contact shadow for floor-standing objects. */
export function BlobShadow({
  pos,
  size,
  opacity = 0.55,
  rot = 0,
}: {
  pos: [number, number]
  size: [number, number]
  opacity?: number
  rot?: number
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTexture('blob', [
          [0, 'rgba(255,255,255,1)'],
          [0.55, 'rgba(255,255,255,0.55)'],
          [1, 'rgba(255,255,255,0)'],
        ]),
        color: '#000000',
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    [opacity],
  )
  useEffect(() => () => mat.dispose(), [mat])
  return (
    <mesh position={[pos[0], 0.006, pos[1]]} rotation={[-Math.PI / 2, 0, rot]} material={mat} renderOrder={1}>
      <planeGeometry args={size} />
    </mesh>
  )
}
