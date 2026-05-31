// College roster planning replaces the money based contract layer a pro club
// would track. Instead of salaries and expiry years we model NCAA eligibility:
// how many years a player can still suit up, the season they run out, and where
// they sit on their development curve. This is the data behind the Strategy
// Board year badges and the whole Development hub.

import type { ClassYear, Player } from './types'

// The demo universe runs the 2025-26 season, so the planning horizon starts in
// the autumn of 2025. Eligibility years are counted from here.
export const SEASON_START_YEAR = 2025

// Total NCAA eligibility is four playing years. The class year tells us how many
// of those a player has already used and therefore how many remain.
const YEARS_REMAINING: Record<ClassYear, number> = {
  Freshman: 4,
  Sophomore: 3,
  Junior: 2,
  Senior: 1,
  Graduate: 1,
}

export interface Eligibility {
  classYear: ClassYear
  yearsRemaining: number
  // The spring the player is projected to graduate and leave the program.
  throughYear: number
  // The autumn the player first joined the program (their recruiting class).
  entryYear: number
  // True when this is the player's final eligible season.
  finalSeason: boolean
}

export function eligibilityOf(player: Player): Eligibility {
  const yearsRemaining = YEARS_REMAINING[player.classYear]
  const yearsUsed = 4 - yearsRemaining
  return {
    classYear: player.classYear,
    yearsRemaining,
    throughYear: SEASON_START_YEAR + yearsRemaining,
    entryYear: SEASON_START_YEAR - yearsUsed,
    finalSeason: yearsRemaining <= 1,
  }
}

// Is this player still on the roster in a given future season. Used by the
// Strategy Board to fade out players who have graduated by that year.
export function availableInSeason(player: Player, seasonYear: number): boolean {
  return seasonYear < eligibilityOf(player).throughYear
}

export type DevelopmentStage = 'Breakout' | 'Rising' | 'Prime' | 'Veteran'

export interface Development {
  ceilingGap: number // potential minus current overall
  stage: DevelopmentStage
  // A 0 to 100 read on how much room is left to grow into the ceiling.
  upside: number
}

export function developmentOf(player: Player): Development {
  const ceilingGap = Math.max(0, player.potential - player.overall)
  let stage: DevelopmentStage
  if (player.age <= 19 && ceilingGap >= 4) stage = 'Breakout'
  else if (ceilingGap >= 3) stage = 'Rising'
  else if (player.age >= 23) stage = 'Veteran'
  else stage = 'Prime'
  const upside = Math.round(Math.min(100, (ceilingGap / 12) * 100))
  return { ceilingGap, stage, upside }
}

// Projects a player's overall forward to a future season. Younger players with
// a high ceiling close the gap to their potential faster, so the Strategy Board
// can show a squad maturing season by season. Returns the current overall for
// the present season and never exceeds the player's potential.
export function projectedOverall(player: Player, seasonYear: number): number {
  const yearsAhead = Math.max(0, seasonYear - SEASON_START_YEAR)
  if (yearsAhead === 0) return player.overall
  const gap = Math.max(0, player.potential - player.overall)
  const closed = Math.min(1, yearsAhead * 0.35)
  return Math.min(player.potential, Math.round(player.overall + gap * closed))
}

export const CLASS_ORDER: ClassYear[] = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
]
