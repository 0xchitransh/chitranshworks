import { SECTION_BY_ID } from '../../data/sections'
import { skillGroups } from '../../data/skills'

export function SkillsPanel() {
  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.skills.title}</p>
        <h2 className="content__title">What I carry into every build</h2>
        <p className="content__lede">Six compartments, one bag. Each one gets used on most projects.</p>
      </header>
      <ul className="grid">
        {skillGroups.map((g) => (
          <li key={g.id} className="compartment">
            <h3 className="compartment__title">{g.label}</h3>
            <p className="compartment__note">{g.note}</p>
            <ul className="chips">
              {g.items.map((item) => (
                <li key={item} className="chip">
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
