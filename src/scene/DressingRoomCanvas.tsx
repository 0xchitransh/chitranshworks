import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { useStage } from '../store/useStage'
import { POSES } from './cameraState'
import { DressingRoomScene } from './DressingRoomScene'
import { disposeMaterials } from './materials'
import { disposeTextureCache } from './textures'

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('Immersive scene failed, switching to the standard layout.', error)
    const s = useStage.getState()
    s.setWebgl('failed')
    s.setImmersive(false)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const DPR_CAP = { high: 1.75, medium: 1.5, low: 1.25 } as const

/** Hosts the WebGL canvas. Mounted after first paint so the loading screen appears instantly. */
export function DressingRoomCanvas() {
  const quality = useStage((s) => s.quality)
  const [mounted, setMounted] = useState(false)
  const [dpr, setDpr] = useState<number>(DPR_CAP[quality])
  const unmounting = useRef(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    setDpr(DPR_CAP[quality])
  }, [quality])

  useEffect(() => {
    unmounting.current = false
    return () => {
      // R3F force-loses the GL context on unmount; that is not a failure.
      unmounting.current = true
    }
  }, [])

  useEffect(
    () => () => {
      disposeTextureCache()
      disposeMaterials()
    },
    [],
  )

  if (!mounted) return null

  return (
    <SceneBoundary>
      <Canvas
        className="stage__canvas"
        shadows={quality === 'low' ? false : 'percentage'}
        dpr={[1, dpr]}
        camera={{ fov: POSES.intro.fov, near: 0.1, far: 700, position: POSES.intro.pos }}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.85
          gl.setClearColor('#050506')
          scene.background = new THREE.Color('#050506')
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            if (unmounting.current) return
            const s = useStage.getState()
            s.setWebgl('failed')
            s.setImmersive(false)
          })
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d * 0.85))}
          onIncline={() => setDpr((d) => Math.min(DPR_CAP[quality], d * 1.1))}
        >
          <Suspense fallback={null}>
            <DressingRoomScene />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
    </SceneBoundary>
  )
}
