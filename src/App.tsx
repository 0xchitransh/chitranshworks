import { Suspense, lazy, useEffect } from 'react'
import { useAudioSync } from './audio/useAudioSync'
import { SECTION_BY_ID } from './data/sections'
import { profile } from './data/profile'
import { useSyncReducedMotion } from './hooks/useReducedMotion'
import { useEscapeToHome, useHashSync } from './hooks/useSceneNavigation'
import { useCapabilityCheck } from './hooks/useWebGLSupport'
import { usePanelOpen, useStage } from './store/useStage'
import { Controls } from './ui/Controls'
import { ConventionalPortfolio } from './ui/ConventionalPortfolio'
import { JerseyHud } from './ui/JerseyHud'
import { JourneyMeter } from './ui/JourneyMeter'
import { LoadingScreen } from './ui/LoadingScreen'
import { Navigation } from './ui/Navigation'
import { PanelHost } from './ui/PanelHost'

// The 3D bundle loads after the loading screen is already on screen.
const DressingRoomCanvas = lazy(() =>
  import('./scene/DressingRoomCanvas').then((m) => ({ default: m.DressingRoomCanvas })),
)

function ImmersiveExperience() {
  const entered = useStage((s) => s.entered)
  const section = useStage((s) => s.section)
  const cleaning = useStage((s) => s.jersey === 'cleaning' && s.section === 'about')
  const panelOpen = usePanelOpen()
  const setImmersive = useStage((s) => s.setImmersive)

  return (
    <main
      className="stage"
      data-entered={entered}
      data-section={section}
      data-panel={panelOpen}
      data-cleaning={cleaning}
    >
      <button type="button" className="skip-link" onClick={() => setImmersive(false)}>
        Skip the 3D room and read the standard portfolio
      </button>
      <div className="stage__canvas-host" role="img" aria-label="Interactive 3D cricket dressing room. Use the navigation to explore every section." style={{ display: 'contents' }}>
        <Suspense fallback={null}>
          <DressingRoomCanvas />
        </Suspense>
      </div>
      <div className="vignette" />
      <h1 className="sr-only">{profile.name}: {profile.tagline}</h1>
      <Navigation />
      <PanelHost />
      <JourneyMeter />
      <JerseyHud />
      <Controls />
      <LoadingScreen />
    </main>
  )
}

export default function App() {
  useCapabilityCheck()
  useSyncReducedMotion()
  useHashSync()
  useEscapeToHome()
  useAudioSync()

  const webgl = useStage((s) => s.webgl)
  const immersive = useStage((s) => s.immersive)
  const section = useStage((s) => s.section)

  useEffect(() => {
    const meta = SECTION_BY_ID[section]
    document.title =
      section === 'home' ? `${profile.name} — ${profile.tagline}` : `${meta.nav} · ${profile.name}`
  }, [section])

  if (webgl === 'unknown') return <div className="boot" />
  return immersive ? <ImmersiveExperience /> : <ConventionalPortfolio />
}
