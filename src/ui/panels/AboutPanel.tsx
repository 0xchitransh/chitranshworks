import { profile } from '../../data/profile'
import { SECTION_BY_ID } from '../../data/sections'
import { navigate } from '../navigate'

export function AboutPanel() {
  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.about.title}</p>
        <h2 className="content__title">{profile.restoredLine}</h2>
        <p className="content__lede">{profile.headline}</p>
      </header>

      {profile.bio.map((p) => (
        <p key={p} className="content__body">
          {p}
        </p>
      ))}

      <section aria-labelledby="cricket-heading" className="block">
        <h3 id="cricket-heading" className="block__title">
          On the field
        </h3>
        <dl className="facts">
          {profile.cricket.map((f) => (
            <div key={f.label} className="facts__row">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="principles-heading" className="block">
        <h3 id="principles-heading" className="block__title">
          How I work
        </h3>
        <ul className="cards">
          {profile.principles.map((p) => (
            <li key={p.title} className="card">
              <h4 className="card__title">{p.title}</h4>
              <p className="card__body">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={() => navigate('projects')}>
          See the projects
        </button>
        <button type="button" className="btn" onClick={() => navigate('journey')}>
          The journey
        </button>
      </div>
    </div>
  )
}
