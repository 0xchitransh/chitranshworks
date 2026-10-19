import { chapters } from '../../data/experience'
import { SECTION_BY_ID } from '../../data/sections'

export function JourneyPanel() {
  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.journey.title}</p>
        <h2 className="content__title">From the crease to the codebase</h2>
        <p className="content__lede">Discipline, then builds, then both. Four chapters so far.</p>
      </header>
      <ol className="timeline">
        {chapters.map((c) => (
          <li key={c.id} className="timeline__item">
            <p className="eyebrow">{c.label}</p>
            <h3 className="card__title">{c.title}</h3>
            <p className="card__body">{c.body}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
