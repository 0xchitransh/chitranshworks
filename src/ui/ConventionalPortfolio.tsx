import { profile } from '../data/profile'
import { SECTIONS, type SectionId } from '../data/sections'
import { useStage } from '../store/useStage'
import { navigate } from './navigate'
import { PanelContent } from './PanelHost'

const ORDER: SectionId[] = ['about', 'projects', 'strategy', 'skills', 'journey', 'achievements', 'contact']

/** Full portfolio as a regular page: used without WebGL, on failure, or by choice. */
export function ConventionalPortfolio() {
  const webgl = useStage((s) => s.webgl)
  const setImmersive = useStage((s) => s.setImmersive)

  return (
    <div className="page">
      <header className="page__header">
        <button type="button" className="page__brand" onClick={() => navigate('home')} aria-label="Chitransh Raj, back to top">
          {profile.name}
        </button>
        <nav aria-label="Sections" className="page__nav">
          {SECTIONS.filter((s) => s.id !== 'home').map((s) => (
            <button key={s.id} type="button" onClick={() => navigate(s.id)}>
              {s.nav}
            </button>
          ))}
          {webgl === 'ok' && (
            <button type="button" onClick={() => setImmersive(true)}>
              Enter 3D room
            </button>
          )}
        </nav>
      </header>

      <main className="page__main" id="main">
        <section className="page__hero" aria-labelledby="page-name">
          <p className="eyebrow">{profile.roles.join(' · ')}</p>
          <h1 className="page__name" id="page-name">
            {profile.name}
          </h1>
          <p className="page__tagline">“{profile.tagline}”</p>
          <p className="page__headline">{profile.headline}</p>
          <p className="page__desc">{profile.description}</p>
        </section>

        {ORDER.map((id) => (
          <section key={id} id={`section-${id}`} tabIndex={-1} className="page__section" aria-label={SECTIONS.find((s) => s.id === id)?.nav}>
            <PanelContent section={id} />
          </section>
        ))}
      </main>

      <footer className="page__footer">
        <p>
          {profile.name} — {profile.tagline}
        </p>
      </footer>
    </div>
  )
}
