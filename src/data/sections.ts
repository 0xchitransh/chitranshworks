export type SectionId =
  | 'home'
  | 'about'
  | 'skills'
  | 'projects'
  | 'strategy'
  | 'journey'
  | 'achievements'
  | 'contact'

export interface SectionMeta {
  id: SectionId
  /** Plain label used in the navigation (easy to understand without cricket knowledge). */
  nav: string
  /** Cricket-flavoured title shown as a kicker on the matching panel. */
  title: string
  /** The physical object that represents this section. */
  object: string
  index: string
}

export const SECTIONS: SectionMeta[] = [
  { id: 'home', nav: 'Home', title: 'The Pavilion', object: 'Dressing room', index: '01' },
  { id: 'about', nav: 'About', title: 'The Player', object: 'Jersey', index: '02' },
  { id: 'skills', nav: 'Skills', title: 'The Arsenal', object: 'Kit bag', index: '03' },
  { id: 'projects', nav: 'Projects', title: 'The Innings', object: 'Workstation', index: '04' },
  { id: 'strategy', nav: 'Approach', title: 'The Game Plan', object: 'Strategy board', index: '05' },
  { id: 'journey', nav: 'Experience', title: 'The Journey', object: 'Lockers', index: '06' },
  { id: 'achievements', nav: 'Achievements', title: 'The Scoreboard', object: 'Trophy shelf', index: '07' },
  { id: 'contact', nav: 'Contact', title: 'Beyond the Boundary', object: 'Stadium window', index: '08' },
]

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<
  SectionId,
  SectionMeta
>

export function isSectionId(value: string): value is SectionId {
  return value in SECTION_BY_ID
}
