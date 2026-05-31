// Attaches a full season of realistic stats to a player: a per-match line for
// every appearance plus aggregated season totals and FieldVision-exclusive
// advanced metrics. Output scales with the player's overall rating, position,
// and attribute profile so the numbers tell a coherent story.

import type {
  DetailedPosition,
  Match,
  Player,
  PlayerMatchStat,
  SeasonStats,
} from './types'
import type { PlayerBase } from './generatePlayers'
import { clamp, createRng, intRange, range, round1, round2, type Rng } from './rng'

export type SquadRole = 'starter' | 'rotation' | 'reserve'

interface PosRates {
  goals: number
  assists: number
  shots: number
  passes: number
  passBase: number // baseline pass accuracy %
  tackles: number
  interceptions: number
  clearances: number
  blocks: number
  recoveries: number
  pressures: number
  progRuns: number
  runsCC: number
  duels: number
  aerials: number
}

// Per-90 baseline rates by detailed position (before overall scaling).
const RATES: Record<DetailedPosition, PosRates> = {
  GK: r(0, 0, 0, 28, 70, 0.2, 0.3, 0.6, 0.2, 1.5, 0.5, 0.4, 0.1, 0.8, 0.6),
  CB: r(0.06, 0.05, 0.4, 46, 84, 2.1, 2.4, 3.6, 1.1, 6.5, 6, 1.2, 0.4, 4.5, 4.2),
  LB: r(0.05, 0.16, 0.6, 40, 80, 2.4, 1.8, 1.6, 0.6, 6, 9, 3.2, 1.3, 4, 1.6),
  RB: r(0.05, 0.16, 0.6, 40, 80, 2.4, 1.8, 1.6, 0.6, 6, 9, 3.2, 1.3, 4, 1.6),
  LWB: r(0.07, 0.2, 0.8, 38, 79, 2.2, 1.6, 1.3, 0.5, 5.8, 11, 4, 1.7, 3.8, 1.5),
  RWB: r(0.07, 0.2, 0.8, 38, 79, 2.2, 1.6, 1.3, 0.5, 5.8, 11, 4, 1.7, 3.8, 1.5),
  CDM: r(0.08, 0.16, 0.8, 56, 86, 2.9, 2.3, 1.3, 0.8, 7, 12, 2.2, 0.9, 5.2, 2.2),
  CM: r(0.22, 0.28, 1.3, 54, 85, 2.0, 1.5, 0.9, 0.5, 6, 14, 3.1, 1.5, 4.4, 1.8),
  CAM: r(0.44, 0.46, 2.2, 42, 82, 1.2, 0.9, 0.4, 0.2, 4.5, 16, 4.2, 2.7, 3.4, 1.2),
  LM: r(0.34, 0.34, 1.9, 36, 80, 1.5, 1.1, 0.5, 0.3, 5, 18, 4.4, 2.0, 3.2, 1.1),
  RM: r(0.34, 0.34, 1.9, 36, 80, 1.5, 1.1, 0.5, 0.3, 5, 18, 4.4, 2.0, 3.2, 1.1),
  LW: r(0.66, 0.44, 2.9, 28, 79, 1.0, 0.7, 0.3, 0.2, 4, 20, 5.2, 2.3, 3.6, 0.9),
  RW: r(0.66, 0.44, 2.9, 28, 79, 1.0, 0.7, 0.3, 0.2, 4, 20, 5.2, 2.3, 3.6, 0.9),
  CF: r(0.82, 0.4, 3.3, 34, 80, 0.9, 0.7, 0.3, 0.2, 4, 17, 4.2, 2.3, 4.2, 2.6),
  ST: r(0.98, 0.24, 3.7, 22, 76, 0.7, 0.5, 0.3, 0.2, 3.5, 18, 3.6, 1.6, 4.6, 3.4),
}

function r(
  goals: number, assists: number, shots: number, passes: number, passBase: number,
  tackles: number, interceptions: number, clearances: number, blocks: number, recoveries: number,
  pressures: number, progRuns: number, runsCC: number, duels: number, aerials: number,
): PosRates {
  return {
    goals, assists, shots, passes, passBase,
    tackles, interceptions, clearances, blocks, recoveries,
    pressures, progRuns, runsCC, duels, aerials,
  }
}

function poisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k += 1
    p *= rng()
  } while (p > L)
  return k - 1
}

interface Appearance {
  played: boolean
  started: boolean
  minutes: number
}

function appearanceFor(rng: Rng, role: SquadRole): Appearance {
  if (role === 'starter') {
    if (rng() < 0.05) return { played: false, started: false, minutes: 0 }
    const started = rng() < 0.92
    const minutes = started ? intRange(rng, 68, 90) : intRange(rng, 20, 45)
    return { played: true, started, minutes }
  }
  if (role === 'rotation') {
    if (rng() < 0.4) return { played: false, started: false, minutes: 0 }
    const started = rng() < 0.4
    const minutes = started ? intRange(rng, 55, 85) : intRange(rng, 18, 55)
    return { played: true, started, minutes }
  }
  if (rng() < 0.72) return { played: false, started: false, minutes: 0 }
  return { played: true, started: rng() < 0.12, minutes: intRange(rng, 8, 35) }
}

function teamRecord(matches: Match[], teamId: string) {
  let goalsAgainst = 0
  let cleanSheets = 0
  let games = 0
  matches.forEach((m) => {
    if (m.stage !== 'regular') return
    if (m.homeTeamId === teamId) {
      goalsAgainst += m.awayGoals
      if (m.awayGoals === 0) cleanSheets += 1
      games += 1
    } else if (m.awayTeamId === teamId) {
      goalsAgainst += m.homeGoals
      if (m.homeGoals === 0) cleanSheets += 1
      games += 1
    }
  })
  return { goalsAgainst, cleanSheets, games: games || 1 }
}

function emptySeason(): SeasonStats {
  return {
    appearances: 0, starts: 0, minutes: 0,
    goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, xg: 0, xa: 0,
    keyPasses: 0, passes: 0, passAccuracy: 0, chancesCreated: 0, bigChancesCreated: 0,
    tackles: 0, interceptions: 0, clearances: 0, blocks: 0, recoveries: 0,
    duelsWon: 0, duelsWonPercent: 0, aerialsWon: 0,
    offBallDistanceKm: 0, sprintDistanceM: 0, topSpeedKmh: 0, pressures: 0,
    runsCreatingChances: 0, progressiveRuns: 0, progressiveCarriesDistanceM: 0,
    spaceCreatedPer90: 0, defensiveActionsPer90: 0, ppda: 0,
    cleanSheets: 0, saves: 0, savePercent: 0, goalsConceded: 0, goalsPrevented: 0,
    fvRating: 0,
  }
}

export function attachStats(
  base: PlayerBase,
  teamMatches: Match[],
  role: SquadRole,
  isStartingGk: boolean,
): Player {
  const rng = createRng(`${base.id}-stats`)
  const myMatches = teamMatches
    .filter((m) => m.stage === 'regular' && (m.homeTeamId === base.teamId || m.awayTeamId === base.teamId))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (base.positionGroup === 'GK') {
    return attachGkStats(base, myMatches, isStartingGk, rng)
  }

  const rates = RATES[base.primaryPosition]
  const f = base.overall / 72 // overall scaling factor
  const pace = base.attributes?.pace ?? 70
  const matches: PlayerMatchStat[] = []
  const season = emptySeason()
  let ratingSum = 0
  let topSpeedMax = 0

  myMatches.forEach((m) => {
    const opponentTeamId = m.homeTeamId === base.teamId ? m.awayTeamId : m.homeTeamId
    const app = appearanceFor(rng, role)
    if (!app.played) return
    const min90 = app.minutes / 90

    const shots = poisson(rng, rates.shots * f * min90)
    const sot = Math.min(shots, poisson(rng, shots * 0.45))
    const goals = Math.min(sot, poisson(rng, rates.goals * f * min90))
    const xg = round2(clamp(goals * range(rng, 0.7, 1.05) + shots * range(rng, 0.03, 0.06), 0, 5))
    const assists = poisson(rng, rates.assists * f * min90)
    const keyPasses = assists + poisson(rng, rates.assists * 2.2 * f * min90)
    const xa = round2(clamp(assists * range(rng, 0.6, 1.0) + keyPasses * 0.07, 0, 4))
    const passes = Math.round(rates.passes * min90 * range(rng, 0.85, 1.15))
    const passAcc = clamp(Math.round(rates.passBase + (base.overall - 70) * 0.4 + range(rng, -5, 5)), 58, 95)
    const tackles = poisson(rng, rates.tackles * min90)
    const interceptions = poisson(rng, rates.interceptions * min90)
    const offBallKm = round2(min90 * range(rng, 9, 12.5))
    const topSpeed = round1(clamp(23 + (pace - 50) * 0.22 + range(rng, -1.1, 1.3), 24, 37))
    const runsCC = poisson(rng, rates.runsCC * f * min90)
    const progRuns = poisson(rng, rates.progRuns * f * min90)

    const rating = round1(
      clamp(
        6.4 +
          goals * 0.85 +
          assists * 0.5 +
          sot * 0.05 +
          (tackles + interceptions) * 0.025 +
          runsCC * 0.06 +
          progRuns * 0.015 +
          (base.overall - 70) * 0.02 +
          (app.minutes < 45 ? -0.2 : 0) +
          range(rng, -0.4, 0.5),
        5.0,
        9.9,
      ),
    )

    topSpeedMax = Math.max(topSpeedMax, topSpeed)
    ratingSum += rating

    season.appearances += 1
    season.starts += app.started ? 1 : 0
    season.minutes += app.minutes
    season.goals += goals
    season.assists += assists
    season.shots += shots
    season.shotsOnTarget += sot
    season.xg = round2(season.xg + xg)
    season.xa = round2(season.xa + xa)
    season.keyPasses += keyPasses
    season.passes += passes
    season.tackles += tackles
    season.interceptions += interceptions
    season.clearances += poisson(rng, rates.clearances * min90)
    season.blocks += poisson(rng, rates.blocks * min90)
    season.recoveries += poisson(rng, rates.recoveries * min90)
    season.pressures += poisson(rng, rates.pressures * min90)
    season.offBallDistanceKm = round1(season.offBallDistanceKm + offBallKm)
    season.sprintDistanceM += Math.round(min90 * range(rng, 180, 420) * (pace / 70))
    season.runsCreatingChances += runsCC
    season.progressiveRuns += progRuns
    const duels = poisson(rng, rates.duels * min90)
    const aerials = poisson(rng, rates.aerials * min90 * (base.heightInches >= 73 ? 1.3 : 0.9))
    season.duelsWon += duels
    season.aerialsWon += aerials
    // passAcc accumulated weighted by passes; store temp in passAccuracy as sum.
    season.passAccuracy += passAcc * passes

    matches.push({
      matchId: m.id,
      opponentTeamId,
      date: m.date,
      started: app.started,
      minutes: app.minutes,
      goals,
      assists,
      shots,
      shotsOnTarget: sot,
      xg,
      xa,
      passes,
      passAccuracy: passAcc,
      tackles,
      interceptions,
      offBallDistanceKm: offBallKm,
      topSpeedKmh: topSpeed,
      runsCreatingChances: runsCC,
      progressiveRuns: progRuns,
      rating,
    })
  })

  const apps = season.appearances || 1
  const min90Total = Math.max(season.minutes / 90, 0.5)

  season.passAccuracy = season.passes > 0 ? Math.round(season.passAccuracy / season.passes) : 0
  season.chancesCreated = season.keyPasses
  season.bigChancesCreated = Math.round(season.keyPasses * range(rng, 0.18, 0.3))
  season.duelsWonPercent = clamp(Math.round(range(rng, 45, 58) + (base.overall - 70) * 0.4), 35, 72)
  season.topSpeedKmh = topSpeedMax
  season.spaceCreatedPer90 = round1(clamp((season.runsCreatingChances / min90Total) * range(rng, 2.4, 3.4), 1, 15))
  season.defensiveActionsPer90 = round1(
    (season.tackles + season.interceptions + season.clearances + season.blocks) / min90Total,
  )
  season.progressiveCarriesDistanceM = Math.round(season.progressiveRuns * range(rng, 9, 13))
  season.ppda = round1(clamp(16 - (season.pressures / min90Total) * 0.22, 5.5, 18))
  season.fvRating = round2(ratingSum / apps)

  return { ...base, season, matches }
}

function attachGkStats(
  base: PlayerBase,
  myMatches: Match[],
  isStartingGk: boolean,
  rng: Rng,
): Player {
  const record = teamRecord(myMatches, base.teamId)
  const season = emptySeason()
  const matches: PlayerMatchStat[] = []
  let ratingSum = 0
  const role: SquadRole = isStartingGk ? 'starter' : 'reserve'
  const concededPerGame = record.goalsAgainst / record.games

  myMatches.forEach((m) => {
    const opponentTeamId = m.homeTeamId === base.teamId ? m.awayTeamId : m.homeTeamId
    const app = appearanceFor(rng, role)
    if (!app.played) return
    const min90 = app.minutes / 90
    const conceded = poisson(rng, Math.max(concededPerGame * min90, 0.1))
    const cleanSheet = conceded === 0 && app.minutes >= 70
    const saves = poisson(rng, range(rng, 2.6, 5.2) * min90 + (base.overall - 70) * 0.04)
    const passes = Math.round(28 * min90 * range(rng, 0.85, 1.15))
    const passAcc = clamp(Math.round(70 + (base.overall - 70) * 0.4 + range(rng, -6, 6)), 50, 92)
    const rating = round1(
      clamp(
        6.6 +
          (cleanSheet ? 0.8 : 0) +
          saves * 0.08 -
          conceded * 0.25 +
          (base.overall - 70) * 0.02 +
          range(rng, -0.3, 0.4),
        5.0,
        9.6,
      ),
    )

    ratingSum += rating
    season.appearances += 1
    season.starts += app.started ? 1 : 0
    season.minutes += app.minutes
    season.saves += saves
    season.goalsConceded += conceded
    season.cleanSheets += cleanSheet ? 1 : 0
    season.passes += passes
    season.passAccuracy += passAcc * passes
    season.offBallDistanceKm = round1(season.offBallDistanceKm + round2(min90 * range(rng, 4, 6)))

    matches.push({
      matchId: m.id,
      opponentTeamId,
      date: m.date,
      started: app.started,
      minutes: app.minutes,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      xg: 0,
      xa: 0,
      passes,
      passAccuracy: passAcc,
      tackles: 0,
      interceptions: 0,
      offBallDistanceKm: round2(min90 * range(rng, 4, 6)),
      topSpeedKmh: round1(range(rng, 24, 29)),
      runsCreatingChances: 0,
      progressiveRuns: 0,
      rating,
    })
  })

  const apps = season.appearances || 1
  season.passAccuracy = season.passes > 0 ? Math.round(season.passAccuracy / season.passes) : 0
  const shotsFaced = season.saves + season.goalsConceded
  season.savePercent = shotsFaced > 0 ? Math.round((season.saves / shotsFaced) * 100) : 0
  season.goalsPrevented = round2((base.overall - 72) * 0.12 * (season.minutes / 900) + range(rng, -0.6, 1.2))
  season.topSpeedKmh = round1(range(rng, 25, 29))
  season.fvRating = round2(ratingSum / apps)
  season.duelsWonPercent = 0

  return { ...base, season, matches }
}
