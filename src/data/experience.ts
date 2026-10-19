export interface Chapter {
  id: string
  label: string
  title: string
  body: string
}

/**
 * The journey as chapters, not a job history. Add dated roles here only once
 * they are confirmed.
 */
export const chapters: Chapter[] = [
  {
    id: 'cricket',
    label: 'Chapter 1',
    title: 'Cricket',
    body: 'Wicket-keeping and batting, up to district level. Where the discipline comes from.',
  },
  {
    id: 'blockchain',
    label: 'Chapter 2',
    title: 'Blockchain engineering',
    body: 'Smart contracts and the integrations that connect them to real products.',
  },
  {
    id: 'product',
    label: 'Chapter 3',
    title: 'Product building',
    body: 'Taking ideas such as Predix, Haunting Hoods and Pace Punks from concept to something people can use.',
  },
  {
    id: 'growth',
    label: 'Chapter 4',
    title: 'Growth & community',
    body: 'Marketing experiments and community building, so the work finds its audience.',
  },
]

/** Plaques on the closed lockers, as in the dressing room. */
export const plaques = ['DISCIPLINE', 'BUILDS', 'BOTH.']
