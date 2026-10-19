export interface Achievement {
  id: string
  kind: 'trophy' | 'frame'
  title: string
  context: string
  /** Leave undefined when the date is not confirmed. */
  date?: string
  evidence?: { label: string; href: string }
}

/** Only meaningful, verifiable milestones — the shelf shows exactly what is listed here. */
export const achievements: Achievement[] = [
  {
    id: 'district',
    kind: 'trophy',
    title: 'District-level cricket',
    context:
      'Represented at district level as a wicket-keeper and batter. The standard that sets for preparation and composure still shapes how I work.',
  },
  {
    id: 'keeper',
    kind: 'frame',
    title: 'Behind the stumps',
    context:
      'Wicket-keeping is a job of constant attention: anticipate, communicate, and stay calm when it matters. It is the closest thing I know to debugging a live system.',
  },
  {
    id: 'shipped',
    kind: 'trophy',
    title: 'Shipped real products',
    context:
      'Predix, Haunting Hoods and Pace Punks: blockchain-based products taken from idea to something people can use.',
  },
]
