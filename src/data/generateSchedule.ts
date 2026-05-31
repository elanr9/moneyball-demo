// Generates a realistic NCAA Division III season: a 16-game regular season via
// the circle method (round robin + one rivalry rematch), match scores weighted
// by team strength, the resulting standings table, and an 8-team postseason
// bracket. Everything is deterministic from a fixed seed.

import type { Match, MatchStage, StandingsRow, Team } from './types'
import { clamp, createRng, type Rng } from './rng'

const SEASON_START = new Date('2025-08-29T00:00:00')

function addDays(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function poisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k += 1
    p *= rng()
  } while (p > L)
  return clamp(k - 1, 0, 7)
}

function simulateScore(
  rng: Rng,
  homeStrength: number,
  awayStrength: number,
): { home: number; away: number } {
  const diff = (homeStrength - awayStrength) / 9
  const lambdaHome = clamp(1.5 + diff, 0.3, 4.3)
  const lambdaAway = clamp(1.15 - diff, 0.3, 4.3)
  return { home: poisson(rng, lambdaHome), away: poisson(rng, lambdaAway) }
}

// Circle-method round robin producing 15 rounds for 16 teams, then a 16th
// rivalry round (rematch of round 1 with venues flipped).
export function generateRegularSeason(
  teams: Team[],
  strengthByTeam: Record<string, number>,
): Match[] {
  const ids = teams.map((t) => t.id)
  const n = ids.length
  const half = n / 2
  const matches: Match[] = []

  const fixedTeam = ids[0]
  let rotators = ids.slice(1)
  const roundOnePairs: Array<[string, string]> = []

  for (let round = 0; round < n - 1; round += 1) {
    const roundTeams = [fixedTeam, ...rotators]
    const date = addDays(SEASON_START, round * 4 + (round > 7 ? 2 : 0))
    for (let i = 0; i < half; i += 1) {
      const a = roundTeams[i]
      const b = roundTeams[n - 1 - i]
      const flip = (round + i) % 2 === 0
      const homeTeamId = flip ? a : b
      const awayTeamId = flip ? b : a
      if (round === 0) roundOnePairs.push([homeTeamId, awayTeamId])
      const { home, away } = simulateScore(
        createRng(`${homeTeamId}-${awayTeamId}-r${round}`),
        strengthByTeam[homeTeamId],
        strengthByTeam[awayTeamId],
      )
      matches.push({
        id: `m-r${round}-${homeTeamId}-${awayTeamId}`,
        leagueId: 'd3-showcase',
        date,
        round: round + 1,
        stage: 'regular',
        homeTeamId,
        awayTeamId,
        homeGoals: home,
        awayGoals: away,
        played: true,
      })
    }
    rotators = [rotators[rotators.length - 1], ...rotators.slice(0, -1)]
  }

  // Rivalry week: rematch round one with venues flipped to reach 16 games each.
  const rivalryDate = addDays(SEASON_START, (n - 1) * 4 + 4)
  roundOnePairs.forEach(([home, away], i) => {
    const homeTeamId = away
    const awayTeamId = home
    const { home: hg, away: ag } = simulateScore(
      createRng(`${homeTeamId}-${awayTeamId}-rivalry${i}`),
      strengthByTeam[homeTeamId],
      strengthByTeam[awayTeamId],
    )
    matches.push({
      id: `m-rivalry-${homeTeamId}-${awayTeamId}`,
      leagueId: 'd3-showcase',
      date: rivalryDate,
      round: n,
      stage: 'regular',
      homeTeamId,
      awayTeamId,
      homeGoals: hg,
      awayGoals: ag,
      played: true,
    })
  })

  return matches.sort((m1, m2) => m1.date.localeCompare(m2.date))
}

export function computeStandings(matches: Match[], teamIds: string[]): StandingsRow[] {
  const table = new Map<string, StandingsRow>()
  teamIds.forEach((id) => {
    table.set(id, {
      teamId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    })
  })

  const regular = matches
    .filter((m) => m.stage === 'regular' && m.played)
    .sort((a, b) => a.date.localeCompare(b.date))

  regular.forEach((m) => {
    const home = table.get(m.homeTeamId)
    const away = table.get(m.awayTeamId)
    if (!home || !away) return
    home.played += 1
    away.played += 1
    home.goalsFor += m.homeGoals
    home.goalsAgainst += m.awayGoals
    away.goalsFor += m.awayGoals
    away.goalsAgainst += m.homeGoals
    if (m.homeGoals > m.awayGoals) {
      home.wins += 1
      home.points += 3
      away.losses += 1
      home.form.push('W')
      away.form.push('L')
    } else if (m.homeGoals < m.awayGoals) {
      away.wins += 1
      away.points += 3
      home.losses += 1
      away.form.push('W')
      home.form.push('L')
    } else {
      home.draws += 1
      away.draws += 1
      home.points += 1
      away.points += 1
      home.form.push('D')
      away.form.push('D')
    }
  })

  const rows = [...table.values()].map((r) => ({
    ...r,
    goalDifference: r.goalsFor - r.goalsAgainst,
    form: r.form.slice(-5),
  }))

  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamId.localeCompare(b.teamId),
  )
}

// Top 8 seeded bracket: QF (1v8, 2v7, 3v6, 4v5), SF, Final.
export function generatePostseason(
  standings: StandingsRow[],
  strengthByTeam: Record<string, number>,
): Match[] {
  const seeds = standings.slice(0, 8).map((r) => r.teamId)
  if (seeds.length < 8) return []

  const matches: Match[] = []
  const qfDate = addDays(SEASON_START, 70)
  const sfDate = addDays(SEASON_START, 74)
  const finalDate = addDays(SEASON_START, 78)

  const playGame = (
    home: string,
    away: string,
    stage: MatchStage,
    date: string,
    key: string,
  ): string => {
    const rng = createRng(`postseason-${key}`)
    let home_g = 0
    let away_g = 0
    // No draws in the postseason: resimulate until decisive.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const s = simulateScore(rng, strengthByTeam[home], strengthByTeam[away])
      home_g = s.home
      away_g = s.away
      if (home_g !== away_g) break
      if (attempt === 11) home_g += 1
    }
    matches.push({
      id: `m-${stage}-${key}`,
      leagueId: 'd3-showcase',
      date,
      round: 0,
      stage,
      homeTeamId: home,
      awayTeamId: away,
      homeGoals: home_g,
      awayGoals: away_g,
      played: true,
    })
    return home_g > away_g ? home : away
  }

  const qf1 = playGame(seeds[0], seeds[7], 'quarterfinal', qfDate, 'qf1')
  const qf2 = playGame(seeds[3], seeds[4], 'quarterfinal', qfDate, 'qf2')
  const qf3 = playGame(seeds[1], seeds[6], 'quarterfinal', qfDate, 'qf3')
  const qf4 = playGame(seeds[2], seeds[5], 'quarterfinal', qfDate, 'qf4')

  const sf1 = playGame(qf1, qf2, 'semifinal', sfDate, 'sf1')
  const sf2 = playGame(qf3, qf4, 'semifinal', sfDate, 'sf2')

  playGame(sf1, sf2, 'final', finalDate, 'final')

  return matches
}
