import { useEffect, useRef, useState } from 'react'
import { SECTION_BY_ID, type SectionId } from '../data/sections'
import { usePanelOpen, useStage } from '../store/useStage'
import { navigate } from './navigate'
import { AboutPanel } from './panels/AboutPanel'
import { AchievementPanel } from './panels/AchievementPanel'
import { ContactPanel } from './panels/ContactPanel'
import { JourneyPanel } from './panels/JourneyPanel'
import { ProjectPanel } from './panels/ProjectPanel'
import { SkillsPanel } from './panels/SkillsPanel'
import { StrategyPanel } from './panels/StrategyPanel'

export function PanelContent({ section }: { section: SectionId }) {
  switch (section) {
    case 'about':
      return <AboutPanel />
    case 'skills':
      return <SkillsPanel />
    case 'projects':
      return <ProjectPanel />
    case 'strategy':
      return <StrategyPanel />
    case 'journey':
      return <JourneyPanel />
    case 'achievements':
      return <AchievementPanel />
    case 'contact':
      return <ContactPanel />
    default:
      return null
  }
}

/** Side drawer (desktop) / bottom sheet (mobile) that carries the content for the focused object. */
export function PanelHost() {
  const section = useStage((s) => s.section)
  const open = usePanelOpen()
  const [shown, setShown] = useState<SectionId | null>(null)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timer: number | undefined
    let raf = 0
    if (open) {
      setShown(section)
      raf = requestAnimationFrame(() => {
        setVisible(true)
        ref.current?.focus({ preventScroll: true })
      })
    } else {
      setVisible(false)
      timer = window.setTimeout(() => setShown(null), 500)
    }
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [open, section])

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [shown])

  if (!shown) return null
  const meta = SECTION_BY_ID[shown]

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      className={`panel${visible ? ' is-open' : ''}`}
      aria-label={`${meta.title}: ${meta.nav}`}
    >
      <div className="panel__grip" aria-hidden="true" />
      <div className="panel__bar">
        <span className="panel__crumb">
          <span className="panel__idx">{meta.index}</span> {meta.title}
        </span>
        <button type="button" className="icon-btn" onClick={() => navigate('home', { keepJourney: true })} aria-label="Close and return to the pavilion">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="panel__scroll" ref={scroller}>
        <div key={shown} className="panel__fade">
          <PanelContent section={shown} />
        </div>
      </div>
    </aside>
  )
}
