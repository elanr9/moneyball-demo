// Read-side helpers over the universe: lookups, team aggregates, a catalog of
// displayable/ filterable stats, and leaderboard ranking. UI layers (squad,
// transfer market, league center) should build on these rather than reaching
// into raw data.

import type { Match, Player, StandingsRow, Team, Universe } from './types'
import { round1 } from './rng'

export function getTeam(u: Universe, teamId: string): Team | undefined {
  return u.teams.find((t) => t.id === teamId)
}

export function getTeamByAbbr(u: Universe, abbr: string): Team | undefined {
  return u.teams.find((t) => t.abbreviation.toLowerCase() === abbr.toLowerCase())
}

export function getPlayer(u: Universe, playerId: string): Player | undefined {
  return u.players.find((p) => p.id === playerId)
}

export function getPlayerBySlug(u: Universe, teamId: string, slug: string): Player | undefined {
  return u.players.find((p) => p.teamId === teamId && p.slug === slug)
}

export function teamPlayers(u: Universe, teamId: string): Player[] {
  return u.players.filter((p) => p.teamId === teamId)
}

export function matchesForTeam(u: Universe, teamId: string): Match[] {
  return u.matches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function standingFor(u: Universe, teamId: string): StandingsRow | undefined {
  return u.standings.find((r) => r.teamId === teamId)
}

export function rankOf(u: Universe, teamId: string): number {
  return u.standings.findIndex((r) => r.teamId === teamId) + 1
}

export interface TeamAggregate {
  goalsFor: number
  goalsAgainst: number
  avgOverall: number
  avgFvRating: number
  topScorer: Player | null
  topRated: Player | null
}

export function teamAggregate(u: Universe, teamId: string): TeamAggregate {
  const players = teamPlayers(u, teamId)
  const row = standingFor(u, teamId)
  const ranked = [...players].sort((a, b) => b.overall - a.overall)
  const eleven = ranked.slice(0, 11)
  const avgOverall = eleven.length
    ? round1(eleven.reduce((s, p) => s + p.overall, 0) / eleven.length)
    : 0
  const rated = players.filter((p) => p.season.appearances >= 5)
  const avgFvRating = rated.length
    ? round1(rated.reduce((s, p) => s + p.season.fvRating, 0) / rated.length)
    : 0
  const topScorer = [...players].sort((a, b) => b.season.goals - a.season.goals)[0] ?? null
  const topRated = [...rated].sort((a, b) => b.season.fvRating - a.season.fvRating)[0] ?? null
  return {
    goalsFor: row?.goalsFor ?? 0,
    goalsAgainst: row?.goalsAgainst ?? 0,
    avgOverall,
    avgFvRating,
    topScorer,
    topRated,
  }
}

// ---- Stat catalog -----------------------------------------------------------

export type StatGroup =
  | 'Attacking'
  | 'Passing'
  | 'Defending'
  | 'Physical'
  | 'Advanced'
  | 'Goalkeeping'

export type StatScope = 'all' | 'outfield' | 'gk'

export interface StatDef {
  key: string
  label: string
  short: string
  group: StatGroup
  scope: StatScope
  get: (p: Player) => number
  format: (v: number) => string
}

const int = (v: number) => Math.round(v).toLocaleString()
const dec1 = (v: number) => v.toFixed(1)
const dec2 = (v: number) => v.toFixed(2)
const pct = (v: number) => `${Math.round(v)}%`

export const STAT_CATALOG: StatDef[] = [
  { key: 'goals', label: 'Goals', short: 'G', group: 'Attacking', scope: 'outfield', get: (p) => p.season.goals, format: int },
  { key: 'assists', label: 'Assists', short: 'A', group: 'Attacking', scope: 'outfield', get: (p) => p.season.assists, format: int },
  { key: 'goalContributions', label: 'Goals + Assists', short: 'G+A', group: 'Attacking', scope: 'outfield', get: (p) => p.season.goals + p.season.assists, format: int },
  { key: 'xg', label: 'Expected Goals (xG)', short: 'xG', group: 'Attacking', scope: 'outfield', get: (p) => p.season.xg, format: dec1 },
  { key: 'xa', label: 'Expected Assists (xA)', short: 'xA', group: 'Attacking', scope: 'outfield', get: (p) => p.season.xa, format: dec1 },
  { key: 'shots', label: 'Shots', short: 'Sh', group: 'Attacking', scope: 'outfield', get: (p) => p.season.shots, format: int },
  { key: 'shotsOnTarget', label: 'Shots on Target', short: 'SoT', group: 'Attacking', scope: 'outfield', get: (p) => p.season.shotsOnTarget, format: int },

  { key: 'chancesCreated', label: 'Chances Created', short: 'CC', group: 'Passing', scope: 'outfield', get: (p) => p.season.chancesCreated, format: int },
  { key: 'bigChancesCreated', label: 'Big Chances Created', short: 'BCC', group: 'Passing', scope: 'outfield', get: (p) => p.season.bigChancesCreated, format: int },
  { key: 'keyPasses', label: 'Key Passes', short: 'KP', group: 'Passing', scope: 'outfield', get: (p) => p.season.keyPasses, format: int },
  { key: 'passes', label: 'Passes', short: 'Pass', group: 'Passing', scope: 'all', get: (p) => p.season.passes, format: int },
  { key: 'passAccuracy', label: 'Pass Accuracy', short: 'Pass%', group: 'Passing', scope: 'all', get: (p) => p.season.passAccuracy, format: pct },

  { key: 'tackles', label: 'Tackles', short: 'Tkl', group: 'Defending', scope: 'outfield', get: (p) => p.season.tackles, format: int },
  { key: 'interceptions', label: 'Interceptions', short: 'Int', group: 'Defending', scope: 'outfield', get: (p) => p.season.interceptions, format: int },
  { key: 'clearances', label: 'Clearances', short: 'Clr', group: 'Defending', scope: 'outfield', get: (p) => p.season.clearances, format: int },
  { key: 'blocks', label: 'Blocks', short: 'Blk', group: 'Defending', scope: 'outfield', get: (p) => p.season.blocks, format: int },
  { key: 'recoveries', label: 'Recoveries', short: 'Rec', group: 'Defending', scope: 'outfield', get: (p) => p.season.recoveries, format: int },
  { key: 'duelsWonPercent', label: 'Duels Won %', short: 'Duel%', group: 'Defending', scope: 'outfield', get: (p) => p.season.duelsWonPercent, format: pct },
  { key: 'aerialsWon', label: 'Aerials Won', short: 'Aer', group: 'Defending', scope: 'outfield', get: (p) => p.season.aerialsWon, format: int },

  { key: 'topSpeedKmh', label: 'Top Speed (km/h)', short: 'Spd', group: 'Physical', scope: 'all', get: (p) => p.season.topSpeedKmh, format: dec1 },
  { key: 'sprintDistanceM', label: 'Sprint Distance (m)', short: 'Sprint', group: 'Physical', scope: 'outfield', get: (p) => p.season.sprintDistanceM, format: int },

  { key: 'offBallDistanceKm', label: 'Off-Ball Distance (km)', short: 'OBD', group: 'Advanced', scope: 'all', get: (p) => p.season.offBallDistanceKm, format: dec1 },
  { key: 'runsCreatingChances', label: 'Runs Creating Chances', short: 'RCC', group: 'Advanced', scope: 'outfield', get: (p) => p.season.runsCreatingChances, format: int },
  { key: 'progressiveRuns', label: 'Progressive Runs', short: 'PrgR', group: 'Advanced', scope: 'outfield', get: (p) => p.season.progressiveRuns, format: int },
  { key: 'progressiveCarriesDistanceM', label: 'Progressive Carry Distance (m)', short: 'PrgC', group: 'Advanced', scope: 'outfield', get: (p) => p.season.progressiveCarriesDistanceM, format: int },
  { key: 'spaceCreatedPer90', label: 'Space Created /90', short: 'SpC', group: 'Advanced', scope: 'outfield', get: (p) => p.season.spaceCreatedPer90, format: dec1 },
  { key: 'pressures', label: 'Pressures', short: 'Prs', group: 'Advanced', scope: 'outfield', get: (p) => p.season.pressures, format: int },
  { key: 'ppda', label: 'PPDA (press intensity)', short: 'PPDA', group: 'Advanced', scope: 'outfield', get: (p) => p.season.ppda, format: dec1 },
  { key: 'defensiveActionsPer90', label: 'Defensive Actions /90', short: 'DA/90', group: 'Advanced', scope: 'outfield', get: (p) => p.season.defensiveActionsPer90, format: dec1 },

  { key: 'cleanSheets', label: 'Clean Sheets', short: 'CS', group: 'Goalkeeping', scope: 'gk', get: (p) => p.season.cleanSheets, format: int },
  { key: 'saves', label: 'Saves', short: 'Sv', group: 'Goalkeeping', scope: 'gk', get: (p) => p.season.saves, format: int },
  { key: 'savePercent', label: 'Save %', short: 'Sv%', group: 'Goalkeeping', scope: 'gk', get: (p) => p.season.savePercent, format: pct },
  { key: 'goalsPrevented', label: 'Goals Prevented', short: 'GP', group: 'Goalkeeping', scope: 'gk', get: (p) => p.season.goalsPrevented, format: dec1 },
  { key: 'fvRating', label: 'FieldVision Rating', short: 'FV', group: 'Attacking', scope: 'all', get: (p) => p.season.fvRating, format: dec2 },
]

export function getStatDef(key: string): StatDef | undefined {
  return STAT_CATALOG.find((s) => s.key === key)
}

export interface LeaderboardEntry {
  player: Player
  value: number
  rank: number
}

export interface LeaderboardOptions {
  limit?: number
  minMinutes?: number
}

export function leaderboard(
  players: Player[],
  statKey: string,
  options: LeaderboardOptions = {},
): LeaderboardEntry[] {
  const def = getStatDef(statKey)
  if (!def) return []
  const { limit = 10, minMinutes = 200 } = options

  const eligible = players.filter((p) => {
    if (def.scope === 'gk' && p.positionGroup !== 'GK') return false
    if (def.scope === 'outfield' && p.positionGroup === 'GK') return false
    return p.season.minutes >= minMinutes
  })

  return eligible
    .sort((a, b) => def.get(b) - def.get(a))
    .slice(0, limit)
    .map((player, i) => ({ player, value: def.get(player), rank: i + 1 }))
}
