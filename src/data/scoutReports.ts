// Human scouting intel that sits next to the FieldVision data. Real scouts file
// written reports with a star rating, and the platform blends those with the
// numbers. Reports are generated deterministically per player so the demo is
// stable, and they read like notes a real staff would leave.

import type { Player } from './types'
import { createRng, intRange, pick } from './rng'
import type { Rng } from './rng'

export type ReportType = 'Scouting' | 'Match'

export interface ScoutReport {
  id: string
  type: ReportType
  author: string
  date: string // ISO date during the season
  stars: number // 1 to 5 in half steps
  headline: string
  body: string
}

const AUTHORS = [
  'John Carver',
  'Alex Mehler',
  'Sam Whitlock',
  'Dana Pierce',
  'Marco Reyes',
  'Priya Anand',
]

const SCOUT_HEADLINES = [
  'Reads the game well beyond his class year',
  'Two footed and composed under pressure',
  'High motor that never drops off late',
  'Decision making in the final third stands out',
  'Physically ready for the next level now',
  'Quiet leader who lifts those around him',
]

const MATCH_HEADLINES = [
  'Controlled the tempo for ninety minutes',
  'Quiet first half then took over the game',
  'Defended the box like a senior',
  'Carried the attack almost on his own',
  'Worked tirelessly without the ball',
  'Set the press and the team followed',
]

const STRENGTH_PHRASES = [
  'His movement off the ball pulls defenses apart and creates space for runners.',
  'Comfortable receiving on the half turn and breaking lines with the first pass.',
  'Wins his individual duels and recovers ground quickly when beaten.',
  'Times his runs into the box as well as anyone we have tracked this year.',
  'Presses with real intent and forces turnovers in dangerous areas.',
  'Drives through midfield with the ball and draws fouls in good spots.',
]

const WATCH_PHRASES = [
  'Would like to see him add a few pounds before the spring.',
  'Final ball can get loose when the tempo rises.',
  'Needs more reps against quicker opposition to confirm the ceiling.',
  'Occasionally drifts out of the game for ten minute spells.',
  'Set piece delivery is a work in progress.',
  'Recovery runs can lag after a long shift.',
]

// Star ratings track the FieldVision rating but add scout flavor, clamped to a
// believable 2.5 to 5.0 band and rounded to the nearest half star.
function starsFromRating(rating: number, rng: Rng): number {
  const base = (rating - 5) * (5 / 4) // 5.0 rating maps low, 9.0 maps high
  const jittered = base + (rng() - 0.5)
  const clamped = Math.max(2.5, Math.min(5, jittered))
  return Math.round(clamped * 2) / 2
}

function reportDate(rng: Rng): string {
  const month = pick(rng, ['09', '10', '11'])
  const day = String(intRange(rng, 1, 27)).padStart(2, '0')
  return `2025-${month}-${day}`
}

export interface PlayerReports {
  reports: ScoutReport[]
  averageStars: number
  count: number
}

export function reportsFor(player: Player): PlayerReports {
  const rng = createRng(`${player.id}:reports`)
  const count = intRange(rng, 3, 6)
  const reports: ScoutReport[] = []

  for (let i = 0; i < count; i += 1) {
    const type: ReportType = rng() > 0.45 ? 'Match' : 'Scouting'
    const headline = pick(rng, type === 'Match' ? MATCH_HEADLINES : SCOUT_HEADLINES)
    const body = `${pick(rng, STRENGTH_PHRASES)} ${pick(rng, WATCH_PHRASES)}`
    reports.push({
      id: `${player.id}-report-${i}`,
      type,
      author: pick(rng, AUTHORS),
      date: reportDate(rng),
      stars: starsFromRating(player.season.fvRating, rng),
      headline,
      body,
    })
  }

  reports.sort((a, b) => b.date.localeCompare(a.date))
  const averageStars =
    Math.round((reports.reduce((s, r) => s + r.stars, 0) / reports.length) * 10) / 10

  return { reports, averageStars, count }
}
