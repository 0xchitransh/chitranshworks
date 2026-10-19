export interface SkillGroup {
  id: string
  label: string
  /** Short note on how this shows up in the work. */
  note: string
  items: string[]
}

/** Categories mirror the compartments of the kit bag. No proficiency levels are claimed. */
export const skillGroups: SkillGroup[] = [
  {
    id: 'blockchain',
    label: 'Blockchain development',
    note: 'Writing and integrating the on-chain side of a product.',
    items: ['Smart contracts', 'Contract integrations', 'Solidity'],
  },
  {
    id: 'languages',
    label: 'Programming languages',
    note: 'What I reach for first.',
    items: ['Solidity', 'TypeScript', 'JavaScript'],
  },
  {
    id: 'frontend',
    label: 'Frontend development',
    note: 'Interfaces that make a protocol feel like a product.',
    items: ['Web applications', 'TypeScript', 'JavaScript'],
  },
  {
    id: 'tools',
    label: 'Developer tools',
    note: 'How work gets shared and shipped.',
    items: ['GitHub'],
  },
  {
    id: 'product',
    label: 'Product development',
    note: 'Deciding what to build, and what to leave out.',
    items: ['Product thinking', 'Technical architecture', 'Shipping end to end'],
  },
  {
    id: 'growth',
    label: 'Marketing & community',
    note: 'Making sure the right people find it.',
    items: ['Growth marketing', 'Community building', 'Growth experiments'],
  },
]
