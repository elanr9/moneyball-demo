// The Player Finder brain. Coaches do not think in metric weights and
// percentages, they think in plain language: "a fast winger who scores goals"
// or "a center back who is great on the ball". This module turns those plain
// English qualities into the metric weights the game model engine already
// understands, so the underlying ranking stays the same while the surface stays
// human.
//
// A Trait is one quality a coach cares about. Each trait owns a friendly label,
// the result phrase we show on a player it suits, the words that trigger it from
// a typed search, and the metric weights it contributes to the model. A coach
// picks traits, never numbers, and the engine does the rest.

import type { Player, PositionGroup } from './types'
import type { Percentiles, RoleDef } from './gameModel'

export type TraitCategory = 'Attacking' | 'On the ball' | 'Defending' | 'Physical'

export interface Trait {
  id: string
  // The chip label a coach taps, written the way a coach talks.
  label: string
  // The praise we show next to a player who is strong at this trait.
  praise: string
  category: TraitCategory
  // Plain language phrases that switch this trait on from a typed search.
  keywords: RegExp
  // The metric weights this trait adds to the model. Keys map onto MODEL_METRICS.
  weights: Record<string, number>
}

// The full quality catalog. Weights are summed across the traits a coach picks,
// so a single trait only needs to express its own emphasis.
export const TRAITS: Trait[] = [
  {
    id: 'goals',
    label: 'Scores goals',
    praise: 'Scores goals',
    category: 'Attacking',
    keywords: /\bgoals?\b|finisher|scorer|scoring|clinical|prolific|poacher|number 9/,
    weights: { goals: 9, xg: 8, shots: 6 },
  },
  {
    id: 'creator',
    label: 'Creates chances',
    praise: 'Creates chances',
    category: 'Attacking',
    keywords: /creative|creator|playmaker|assist|chances?|sets up|vision/,
    weights: { chancesCreated: 9, assists: 8, xa: 8 },
  },
  {
    id: 'dribbler',
    label: 'Beats defenders',
    praise: 'Beats defenders',
    category: 'Attacking',
    keywords: /dribbl|beats? (his |a )?(man|defender)|takes? (players?|defenders?) on|skill|tricky/,
    weights: { dribbling: 9, progressiveRuns: 7 },
  },
  {
    id: 'runner',
    label: 'Runs in behind',
    praise: 'Dangerous runner',
    category: 'Attacking',
    keywords: /runs? in behind|gets in behind|off the ball|movement|incisive runs?|stretches/,
    weights: { runsCreatingChances: 8, offBallDistanceKm: 7, progressiveRuns: 6 },
  },
  {
    id: 'passer',
    label: 'Great passer',
    praise: 'Great passer',
    category: 'On the ball',
    keywords: /pass(er|ing)?|distribut|dictates?|tempo|metronome|range of passing/,
    weights: { passing: 9, passAccuracy: 7 },
  },
  {
    id: 'possession',
    label: 'Keeps the ball',
    praise: 'Keeps the ball',
    category: 'On the ball',
    keywords: /keeps? (the )?ball|tidy|secure|press resistant|composed|recycles/,
    weights: { passAccuracy: 9, passing: 6 },
  },
  {
    id: 'carrier',
    label: 'Drives forward',
    praise: 'Drives forward',
    category: 'On the ball',
    keywords: /carr(y|ies|ier)|drives? forward|progress|line breaker|ball carrier/,
    weights: { progressiveCarriesDistanceM: 9, dribbling: 6, progressiveRuns: 6 },
  },
  {
    id: 'ballWinner',
    label: 'Wins the ball back',
    praise: 'Wins the ball back',
    category: 'Defending',
    keywords: /wins? the ball|ball winner|tackl|destroyer|breaks? up play|combative/,
    weights: { tackles: 9, interceptions: 8, recoveries: 7 },
  },
  {
    id: 'defender',
    label: 'Defensively solid',
    praise: 'Defensively solid',
    category: 'Defending',
    keywords: /defend|defensive|solid|reads? the game|intercept|positioning/,
    weights: { defending: 9, interceptions: 6, tackles: 6 },
  },
  {
    id: 'duels',
    label: 'Wins duels',
    praise: 'Wins duels',
    category: 'Defending',
    keywords: /\bduels?\b|battle|wins? (his |the )?one on ones?|nasty|aggressive/,
    weights: { duelsWonPercent: 9, physical: 6 },
  },
  {
    id: 'aerial',
    label: 'Strong in the air',
    praise: 'Strong in the air',
    category: 'Defending',
    keywords: /aerial|headers?|wins? in the air|dominant in the air|\btall\b/,
    weights: { aerialsWon: 9, physical: 6 },
  },
  {
    id: 'fast',
    label: 'Quick',
    praise: 'Quick',
    category: 'Physical',
    keywords: /fast|quick|pace|speed|rapid|burner|sprinter|express/,
    weights: { topSpeedKmh: 9, sprintDistanceM: 6 },
  },
  {
    id: 'workhorse',
    label: 'Covers ground',
    praise: 'Covers ground',
    category: 'Physical',
    keywords: /work rate|engine|box to box|tireless|covers ground|runner|relentless/,
    weights: { offBallDistanceKm: 9, sprintDistanceM: 6, recoveries: 5 },
  },
  {
    id: 'presser',
    label: 'Presses high',
    praise: 'Presses high',
    category: 'Physical',
    keywords: /press|high press|intensity|hunts?|hounds?|harries/,
    weights: { pressures: 9, ppda: 8 },
  },
  {
    id: 'strong',
    label: 'Physically strong',
    praise: 'Physically strong',
    category: 'Physical',
    keywords: /strong|powerful|strength|imposing|bullies|robust/,
    weights: { physical: 9 },
  },
]

export const TRAIT_CATEGORY_ORDER: TraitCategory[] = [
  'Attacking',
  'On the ball',
  'Defending',
  'Physical',
]

export function getTrait(id: string): Trait | undefined {
  return TRAITS.find((t) => t.id === id)
}

// Ready made starting points so a coach can begin in one tap. Each playstyle is
// just a named bundle of traits scoped to the positions it usually applies to.
export interface Playstyle {
  id: string
  name: string
  blurb: string
  group: PositionGroup
  traits: string[]
}

export const PLAYSTYLES: Playstyle[] = [
  {
    id: 'goal-scorer',
    name: 'Goal Scorer',
    blurb: 'A striker who lives in the box and finishes chances.',
    group: 'FWD',
    traits: ['goals', 'runner'],
  },
  {
    id: 'creative-winger',
    name: 'Creative Winger',
    blurb: 'Quick and direct, beats defenders and creates.',
    group: 'FWD',
    traits: ['dribbler', 'creator', 'fast'],
  },
  {
    id: 'playmaker',
    name: 'Playmaker',
    blurb: 'Runs the game with passing and chance creation.',
    group: 'MID',
    traits: ['passer', 'creator', 'possession'],
  },
  {
    id: 'ball-winner',
    name: 'Ball Winner',
    blurb: 'A midfield engine who breaks up play and presses.',
    group: 'MID',
    traits: ['ballWinner', 'presser', 'workhorse'],
  },
  {
    id: 'ball-playing-defender',
    name: 'Ball Playing Defender',
    blurb: 'Defends the box and starts attacks on the ball.',
    group: 'DEF',
    traits: ['defender', 'passer', 'aerial'],
  },
  {
    id: 'attacking-fullback',
    name: 'Attacking Fullback',
    blurb: 'Flies forward with pace and end product.',
    group: 'DEF',
    traits: ['fast', 'carrier', 'creator'],
  },
]

export const POSITION_GROUP_LABEL: Record<PositionGroup, string> = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
}

// Reads a plain English description and returns the traits it implies plus an
// optional position. This is intentionally rules based and explainable, not an
// LLM, so it always behaves the same way for the same words.
export interface ParsedSearch {
  traits: string[]
  group: PositionGroup | null
}

function detectGroup(q: string): PositionGroup | null {
  if (/keeper|goalkeeper|\bgk\b|shot stopper/.test(q)) return 'GK'
  if (/winger|striker|forward|attacker|\bcf\b|\blw\b|\brw\b|\bst\b|number 9/.test(q)) return 'FWD'
  if (/midfield|playmaker|box to box|holding|deep lying|\bcm\b|\bcdm\b|\bcam\b/.test(q)) return 'MID'
  if (/defender|center ?back|centre ?back|full ?back|wing ?back|\bcb\b|\blb\b|\brb\b|\bback\b/.test(q))
    return 'DEF'
  return null
}

export function parsePlayerQuery(query: string): ParsedSearch {
  const q = query.toLowerCase()
  const traits = TRAITS.filter((t) => t.keywords.test(q)).map((t) => t.id)
  return { traits, group: detectGroup(q) }
}

// Builds the model the engine ranks against from a set of picked traits. Weights
// from every chosen trait are summed onto the shared metric keys. The selected
// trait ids ride along on the role so a saved search can repopulate its chips.
export function buildRoleFromTraits(
  traitIds: string[],
  group: PositionGroup | 'ALL',
  meta: { id: string; name: string; custom?: boolean },
): RoleDef {
  const weights: Record<string, number> = {}
  for (const id of traitIds) {
    const trait = getTrait(id)
    if (!trait) continue
    for (const [key, value] of Object.entries(trait.weights)) {
      weights[key] = (weights[key] ?? 0) + value
    }
  }
  const groups: PositionGroup[] = group === 'ALL' ? ['GK', 'DEF', 'MID', 'FWD'] : [group]
  return {
    id: meta.id,
    name: meta.name,
    description: traitIds.map((id) => getTrait(id)?.label ?? id).join(' · '),
    groups,
    weights,
    traits: traitIds,
    custom: meta.custom,
  }
}

// How strongly a player fits a single trait, on a 0 to 1 scale. It is the
// average of the player's league percentile across the trait's metrics.
export function traitStrength(
  player: Player,
  trait: Trait,
  percentiles: Percentiles,
): number {
  const keys = Object.keys(trait.weights)
  if (keys.length === 0) return 0
  const sum = keys.reduce((acc, key) => acc + percentiles.pct(key, player), 0)
  return sum / keys.length
}

// The one line plain English reason a player tops the list: the two traits from
// the search this player is strongest at. Empty when nothing stands out.
export function topReasons(
  player: Player,
  traitIds: string[],
  percentiles: Percentiles,
  limit = 2,
): string[] {
  return traitIds
    .map((id) => getTrait(id))
    .filter((t): t is Trait => Boolean(t))
    .map((trait) => ({ trait, strength: traitStrength(player, trait, percentiles) }))
    .filter((entry) => entry.strength >= 0.45)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map((entry) => entry.trait.praise)
}
