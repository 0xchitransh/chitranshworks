import { useState, type KeyboardEvent } from 'react'
import { SECTION_BY_ID } from '../../data/sections'
import { strategyContent, type StrategyTab } from '../../data/strategy'
import { ArchitectureDiagram } from './ArchitectureDiagram'

const TABS: { id: StrategyTab; label: string }[] = [
  { id: 'engineering', label: 'Engineering' },
  { id: 'product', label: 'Product' },
  { id: 'growth', label: 'Growth' },
]

export function StrategyPanel() {
  const [tab, setTab] = useState<StrategyTab>('engineering')
  const content = strategyContent[tab]

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (i + TABS.length - 1) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setTab(TABS[next].id)
    requestAnimationFrame(() => document.getElementById(`tab-${TABS[next].id}`)?.focus())
  }

  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.strategy.title}</p>
        <h2 className="content__title">How I approach a problem</h2>
        <p className="content__lede">
          The same game plan works on a cricket field and on a product team: read the situation, pick the structure,
          then execute.
        </p>
      </header>

      <div role="tablist" aria-label="Disciplines" className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls="strategy-tabpanel"
            tabIndex={tab === t.id ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab(t.id)}
            onKeyDown={onKey}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="strategy-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="tabpanel">
        <ArchitectureDiagram tab={tab} />
        <h3 className="block__title">{content.title}</h3>
        <p className="content__body">{content.intro}</p>
        <ol className="steps">
          {content.points.map((p, i) => (
            <li key={p.heading} className="steps__item">
              <span className="steps__n" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h4 className="card__title">{p.heading}</h4>
                <p className="card__body">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
