// Assembles the complete FieldVision universe once and caches it. Everything in
// the app reads from buildUniverse(): teams, fully-statted players, the season
// schedule, standings, and the postseason bracket.

import type { League, Match, Player, Team, Universe } from './types'
import { FEATURED_TEAMS, FILLER_TEAMS } from './rosters'
import { buildPlayerFromRow, generateFillerRows } from './generatePlayers'
import type { PlayerBase } from './generatePlayers'
import { getPlayerOverride } from './playerOverrides'
import {
  getDevOverride,
  mergeOverride,
  type DevOverrides,
} from './devOverrides'
import { attachStats, type SquadRole } from './generateStats'
import {
  computeStandings,
  generatePostseason,
  generateRegularSeason,
} from './generateSchedule'

const LEAGUE: Omit<League, 'teamIds'> = {
  id: 'd3-showcase',
  name: 'NCAA Division III National Showcase',
  division: 'NCAA Division III',
  season: '2025-26',
}

function buildBasePlayers(
  extra: DevOverrides,
): { teams: Team[]; baseByTeam: Map<string, PlayerBase[]> } {
  const teams: Team[] = []
  const baseByTeam = new Map<string, PlayerBase[]>()

  FEATURED_TEAMS.forEach((src) => {
    teams.push(src.meta)
    baseByTeam.set(
      src.meta.id,
      src.rows.map((row) => {
        const file = getPlayerOverride(src.meta.id, row[0])
        const dev = getDevOverride(extra, src.meta.id, row[0])
        return buildPlayerFromRow(src.meta, row, mergeOverride(file, dev))
      }),
    )
  })

  FILLER_TEAMS.forEach((src) => {
    teams.push(src.meta)
    const rows = generateFillerRows(src.meta, src.rosterSize)
    baseByTeam.set(src.meta.id, rows.map((row) => buildPlayerFromRow(src.meta, row)))
  })

  return { teams, baseByTeam }
}

// Assign starter / rotation / reserve roles and identify the starting keeper.
function assignRoles(players: PlayerBase[]): {
  roleById: Map<string, SquadRole>
  startingGkId: string | null
} {
  const roleById = new Map<string, SquadRole>()

  const gks = players
    .filter((p) => p.positionGroup === 'GK')
    .sort((a, b) => b.overall - a.overall)
  const startingGkId = gks[0]?.id ?? null
  gks.forEach((gk) => roleById.set(gk.id, 'reserve'))

  const outfield = players
    .filter((p) => p.positionGroup !== 'GK')
    .sort((a, b) => b.overall - a.overall)
  outfield.forEach((p, i) => {
    roleById.set(p.id, i < 10 ? 'starter' : i < 15 ? 'rotation' : 'reserve')
  })

  return { roleById, startingGkId }
}

function teamStrength(players: PlayerBase[], startingGkId: string | null): number {
  const outfieldTop = players
    .filter((p) => p.positionGroup !== 'GK')
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 10)
  const gk = players.find((p) => p.id === startingGkId)
  const eleven = gk ? [gk, ...outfieldTop] : outfieldTop
  const sum = eleven.reduce((acc, p) => acc + p.overall, 0)
  return sum / Math.max(eleven.length, 1)
}

let cached: { key: string; universe: Universe } | null = null

export function buildUniverse(extraOverrides: DevOverrides = {}): Universe {
  const key = JSON.stringify(extraOverrides)
  if (cached && cached.key === key) return cached.universe

  const { teams, baseByTeam } = buildBasePlayers(extraOverrides)

  const rolesByTeam = new Map<string, { roleById: Map<string, SquadRole>; startingGkId: string | null }>()
  const strengthByTeam: Record<string, number> = {}

  teams.forEach((team) => {
    const base = baseByTeam.get(team.id) ?? []
    const roles = assignRoles(base)
    rolesByTeam.set(team.id, roles)
    strengthByTeam[team.id] = teamStrength(base, roles.startingGkId)
  })

  const regular = generateRegularSeason(teams, strengthByTeam)
  const standings = computeStandings(regular, teams.map((t) => t.id))
  const postseason = generatePostseason(standings, strengthByTeam)
  const matches: Match[] = [...regular, ...postseason]

  const players: Player[] = []
  teams.forEach((team) => {
    const base = baseByTeam.get(team.id) ?? []
    const roles = rolesByTeam.get(team.id)
    base.forEach((p) => {
      const role = roles?.roleById.get(p.id) ?? 'reserve'
      const isStartingGk = roles?.startingGkId === p.id
      players.push(attachStats(p, regular, role, isStartingGk))
    })
  })

  const universe: Universe = {
    league: { ...LEAGUE, teamIds: teams.map((t) => t.id) },
    teams,
    players,
    matches,
    standings,
  }
  cached = { key, universe }
  return universe
}
