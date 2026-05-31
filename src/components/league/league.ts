// Shared helpers for the League Center. Keeps formatting and team level
// aggregation in one typed place so the page and panels stay small.

import type { Match, MatchStage, Team, Universe } from '../../data/types'
import { round1 } from '../../data/rng'
import { standingFor, teamAggregate } from '../../data/selectors'

// Number of teams that reach the postseason. Used to highlight the cutoff.
export const POSTSEASON_CUTOFF = 8

// Friendly month + day label, e.g. "Aug 29". Avoids dashes in user copy.
export function dateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export interface RoundGroup {
  round: number
  date: string
  matches: Match[]
}

// Groups regular season matches by their round, sorted by date.
export function regularRounds(matches: Match[]): RoundGroup[] {
  const byRound = new Map<number, Match[]>()
  for (const m of matches) {
    if (m.stage !== 'regular') continue
    const list = byRound.get(m.round) ?? []
    list.push(m)
    byRound.set(m.round, list)
  }
  return [...byRound.entries()]
    .map(([round, list]) => ({
      round,
      date: list[0]?.date ?? '',
      matches: [...list].sort((a, b) => a.homeTeamId.localeCompare(b.homeTeamId)),
    }))
    .sort((a, b) => a.round - b.round)
}

export function postseasonMatches(matches: Match[]): Match[] {
  const order: Record<MatchStage, number> = {
    regular: 0,
    quarterfinal: 1,
    semifinal: 2,
    final: 3,
  }
  return matches
    .filter((m) => m.stage !== 'regular')
    .sort((a, b) => order[a.stage] - order[b.stage])
}

export type MatchOutcome = 'W' | 'D' | 'L'

export function outcomeFor(match: Match, teamId: string): MatchOutcome {
  const isHome = match.homeTeamId === teamId
  const scored = isHome ? match.homeGoals : match.awayGoals
  const conceded = isHome ? match.awayGoals : match.homeGoals
  if (scored > conceded) return 'W'
  if (scored < conceded) return 'L'
  return 'D'
}

export interface TeamStatRow {
  team: Team
  played: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  avgOverall: number
  avgFvRating: number
}

// Builds one aggregate row per team for the team stats leaderboards.
export function teamStatRows(u: Universe): TeamStatRow[] {
  return u.teams.map((team) => {
    const row = standingFor(u, team.id)
    const agg = teamAggregate(u, team.id)
    return {
      team,
      played: row?.played ?? 0,
      goalsFor: row?.goalsFor ?? 0,
      goalsAgainst: row?.goalsAgainst ?? 0,
      goalDifference: row?.goalDifference ?? 0,
      points: row?.points ?? 0,
      avgOverall: agg.avgOverall,
      avgFvRating: agg.avgFvRating,
    }
  })
}

export function avgPerGame(total: number, played: number): string {
  if (!played) return '0.0'
  return round1(total / played).toFixed(1)
}
