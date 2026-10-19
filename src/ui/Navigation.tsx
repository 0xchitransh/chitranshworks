import { useEffect, useState } from 'react'
import { SECTIONS } from '../data/sections'
import { profile } from '../data/profile'
import { useHasRail } from '../hooks/useViewport'
import { useStage } from '../store/useStage'
import { navigate } from './navigate'

/** Left rail on large screens, compact top bar + menu sheet elsewhere. */
export function Navigation() {
  const section = useStage((s) => s.section)
  const entered = useStage((s) => s.entered)
  const hasRail = useHasRail()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [section])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const list = (
    <ul className="nav__list">
      {SECTIONS.map((s) => {
        const active = s.id === section && (entered || s.id === 'home')
        return (
          <li key={s.id}>
            <button
              type="button"
              className={`nav__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(s.id)}
            >
              <span className="nav__idx">{s.index}</span>
              <span className="nav__text">
                <span className="nav__title">{s.title}</span>
                <span className="nav__sub">{s.nav}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  if (hasRail) {
    return (
      <nav className="nav nav--rail" aria-label="Sections">
        <button type="button" className="nav__brand" onClick={() => navigate('home')} aria-label="Chitransh Raj, back to the pavilion">
          <span className="nav__signature">{profile.name}</span>
          <span className="nav__roles">Builder · Engineer · Growth · Cricketer</span>
        </button>
        {list}
        <p className="nav__quote" aria-hidden="true">
          “{profile.tagline}”
        </p>
      </nav>
    )
  }

  return (
    <nav className="nav nav--bar" aria-label="Sections">
      <button type="button" className="nav__brand nav__brand--bar" onClick={() => navigate('home')} aria-label="Chitransh Raj, back to the pavilion">
        <span className="nav__signature">{profile.name}</span>
      </button>
      <button
        type="button"
        className="menu-btn"
        aria-expanded={menuOpen}
        aria-controls="nav-sheet"
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>
      {menuOpen && (
        <div id="nav-sheet" className="nav__sheet">
          {list}
        </div>
      )}
    </nav>
  )
}
