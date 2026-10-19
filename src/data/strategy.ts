export type StrategyTab = 'engineering' | 'product' | 'growth'

export interface StrategyNode {
  id: string
  /** Cricket field position the node starts as. */
  fieldLabel: string
  /** Product / architecture role it becomes. */
  label: string
  /** Normalised position (0..1) on the board for the product view. */
  x: number
  y: number
  /** Normalised position (0..1) on the board for the field view. */
  fx: number
  fy: number
}

/**
 * A generic build workflow — how I approach any product — not a claim about the
 * internals of a specific project. Each field position maps to a stage.
 */
export const strategyNodes: StrategyNode[] = [
  { id: 'keeper', fieldLabel: 'Keeper', label: 'Problem', x: 0.1, y: 0.5, fx: 0.5, fy: 0.78 },
  { id: 'slip', fieldLabel: 'Slip', label: 'Research', x: 0.28, y: 0.25, fx: 0.38, fy: 0.72 },
  { id: 'point', fieldLabel: 'Point', label: 'Architecture', x: 0.28, y: 0.75, fx: 0.24, fy: 0.55 },
  { id: 'cover', fieldLabel: 'Cover', label: 'Contracts', x: 0.5, y: 0.25, fx: 0.28, fy: 0.3 },
  { id: 'mid', fieldLabel: 'Mid-off', label: 'Interface', x: 0.5, y: 0.75, fx: 0.42, fy: 0.2 },
  { id: 'long', fieldLabel: 'Long-on', label: 'Launch', x: 0.72, y: 0.5, fx: 0.62, fy: 0.22 },
  { id: 'fine', fieldLabel: 'Fine leg', label: 'Growth', x: 0.92, y: 0.25, fx: 0.74, fy: 0.6 },
  { id: 'square', fieldLabel: 'Square leg', label: 'Community', x: 0.92, y: 0.75, fx: 0.7, fy: 0.42 },
]

/** Directed edges of the workflow (product view). */
export const strategyEdges: [string, string][] = [
  ['keeper', 'slip'],
  ['keeper', 'point'],
  ['slip', 'cover'],
  ['point', 'mid'],
  ['cover', 'long'],
  ['mid', 'long'],
  ['long', 'fine'],
  ['long', 'square'],
]

export interface StrategyContent {
  title: string
  intro: string
  points: { heading: string; body: string }[]
}

export const strategyContent: Record<StrategyTab, StrategyContent> = {
  engineering: {
    title: 'Technical architecture',
    intro: 'I design the system before I write it, then keep the on-chain surface as small as it can be.',
    points: [
      {
        heading: 'Start from the constraint',
        body: 'On a blockchain, mistakes are expensive to undo. I define what the contract must guarantee first, and push everything else off-chain.',
      },
      {
        heading: 'Small contracts, clear interfaces',
        body: 'Smaller contracts are easier to reason about and integrate. The interface layer should hide chain complexity from the user.',
      },
      {
        heading: 'Integrate early',
        body: 'The frontend and the contracts are built against each other from the start, so surprises show up in week one rather than launch week.',
      },
    ],
  },
  product: {
    title: 'Product thinking',
    intro: 'The first question is who this is for and what they are trying to do, not which technology to use.',
    points: [
      {
        heading: 'Define the problem',
        body: 'Like a keeper reading the batter, I want to know what is about to happen before choosing a move.',
      },
      {
        heading: 'Cut to the core loop',
        body: 'Ship the smallest version that proves the core loop works, then add what real usage asks for.',
      },
      {
        heading: 'Make it feel like a product',
        body: 'Wallets, gas and hashes should not be the user’s problem. Good product work hides them.',
      },
    ],
  },
  growth: {
    title: 'Growth & community',
    intro: 'A product nobody finds is only half built. Growth is part of the design, not an afterthought.',
    points: [
      {
        heading: 'Run experiments',
        body: 'Small, measurable bets on messaging and channels. Keep what works, drop what does not.',
      },
      {
        heading: 'Build the community early',
        body: 'People who help shape a product defend it. I treat early community members as collaborators.',
      },
      {
        heading: 'Stay close to feedback',
        body: 'Community conversations feed straight back into the product roadmap.',
      },
    ],
  },
}
