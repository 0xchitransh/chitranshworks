import { achievements } from '../../data/achievements'
import { SECTION_BY_ID } from '../../data/sections'
import { useStage } from '../../store/useStage'

export function AchievementPanel() {
  const selectedId = useStage((s) => s.achievementId)
  const setAchievement = useStage((s) => s.setAchievement)
  const selected = achievements.find((a) => a.id === selectedId) ?? achievements[0]

  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.achievements.title}</p>
        <h2 className="content__title">Milestones that matter</h2>
        <p className="content__lede">Only what is real. Pick an item on the shelf, or here.</p>
      </header>

      <ul className="ach-list" aria-label="Achievements">
        {achievements.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="ach-item"
              aria-pressed={a.id === selected.id}
              onClick={() => setAchievement(a.id)}
            >
              <span className="ach-item__icon" aria-hidden="true">
                {a.kind === 'trophy' ? '◆' : '▢'}
              </span>
              <span>{a.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <article className="ach-detail" aria-live="polite" key={selected.id}>
        <h3 className="content__title content__title--sm">{selected.title}</h3>
        {selected.date && <p className="eyebrow">{selected.date}</p>}
        <p className="content__body">{selected.context}</p>
        {selected.evidence && (
          <a className="btn" href={selected.evidence.href} target="_blank" rel="noreferrer noopener">
            {selected.evidence.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </article>
    </div>
  )
}
