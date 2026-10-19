import { profile } from '../../data/profile'
import { SECTION_BY_ID } from '../../data/sections'
import { navigate } from '../navigate'

export function ContactPanel() {
  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.contact.title}</p>
        <h2 className="content__title">{profile.tagline}</h2>
        <p className="content__lede">{profile.closing}</p>
      </header>

      <section className="block" aria-labelledby="interests-heading">
        <h3 className="block__title" id="interests-heading">
          Beyond the boundary
        </h3>
        <ul className="chips">
          {profile.interests.map((i) => (
            <li key={i} className="chip">
              {i}
            </li>
          ))}
        </ul>
        <p className="content__body">{profile.philosophy}</p>
      </section>

      <section className="block" aria-labelledby="contact-heading">
        <h3 className="block__title" id="contact-heading">
          Get in touch
        </h3>
        {profile.contact.length > 0 ? (
          <ul className="contact-list">
            {profile.contact.map((c) => (
              <li key={c.href}>
                <a className="contact-link" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer noopener">
                  <span className="contact-link__label">{c.label}</span>
                  <span className="contact-link__value">{c.value}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">Contact links are on their way. Check back soon.</p>
        )}
      </section>

      <div className="actions">
        <button type="button" className="btn" onClick={() => navigate('home')}>
          Back to the pavilion
        </button>
      </div>
    </div>
  )
}
