// Team evaluation models for the coach dashboard. These turn the raw universe
// into the shapes the dashboard visualizations need: a playing style profile
// (the team DNA radar) and a league landscape (attack against defense for every
// club). Everything is pure and deterministic so the demo never shifts.

import type { Player, Universe } from './types'
import type { Percentiles } from './gameModel'
import { standingFor, teamPlayers } from './selectors'
import { round1 } from './rng'

// Only players with a real sample of minutes shape a team's style read.
const MIN_MINUTES_FOR_STYLE = 200

// Each axis blends a few model metrics into one readable playing style trait.
// Percentiles already invert lower is better metrics (like press intensity) so
// a high value on every axis always means the team does more of that thing.
export interface StyleAxis {
  key: string
  label: string
  metrics: string[]
}

export const STYLE_AXES: StyleAxis[] = [
  { key: 'press', label: 'Pressing', metrics: ['ppda', 'pressures'] },
  { key: 'progression', label: 'Progression', metrics: ['progressiveRuns', 'progressiveCarriesDistanceM'] },
  { key: 'movement', label: 'Off Ball Movement', metrics: ['offBallDistanceKm', 'runsCreatingChances', 'spaceCreatedPer90'] },
  { key: 'creation', label: 'Chance Creation', metrics: ['chancesCreated', 'xa', 'assists'] },
  { key: 'finishing', label: 'Finishing', metrics: ['goals', 'xg', 'shots'] },
  { key: 'defending', label: 'Defending', metrics: ['tackles', 'interceptions', 'duelsWonPercent'] },
]

// One axis value for a squad: the average across players of their average
// percentile in the axis metrics, scaled to a 0 to 100 reading.
function axisValue(players: Player[], percentiles: Percentiles, axis: StyleAxis): number {
  if (!players.length) return 0
  let total = 0
  for (const player of players) {
    let metricSum = 0
    for (const key of axis.metrics) metricSum += percentiles.pct(key, player)
    total += metricSum / axis.metrics.length
  }
  return round1((total / players.length) * 100)
}

export interface StylePoint {
  axis: string
  team: number
  league: number
}

// The team DNA radar data: the managed team against the league average on every
// style axis. League average is the mean of all clubs so it reflects this
// season, not an arbitrary midpoint.
export function teamStyleProfile(
  u: Universe,
  teamId: string,
  percentiles: Percentiles,
): StylePoint[] {
  const squads = new Map<string, Player[]>()
  for (const team of u.teams) {
    squads.set(
      team.id,
      teamPlayers(u, team.id).filter((p) => p.season.minutes >= MIN_MINUTES_FOR_STYLE),
    )
  }

  return STYLE_AXES.map((axis) => {
    const team = axisValue(squads.get(teamId) ?? [], percentiles, axis)
    let leagueTotal = 0
    for (const t of u.teams) leagueTotal += axisValue(squads.get(t.id) ?? [], percentiles, axis)
    const league = round1(leagueTotal / u.teams.length)
    return { axis: axis.label, team, league }
  })
}

export interface LandscapePoint {
  teamId: string
  shortName: string
  abbreviation: string
  color: string
  attack: number // goals scored per game
  defense: number // goals conceded per game
  points: number
}

// Attack against defense for every club, the league landscape quadrant. Attack
// is goals scored per game, defense is goals conceded per game.
export function leagueLandscape(u: Universe): LandscapePoint[] {
  return u.teams.map((team) => {
    const row = standingFor(u, team.id)
    const played = row?.played || 1
    return {
      teamId: team.id,
      shortName: team.shortName,
      abbreviation: team.abbreviation,
      color: team.primaryColor,
      attack: round1((row?.goalsFor ?? 0) / played),
      defense: round1((row?.goalsAgainst ?? 0) / played),
      points: row?.points ?? 0,
    }
  })
}

export interface LandscapeAverages {
  attack: number
  defense: number
}

export function landscapeAverages(points: LandscapePoint[]): LandscapeAverages {
  if (!points.length) return { attack: 0, defense: 0 }
  const attack = points.reduce((s, p) => s + p.attack, 0) / points.length
  const defense = points.reduce((s, p) => s + p.defense, 0) / points.length
  return { attack: round1(attack), defense: round1(defense) }
}

export interface SquadScatterPoint {
  id: string
  teamId: string
  slug: string
  name: string
  lastName: string
  position: string
  positionGroup: string
  overall: number
  fvRating: number
  minutes: number
  // How much the FieldVision rating beats or trails what the overall predicts.
  // Positive means the player produces above their rating, the moneyball edge.
  edge: number
}

// Maps a 55 to 86 overall onto the same 5.5 to 8.5 band the FV rating lives in,
// so the diagonal becomes the line where production matches reputation.
function expectedRating(overall: number): number {
  const t = (overall - 55) / (86 - 55)
  return 5.5 + t * (8.5 - 5.5)
}

// Squad performance points: overall (reputation) against FieldVision rating
// (actual production this season). Players above the expectation line are
// outperforming their reputation, the under the radar value the platform finds.
export function squadScatter(players: Player[]): SquadScatterPoint[] {
  return players
    .filter((p) => p.season.minutes >= MIN_MINUTES_FOR_STYLE)
    .map((p) => ({
      id: p.id,
      teamId: p.teamId,
      slug: p.slug,
      name: p.name,
      lastName: p.lastName,
      position: p.primaryPosition,
      positionGroup: p.positionGroup,
      overall: p.overall,
      fvRating: p.season.fvRating,
      minutes: p.season.minutes,
      edge: round1(p.season.fvRating - expectedRating(p.overall)),
    }))
}
