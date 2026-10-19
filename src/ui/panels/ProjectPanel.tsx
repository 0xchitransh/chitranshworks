import { WORK_AREAS, projects, type Project } from '../../data/projects'
import { SECTION_BY_ID } from '../../data/sections'
import { useStage } from '../../store/useStage'

function Cover({ project }: { project: Project }) {
  const style = {
    background: `radial-gradient(120% 140% at 0% 0%, hsl(${project.hue} 70% 38% / 0.55), transparent 60%), linear-gradient(135deg, #17130f, #0b0b0d)`,
  }
  return (
    <div className="cover" style={style} aria-hidden="true">
      <span className="cover__mono">{project.category}</span>
      <span className="cover__name">{project.name}</span>
    </div>
  )
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const hasCaseStudy = Boolean(
    project.problem || project.role || project.stack?.length || project.outcomes?.length || project.links?.length,
  )
  return (
    <article className="project" aria-labelledby={`project-${project.id}`}>
      <button type="button" className="link-back" onClick={onBack}>
        <span aria-hidden="true">←</span> All projects
      </button>
      <Cover project={project} />
      <p className="eyebrow">{project.category}</p>
      <h2 className="content__title" id={`project-${project.id}`}>
        {project.name}
      </h2>
      <p className="content__lede">{project.tagline}</p>
      <section className="block">
        <h3 className="block__title">Overview</h3>
        <p className="content__body">{project.overview}</p>
      </section>

      {project.problem && (
        <section className="block">
          <h3 className="block__title">The problem</h3>
          <p className="content__body">{project.problem}</p>
        </section>
      )}
      {project.role && (
        <section className="block">
          <h3 className="block__title">My role</h3>
          <p className="content__body">{project.role}</p>
        </section>
      )}
      {project.stack && project.stack.length > 0 && (
        <section className="block">
          <h3 className="block__title">Technology and strategy</h3>
          <ul className="chips">
            {project.stack.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}
      {project.outcomes && project.outcomes.length > 0 && (
        <section className="block">
          <h3 className="block__title">Outcomes</h3>
          <ul className="list">
            {project.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      )}
      {project.screenshots && project.screenshots.length > 0 && (
        <section className="block">
          <h3 className="block__title">Screens</h3>
          <div className="shots">
            {project.screenshots.map((s) => (
              <img key={s.src} src={s.src} alt={s.alt} loading="lazy" decoding="async" />
            ))}
          </div>
        </section>
      )}
      {project.links && project.links.length > 0 && (
        <div className="actions">
          {project.links.map((l) => (
            <a key={l.href} className="btn btn--primary" href={l.href} target="_blank" rel="noreferrer noopener">
              {l.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      )}
      {!hasCaseStudy && (
        <p className="note">The full case study (problem, role, stack and outcomes) is being written up.</p>
      )}
    </article>
  )
}

/** The "monitor" interface: browse projects, then open a case study. */
export function ProjectPanel() {
  const projectId = useStage((s) => s.projectId)
  const setProject = useStage((s) => s.setProject)
  const selected = projects.find((p) => p.id === projectId)

  if (selected) {
    return (
      <div className="content">
        <ProjectDetail project={selected} onBack={() => setProject(null)} />
      </div>
    )
  }

  return (
    <div className="content">
      <header className="content__head">
        <p className="eyebrow">{SECTION_BY_ID.projects.title}</p>
        <h2 className="content__title">Things I have built</h2>
        <p className="content__lede">
          Blockchain engineering, product development and growth, shipped as real products with real communities around
          them.
        </p>
      </header>

      <ul className="chips" aria-label="Areas of work">
        {WORK_AREAS.map((a) => (
          <li key={a} className="chip chip--quiet">
            {a}
          </li>
        ))}
      </ul>

      <ul className="project-list">
        {projects.map((p, i) => (
          <li key={p.id}>
            <button type="button" className="project-row" onClick={() => setProject(p.id)}>
              <span className="project-row__n" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="project-row__main">
                <span className="project-row__name">{p.name}</span>
                <span className="project-row__tag">{p.tagline}</span>
              </span>
              <span className="project-row__cat">{p.category}</span>
              <span className="project-row__go" aria-hidden="true">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
