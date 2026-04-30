export type Position = 'GK' | 'B' | 'M' | 'F' | 'M/B'

export interface Player {
  number: string
  name: string
  slug: string
  position: Position
  height: string
  year: string
  major: string
  hometown: string

  gp: number
  gs: number
  minutes: number

  goals: number
  assists: number
  xg: number
  xgOt: number
  xa: number
  shots: number
  shotsOnTarget: number
  shotsOffTarget: number
  blockedShots: number
  shotAccuracy: string
  accuratePasses: string
  chancesCreated: number
  bigChancesCreated: number
  defensiveContributions: number

  touches: number
  touchesOppBox: number
  successfulDribbles: string
  passesFinalThird: number
  accurateCrosses: string
  corners: number
  dispossessed: number

  groundDuelsWon: string
  aerialDuelsWon: string
  wasFouled: number
  foulsCommitted: number

  tackles: number
  interceptions: number
  recoveries: number
  dribbledPast: number

  offBallDistanceKm: number
  sprintDistanceM: number
  topSpeedKmh: number
  pressureEvents: number
  runsCreatingChances: number
  spaceCreatedPer90: number
  progressiveRuns: number
  defensiveActionsPer90: number

  fvRating: number
}
