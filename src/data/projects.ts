export interface ProjectLink {
  label: string
  href: string
}

export interface Project {
  id: string
  name: string
  category: string
  tagline: string
  overview: string
  /** Optional case-study fields — rendered only when present. */
  problem?: string
  role?: string
  stack?: string[]
  outcomes?: string[]
  links?: ProjectLink[]
  screenshots?: { src: string; alt: string }[]
  /** Accent used for the generated cover when no screenshot is available. */
  hue: number
}

/**
 * Work areas shown on the workstation monitor. These describe the range of
 * work, not claims about individual projects.
 */
export const WORK_AREAS = [
  'Blockchain engineering',
  'Product development',
  'Web applications',
  'Smart contracts & integrations',
  'Marketing & growth',
]

/**
 * Only the facts that are known are filled in. Add `problem`, `role`, `stack`,
 * `outcomes`, `links` and `screenshots` as you verify them — the case-study UI
 * grows automatically, and nothing is invented in the meantime.
 */
export const projects: Project[] = [
  {
    id: 'predix',
    name: 'Predix',
    category: 'Blockchain · Product',
    tagline: 'A blockchain product built end to end.',
    overview:
      'One of the products I have built at the intersection of blockchain engineering and product development.',
    hue: 24,
  },
  {
    id: 'haunting-hoods',
    name: 'Haunting Hoods',
    category: 'Blockchain · Product',
    tagline: 'A blockchain project with a community at its centre.',
    overview:
      'A project where the product, the on-chain side and the community all had to work together.',
    hue: 280,
  },
  {
    id: 'pace-punks',
    name: 'Pace Punks',
    category: 'Blockchain · Product',
    tagline: 'Where cricket culture meets blockchain.',
    overview:
      'A project that brings the energy of cricket into a blockchain product and its community.',
    hue: 142,
  },
]
