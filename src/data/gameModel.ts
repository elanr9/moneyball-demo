// The FieldVision game model engine. This is the brain behind custom AI driven
// player profiles. A coach defines a role by weighting the metrics that matter
// to their style of play, and the engine scores every player against it on a 0
// to 10 scale by ranking them across the whole league.
//
// Everything here is deterministic and pure. Scores are percentile based, so a
// 10 means the best in the league at a weighted blend of the chosen metrics.
// Skill and physical indexes are simple attribute blends so they stay readable.

import type { Player, PositionGroup } from './types'
import { clamp, round1 } from './rng'

// A single metric the game model can weight. Metrics map onto either a FIFA
// style attribute or a season stat. Grouping mirrors how a coach thinks about
// the game so the roles studio can lay them out in sections.
export type MetricGroup =
  | 'Possession'
  | 'Attacking'
  | 'Defending'
  | 'Physical'
  | 'Advanced'

export interface ModelMetric {
  key: string
  label: string
  short: string
  group: MetricGroup
  get: (p: Player) => number
  // Lower values are better for a few metrics (press intensity). The engine
  // inverts the percentile for these so a high weight always rewards quality.
  lowerIsBetter?: boolean
}

const attr = (p: Player, key: keyof NonNullable<Player['attributes']>): number =>
  p.attributes ? p.attributes[key] : 0

// The curated catalog the roles studio exposes. Kept focused so the slider
// panel reads cleanly and any engineer can see exactly what drives a score.
export const MODEL_METRICS: ModelMetric[] = [
  // Possession value models
  { key: 'passing', label: 'Passing quality', short: 'PAS', group: 'Possession', get: (p) => attr(p, 'passing') },
  { key: 'dribbling', label: 'Dribbling quality', short: 'DRI', group: 'Possession', get: (p) => attr(p, 'dribbling') },
  { key: 'progressiveCarriesDistanceM', label: 'Carrying quality', short: 'CAR', group: 'Possession', get: (p) => p.season.progressiveCarriesDistanceM },
  { key: 'defending', label: 'Defending quality', short: 'DEF', group: 'Possession', get: (p) => attr(p, 'defending') },
  { key: 'recoveries', label: 'Recovering quality', short: 'REC', group: 'Possession', get: (p) => p.season.recoveries },
  { key: 'passAccuracy', label: 'Pass accuracy', short: 'PA%', group: 'Possession', get: (p) => p.season.passAccuracy },

  // Attacking output
  { key: 'goals', label: 'Goals', short: 'G', group: 'Attacking', get: (p) => p.season.goals },
  { key: 'xg', label: 'Expected goals', short: 'xG', group: 'Attacking', get: (p) => p.season.xg },
  { key: 'shots', label: 'Shots', short: 'Sh', group: 'Attacking', get: (p) => p.season.shots },
  { key: 'assists', label: 'Assists', short: 'A', group: 'Attacking', get: (p) => p.season.assists },
  { key: 'xa', label: 'Expected assists', short: 'xA', group: 'Attacking', get: (p) => p.season.xa },
  { key: 'chancesCreated', label: 'Chances created', short: 'CC', group: 'Attacking', get: (p) => p.season.chancesCreated },

  // Defending output
  { key: 'tackles', label: 'Tackles', short: 'Tkl', group: 'Defending', get: (p) => p.season.tackles },
  { key: 'interceptions', label: 'Interceptions', short: 'Int', group: 'Defending', get: (p) => p.season.interceptions },
  { key: 'duelsWonPercent', label: 'Duels won', short: 'Duel', group: 'Defending', get: (p) => p.season.duelsWonPercent },
  { key: 'aerialsWon', label: 'Aerials won', short: 'Aer', group: 'Defending', get: (p) => p.season.aerialsWon },

  // Physical
  { key: 'topSpeedKmh', label: 'Top speed', short: 'Spd', group: 'Physical', get: (p) => p.season.topSpeedKmh },
  { key: 'sprintDistanceM', label: 'Sprint distance', short: 'Spr', group: 'Physical', get: (p) => p.season.sprintDistanceM },
  { key: 'physical', label: 'Strength', short: 'PHY', group: 'Physical', get: (p) => attr(p, 'physical') },

  // Advanced movement and pressing
  { key: 'progressiveRuns', label: 'Progressive runs', short: 'PrgR', group: 'Advanced', get: (p) => p.season.progressiveRuns },
  { key: 'runsCreatingChances', label: 'Runs creating chances', short: 'RCC', group: 'Advanced', get: (p) => p.season.runsCreatingChances },
  { key: 'spaceCreatedPer90', label: 'Space created', short: 'SpC', group: 'Advanced', get: (p) => p.season.spaceCreatedPer90 },
  { key: 'offBallDistanceKm', label: 'Off ball distance', short: 'OBD', group: 'Advanced', get: (p) => p.season.offBallDistanceKm },
  { key: 'pressures', label: 'Pressures', short: 'Prs', group: 'Advanced', get: (p) => p.season.pressures },
  { key: 'ppda', label: 'Press intensity', short: 'PPDA', group: 'Advanced', get: (p) => p.season.ppda, lowerIsBetter: true },
]

export const METRIC_GROUP_ORDER: MetricGroup[] = [
  'Possession',
  'Attacking',
  'Defending',
  'Physical',
  'Advanced',
]

export function getMetric(key: string): ModelMetric | undefined {
  return MODEL_METRICS.find((m) => m.key === key)
}

// A role is a named weighting of metrics scoped to one or more position groups.
// Weights run 0 to 10 like the studio sliders. A default library ships with the
// product and coaches can clone and tune their own.
export interface RoleDef {
  id: string
  name: string
  description: string
  groups: PositionGroup[]
  weights: Record<string, number>
  // The plain English traits a coach picked in Player Finder, kept so a saved
  // search can repopulate its chips. Optional because the default library and
  // older saves are defined directly by weights.
  traits?: string[]
  custom?: boolean
}

export const DEFAULT_ROLES: RoleDef[] = [
  {
    id: 'box-to-box',
    name: 'Box to Box',
    description: 'A relentless engine who carries, presses and arrives in both boxes.',
    groups: ['MID'],
    weights: { dribbling: 8, progressiveRuns: 10, recoveries: 6, sprintDistanceM: 7, chancesCreated: 5, offBallDistanceKm: 8, pressures: 6 },
  },
  {
    id: 'deep-playmaker',
    name: 'Deep Playmaker',
    description: 'Dictates tempo from deep with elite passing and progressive carries.',
    groups: ['MID'],
    weights: { passing: 10, passAccuracy: 8, progressiveCarriesDistanceM: 8, chancesCreated: 7, interceptions: 5 },
  },
  {
    id: 'ball-winner',
    name: 'Ball Winner',
    description: 'Sets the press and snuffs out attacks before they start.',
    groups: ['MID'],
    weights: { tackles: 9, interceptions: 9, ppda: 8, recoveries: 8, duelsWonPercent: 7, pressures: 8 },
  },
  {
    id: 'inside-forward',
    name: 'Inside Forward',
    description: 'Cuts inside to shoot and create, dangerous in tight space.',
    groups: ['FWD'],
    weights: { dribbling: 9, goals: 8, xg: 8, runsCreatingChances: 9, progressiveRuns: 7, chancesCreated: 6 },
  },
  {
    id: 'target-forward',
    name: 'Target Forward',
    description: 'Holds the ball up, wins aerials and finishes inside the box.',
    groups: ['FWD'],
    weights: { goals: 10, xg: 9, aerialsWon: 8, physical: 7, shots: 7 },
  },
  {
    id: 'pressing-forward',
    name: 'Pressing Forward',
    description: 'Leads the line by hunting defenders and breaking lines off the ball.',
    groups: ['FWD'],
    weights: { pressures: 9, ppda: 8, runsCreatingChances: 8, sprintDistanceM: 7, goals: 6, offBallDistanceKm: 7 },
  },
  {
    id: 'ball-playing-cb',
    name: 'Ball Playing Defender',
    description: 'Defends the box and starts attacks with progressive passing.',
    groups: ['DEF'],
    weights: { defending: 9, passing: 8, passAccuracy: 8, progressiveCarriesDistanceM: 6, interceptions: 7, aerialsWon: 6 },
  },
  {
    id: 'attacking-fullback',
    name: 'Attacking Fullback',
    description: 'Overlaps with pace and end product down the flank.',
    groups: ['DEF'],
    weights: { sprintDistanceM: 8, progressiveRuns: 8, chancesCreated: 7, topSpeedKmh: 8, assists: 6, offBallDistanceKm: 6 },
  },
  {
    id: 'stopper',
    name: 'Stopper',
    description: 'A front foot defender who wins duels and dominates the air.',
    groups: ['DEF'],
    weights: { tackles: 9, duelsWonPercent: 9, aerialsWon: 9, interceptions: 7, physical: 8 },
  },
]

// A precentile table built once per player pool. pct returns 0 to 1 where 1 is
// the best in the pool at that metric. Lower is better metrics are inverted so
// a high percentile always means high quality.
export interface Percentiles {
  pct: (key: string, player: Player) => number
}

export function buildPercentiles(players: Player[]): Percentiles {
  const table: Record<string, Map<string, number>> = {}

  for (const metric of MODEL_METRICS) {
    const entries = players
      .map((p) => ({ id: p.id, value: metric.get(p) }))
      .sort((a, b) => a.value - b.value)
    const n = entries.length
    const map = new Map<string, number>()
    entries.forEach((entry, index) => {
      let rank = n > 1 ? index / (n - 1) : 1
      if (metric.lowerIsBetter) rank = 1 - rank
      map.set(entry.id, rank)
    })
    table[metric.key] = map
  }

  return {
    pct: (key, player) => table[key]?.get(player.id) ?? 0,
  }
}

// Scores a player against a role on a 0 to 10 scale. The score is the weighted
// average of the player's percentile in each weighted metric.
export function roleScore(player: Player, role: RoleDef, percentiles: Percentiles): number {
  let sum = 0
  let weightSum = 0
  for (const [key, weight] of Object.entries(role.weights)) {
    if (weight <= 0) continue
    sum += percentiles.pct(key, player) * weight
    weightSum += weight
  }
  if (weightSum === 0) return 0
  return round1((sum / weightSum) * 10)
}

// Precision reflects how much film backs the score up. More minutes means a
// more trustworthy read. Returns 0 to 100.
export function rolePrecision(player: Player): number {
  return Math.round(clamp(player.season.minutes / 1100, 0, 1) * 100)
}

export function precisionLabel(precision: number): string {
  if (precision >= 75) return 'High'
  if (precision >= 45) return 'Medium'
  return 'Low'
}

// Skill and physical indexes are readable attribute blends on a 0 to 10 scale.
// They give every player two headline numbers without needing the league pool.
export function skillIndex(player: Player): number {
  const g = player.gkAttributes
  if (g) return round1(((g.handling + g.kicking + g.reflexes) / 3) / 10)
  const a = player.attributes
  if (!a) return 0
  return round1(((a.passing + a.dribbling + a.shooting) / 3) / 10)
}

export function physicalIndex(player: Player): number {
  const g = player.gkAttributes
  if (g) return round1(((g.diving + g.speed + g.reflexes) / 3) / 10)
  const a = player.attributes
  if (!a) return 0
  return round1(((a.pace + a.physical) / 2) / 10)
}

// All role fits for a single player, scored and sorted best first. Only roles
// that apply to the player's position group are considered.
export interface RoleFit {
  role: RoleDef
  score: number
}

export function playerRoleFits(
  player: Player,
  roles: RoleDef[],
  percentiles: Percentiles,
): RoleFit[] {
  return roles
    .filter((r) => r.groups.includes(player.positionGroup))
    .map((role) => ({ role, score: roleScore(player, role, percentiles) }))
    .sort((a, b) => b.score - a.score)
}

// Convenience for the studio and search: rank every relevant player by a role.
export interface RoleRank {
  player: Player
  score: number
  precision: number
}

export function rankByRole(
  players: Player[],
  role: RoleDef,
  percentiles: Percentiles,
): RoleRank[] {
  return players
    .filter((p) => role.groups.includes(p.positionGroup))
    .map((p) => ({ player: p, score: roleScore(p, role, percentiles), precision: rolePrecision(p) }))
    .sort((a, b) => b.score - a.score)
}
