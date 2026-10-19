import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStage } from '../store/useStage'
import { CameraRig } from './CameraRig'
import { DustParticles } from './DustParticles'
import { Hotspot } from './InteractiveHotspot'
import { Jersey } from './Jersey'
import { KitBag } from './KitBag'
import { LightingRig } from './LightingRig'
import { LockerSystem } from './LockerSystem'
import { Props } from './Props'
import { RoomEnvironment } from './RoomEnvironment'
import { StadiumWindow } from './StadiumWindow'
import { StrategyBoard } from './StrategyBoard'
import { TrophyShelf } from './TrophyShelf'
import { Workstation } from './Workstation'

/** Marks the scene as ready once a few frames have actually rendered. */
function ReadySignal() {
  const frames = useRef(0)
  useFrame(() => {
    if (frames.current > 3) return
    frames.current++
    if (frames.current === 3) useStage.getState().setSceneReady()
  })
  return null
}

export function DressingRoomScene() {
  return (
    <>
      <CameraRig />
      <LightingRig />

      <RoomEnvironment />
      <LockerSystem />
      <Jersey />
      <TrophyShelf />
      <StrategyBoard />
      <Workstation />
      <KitBag />
      <StadiumWindow />
      <Props />
      <DustParticles />

      <Hotspot id="jersey" section="about" position={[-2.35, 1.5, -3.2]} label="Clean" sub="Reveal my story" />
      <Hotspot id="strategy" section="strategy" position={[2.0, 1.75, -3.7]} label="Strategy" sub="See my approach" />
      <Hotspot id="projects" section="projects" position={[3.45, 1.3, -3.3]} label="Projects" sub="My innings" />
      <Hotspot id="skills" section="skills" position={[0.25, 0.6, -0.9]} label="Skills" sub="Open my arsenal" />
      <Hotspot id="achievements" section="achievements" position={[-0.4, 2.15, -3.5]} label="Achievements" sub="The scoreboard" />
      <Hotspot id="journey" section="journey" position={[-4.7, 2.1, -3.2]} label="Journey" sub="Discipline to builds" />
      <Hotspot id="contact" section="contact" position={[4.8, 2.3, -3.8]} label="Contact" sub="Beyond the boundary" />

      <ReadySignal />
    </>
  )
}
