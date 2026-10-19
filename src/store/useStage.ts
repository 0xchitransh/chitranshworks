import { create } from 'zustand'
import type { SectionId } from '../data/sections'

export type JerseyPhase = 'dusty' | 'cleaning' | 'restored'
export type Quality = 'high' | 'medium' | 'low'
export type WebGLStatus = 'unknown' | 'ok' | 'failed'

export interface StageState {
  /** Which part of the dressing room is focused. Single source of truth for camera + content. */
  section: SectionId
  /** Has the visitor passed the intro? */
  entered: boolean
  /** Essential scene assets are ready and the first frame has rendered. */
  sceneReady: boolean
  webgl: WebGLStatus
  /** false → the conventional (non-3D) portfolio layout is shown. */
  immersive: boolean
  reducedMotion: boolean
  /** True once the visitor toggled reduced motion manually (stops following the OS setting). */
  reducedMotionManual: boolean
  soundOn: boolean
  quality: Quality
  hovered: string | null
  jersey: JerseyPhase
  jerseyProgress: number
  projectId: string | null
  achievementId: string | null

  setSection: (section: SectionId) => void
  enter: () => void
  setSceneReady: () => void
  setWebgl: (status: WebGLStatus) => void
  setImmersive: (value: boolean) => void
  setReducedMotion: (value: boolean, manual?: boolean) => void
  setSoundOn: (value: boolean) => void
  setQuality: (value: Quality) => void
  setHovered: (id: string | null) => void
  setJerseyProgress: (value: number) => void
  restoreJersey: () => void
  setProject: (id: string | null) => void
  setAchievement: (id: string | null) => void
}

const systemReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

export const useStage = create<StageState>((set, get) => ({
  section: 'home',
  entered: false,
  sceneReady: false,
  webgl: 'unknown',
  immersive: true,
  reducedMotion: systemReducedMotion,
  reducedMotionManual: false,
  soundOn: false,
  quality: 'high',
  hovered: null,
  jersey: 'dusty',
  jerseyProgress: 0,
  projectId: null,
  achievementId: null,

  setSection: (section) => {
    const { jersey } = get()
    let nextJersey = jersey
    if (section === 'about' && jersey === 'dusty') nextJersey = 'cleaning'
    if (section !== 'about' && jersey === 'cleaning') nextJersey = 'dusty'
    set({ section, jersey: nextJersey, entered: true, hovered: null })
  },
  enter: () => set({ entered: true }),
  setSceneReady: () => set({ sceneReady: true }),
  setWebgl: (webgl) => set({ webgl }),
  setImmersive: (immersive) => set({ immersive }),
  setReducedMotion: (reducedMotion, manual = false) =>
    set((s) => ({ reducedMotion, reducedMotionManual: manual || s.reducedMotionManual })),
  setSoundOn: (soundOn) => set({ soundOn }),
  setQuality: (quality) => set({ quality }),
  setHovered: (hovered) => set({ hovered }),
  setJerseyProgress: (jerseyProgress) => set({ jerseyProgress }),
  restoreJersey: () => set({ jersey: 'restored', jerseyProgress: 1 }),
  setProject: (projectId) => set({ projectId }),
  setAchievement: (achievementId) => set({ achievementId }),
}))

/** Is the HTML content panel for the current section visible? */
export function isPanelOpen(s: Pick<StageState, 'section' | 'jersey'>): boolean {
  if (s.section === 'home') return false
  if (s.section === 'about') return s.jersey === 'restored'
  return true
}

export function usePanelOpen(): boolean {
  return useStage((s) => isPanelOpen(s))
}
