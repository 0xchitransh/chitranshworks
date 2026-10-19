import * as THREE from 'three'
import { fabricTexture, weaveBump, woodTexture } from './textures'

export interface Materials {
  walnut: THREE.MeshStandardMaterial
  walnutDark: THREE.MeshStandardMaterial
  lightWood: THREE.MeshStandardMaterial
  blackMetal: THREE.MeshStandardMaterial
  steel: THREE.MeshStandardMaterial
  gold: THREE.MeshStandardMaterial
  leatherDark: THREE.MeshStandardMaterial
  ballRed: THREE.MeshStandardMaterial
  cream: THREE.MeshStandardMaterial
  towel: THREE.MeshStandardMaterial
  canvasBag: THREE.MeshStandardMaterial
  rubber: THREE.MeshStandardMaterial
  helmet: THREE.MeshStandardMaterial
  paper: THREE.MeshStandardMaterial
  leaf: THREE.MeshStandardMaterial
  case: THREE.MeshStandardMaterial
  warmEmit: THREE.MeshBasicMaterial
  stripEmit: THREE.MeshBasicMaterial
  accent: THREE.MeshStandardMaterial
}

let current: Materials | null = null

export function getMaterials(): Materials {
  if (current) return current
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)
  current = {
    walnut: std({
      color: '#ffffff',
      map: woodTexture('locker', { planks: 4, base: [86, 56, 34], seed: 11, grime: 0.3 }, [1, 1]),
      roughness: 0.62,
    }),
    walnutDark: std({
      color: '#ffffff',
      map: woodTexture('dark', { planks: 3, base: [48, 31, 19], seed: 23, grime: 0.35 }, [1, 1]),
      roughness: 0.7,
    }),
    lightWood: std({
      color: '#ffffff',
      map: woodTexture('light', { planks: 2, base: [190, 150, 100], seed: 5, grime: 0.15 }, [1, 1]),
      roughness: 0.55,
    }),
    blackMetal: std({ color: '#161618', metalness: 0.85, roughness: 0.42 }),
    steel: std({ color: '#8a8c91', metalness: 1, roughness: 0.28 }),
    gold: std({ color: '#c19244', metalness: 1, roughness: 0.26 }),
    leatherDark: std({ color: '#2b211b', roughness: 0.72, bumpMap: weaveBump(60), bumpScale: 0.2 }),
    ballRed: std({ color: '#8f1c12', roughness: 0.42 }),
    cream: std({ color: '#cfc4ad', roughness: 0.88 }),
    towel: std({
      color: '#ffffff',
      map: fabricTexture('towel', '#d9cfbc', '#b9ae98', 1.4),
      bumpMap: weaveBump(12),
      bumpScale: 0.6,
      roughness: 0.95,
    }),
    canvasBag: std({
      color: '#ffffff',
      map: fabricTexture('bag', '#3a342e', '#26221e', 2),
      bumpMap: weaveBump(26),
      bumpScale: 0.8,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    rubber: std({ color: '#101011', roughness: 0.9 }),
    helmet: std({ color: '#1b2430', roughness: 0.38, metalness: 0.15 }),
    paper: std({ color: '#e5dcc8', roughness: 0.95 }),
    leaf: std({ color: '#2e4630', roughness: 0.7, side: THREE.DoubleSide }),
    case: std({
      color: '#ffffff',
      map: fabricTexture('case', '#2c2824', '#1a1714', 1.2),
      roughness: 0.78,
      metalness: 0.1,
    }),
    warmEmit: new THREE.MeshBasicMaterial({ color: '#ffc98a', toneMapped: false }),
    stripEmit: new THREE.MeshBasicMaterial({ color: '#b9814f' }),
    accent: std({ color: '#E87535', roughness: 0.5, emissive: '#E87535', emissiveIntensity: 0.15 }),
  }
  return current
}

export function disposeMaterials(): void {
  if (!current) return
  Object.values(current).forEach((m) => m.dispose())
  current = null
}
