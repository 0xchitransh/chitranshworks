/**
 * Editable personal content. Everything the UI shows about Chitransh lives in
 * `src/data/*` so it can be updated without touching the 3D scene.
 *
 * Rule: only add facts that are true. Optional fields are simply hidden when empty.
 */

export interface ContactChannel {
  label: string
  /** Display text, e.g. an email address or handle. */
  value: string
  /** Fully-qualified link (mailto:, https:). */
  href: string
}

export const profile = {
  name: 'Chitransh Raj',
  tagline: 'Same hunger. Different field.',
  roles: ['Blockchain Engineer', 'Product Builder', 'Growth Marketer', 'Cricketer'],
  headline: 'I build products, engineer systems, and help ideas find their audience.',
  description:
    'Blockchain engineering, product development, and growth — connected by curiosity, discipline, and execution.',

  /** Shown in the "The Player" panel after the jersey is restored. */
  restoredLine: 'The player behind the products.',
  bio: [
    'Before I wrote smart contracts, I kept wicket and batted. Cricket is where I learned to stay patient for hours, read a situation before it happens, and still act in a split second.',
    'Today I take the same approach to building: engineer the system carefully, treat the product as something people actually use, and put real effort into getting it in front of them.',
  ],
  cricket: [
    { label: 'Role', value: 'Wicket-keeper and batter' },
    { label: 'Level', value: 'Represented at district level' },
  ],
  principles: [
    {
      title: 'Discipline',
      body: 'Practice is unglamorous. The reps you repeat before anyone is watching decide the outcome on the day.',
    },
    {
      title: 'Learning',
      body: 'Every innings, every launch and every failed experiment is data. I keep the lesson and move on.',
    },
    {
      title: 'Execution',
      body: 'A good plan only counts once it ships. I would rather release something real and improve it.',
    },
  ],

  /** Beyond the Boundary / Contact panel. */
  closing: 'Same hunger. Different field. If you are building something, I would like to hear about it.',
  interests: ['Cricket', 'Building products', 'Growing communities'],
  philosophy:
    'Treat engineering, product and growth as one game. A system nobody understands, or a product nobody finds, is only half built.',

  /**
   * Add real contact channels here (email, GitHub, LinkedIn, X ...). Nothing is
   * shown until you do, so the site never links to an address that is not yours.
   */
  contact: [] as ContactChannel[],
}
