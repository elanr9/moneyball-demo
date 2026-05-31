// Core domain types for the FieldVision universe.
// Everything the app renders (squads, transfer market, league tables,
// leaderboards, schedules) is derived from these shapes. Keeping them in one
// place makes it easy for any engineer to understand the full data model.

export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD'

// FIFA-style detailed positions. Used for formation slots and card badges.
export type DetailedPosition =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'CF'
  | 'ST'

export type Foot = 'L' | 'R'

export type ClassYear =
  | 'Freshman'
  | 'Sophomore'
  | 'Junior'
  | 'Senior'
  | 'Graduate'

// FIFA-style outfield attributes, each on a 1-99 scale.
export interface OutfieldAttributes {
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
}

// Goalkeeper attributes, 1-99 scale.
export interface GoalkeeperAttributes {
  diving: number
  handling: number
  kicking: number
  reflexes: number
  speed: number
  positioning: number
}

// Aggregated season totals plus FieldVision-exclusive advanced metrics.
export interface SeasonStats {
  appearances: number
  starts: number
  minutes: number

  goals: number
  assists: number
  shots: number
  shotsOnTarget: number
  xg: number
  xa: number

  keyPasses: number
  passes: number
  passAccuracy: number // percentage 0-100
  chancesCreated: number
  bigChancesCreated: number

  tackles: number
  interceptions: number
  clearances: number
  blocks: number
  recoveries: number
  duelsWon: number
  duelsWonPercent: number // percentage 0-100
  aerialsWon: number

  // FieldVision-exclusive computer-vision metrics. These are the numbers no
  // other provider has at the D3 level and power the "Moneyball" pitch.
  offBallDistanceKm: number
  sprintDistanceM: number
  topSpeedKmh: number
  pressures: number
  runsCreatingChances: number
  progressiveRuns: number
  progressiveCarriesDistanceM: number
  spaceCreatedPer90: number
  defensiveActionsPer90: number
  ppda: number // passes allowed per defensive action (lower = more press)

  // Goalkeeper-only season stats (0 for outfield players).
  cleanSheets: number
  saves: number
  savePercent: number // percentage 0-100
  goalsConceded: number
  goalsPrevented: number

  fvRating: number // season average FieldVision match rating, ~5.5-8.5
}

// A single player's line in a single match.
export interface PlayerMatchStat {
  matchId: string
  opponentTeamId: string
  date: string
  started: boolean
  minutes: number
  goals: number
  assists: number
  shots: number
  shotsOnTarget: number
  xg: number
  xa: number
  passes: number
  passAccuracy: number
  tackles: number
  interceptions: number
  offBallDistanceKm: number
  topSpeedKmh: number
  runsCreatingChances: number
  progressiveRuns: number
  rating: number // FieldVision match rating ~5.0-9.9
}

export interface Player {
  id: string
  teamId: string
  number: string
  name: string
  firstName: string
  lastName: string
  slug: string

  positionGroup: PositionGroup
  primaryPosition: DetailedPosition
  secondaryPositions: DetailedPosition[]

  heightInches: number // 0 when unknown
  heightLabel: string // e.g. 6'1"
  weightLbs: number // 0 when unknown
  classYear: ClassYear
  age: number
  hometown: string
  country: string
  previousSchool: string // high school or transfer school

  foot: Foot
  overall: number // FIFA-style 1-99 (D3 realistic ~55-86)
  potential: number // >= overall

  // Exactly one of these is populated depending on positionGroup.
  attributes: OutfieldAttributes | null
  gkAttributes: GoalkeeperAttributes | null

  season: SeasonStats
  matches: PlayerMatchStat[]
}

export interface Team {
  id: string
  name: string // full display name, e.g. "Emory Eagles"
  school: string // e.g. "Emory University"
  shortName: string // e.g. "Emory"
  abbreviation: string // 3-4 letters, e.g. "EMO"
  mascot: string
  city: string
  state: string
  primaryColor: string
  secondaryColor: string
  conference: string
  defaultFormation: string // e.g. "4-3-3"
  isFeatured: boolean // true for the 5 schools with full real rosters
}

export type MatchStage = 'regular' | 'quarterfinal' | 'semifinal' | 'final'

export interface Match {
  id: string
  leagueId: string
  date: string // ISO date
  round: number
  stage: MatchStage
  homeTeamId: string
  awayTeamId: string
  homeGoals: number
  awayGoals: number
  played: boolean
}

export interface StandingsRow {
  teamId: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: Array<'W' | 'D' | 'L'> // most recent last
}

export interface League {
  id: string
  name: string
  division: string // "NCAA Division III"
  season: string // "2025-26"
  teamIds: string[]
}

export interface Universe {
  league: League
  teams: Team[]
  players: Player[]
  matches: Match[]
  standings: StandingsRow[]
}
