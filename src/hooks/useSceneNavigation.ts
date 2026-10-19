import { useEffect } from 'react'
import { isSectionId, type SectionId } from '../data/sections'
import { useStage } from '../store/useStage'

function sectionFromHash(): SectionId {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return isSectionId(raw) ? raw : 'home'
}

/**
 * Navigate to a section. The URL hash is the router so browser back/forward
 * walk through the exploration naturally.
 */
export function goTo(section: SectionId): void {
  const target = section === 'home' ? '' : `#/${section}`
  const current = window.location.hash === '#/' ? '' : window.location.hash
  if (current !== target) {
    // pushState does not fire hashchange; apply the state ourselves.
    window.history.pushState(null, '', target === '' ? window.location.pathname : target)
  }
  const store = useStage.getState()
  if (section !== 'projects') store.setProject(null)
  store.setSection(section)
}

/** Keeps the store and the URL in sync (deep links, back/forward). */
export function useHashSync(): void {
  useEffect(() => {
    const apply = () => {
      const section = sectionFromHash()
      const store = useStage.getState()
      if (section === 'home' && !window.location.hash) {
        // Back to the very first entry: keep the entered state but return to the overview.
        store.setSection('home')
        return
      }
      store.setSection(section)
    }
    if (window.location.hash) apply()
    window.addEventListener('popstate', apply)
    window.addEventListener('hashchange', apply)
    return () => {
      window.removeEventListener('popstate', apply)
      window.removeEventListener('hashchange', apply)
    }
  }, [])
}

/** Escape closes the current panel and returns to the pavilion. */
export function useEscapeToHome(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const { section, projectId, setProject } = useStage.getState()
      if (section === 'home') return
      if (projectId) {
        setProject(null)
        return
      }
      goTo('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
