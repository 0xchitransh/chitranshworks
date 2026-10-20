import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStage } from '../store/useStage'
import { CameraRig } from './CameraRig'
import { DustParticles } from './DustParticles'
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


      <ReadySignal />
    </>
  )
}
