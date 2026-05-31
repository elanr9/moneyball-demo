// Structured filter model for the transfer market plus the logic that applies
// it to the universe players and explains why each player matched. The natural
// language parser writes into this same shape, so the search bar and the filter
// rail stay perfectly in sync.

import type {
  ClassYear,
  DetailedPosition,
  Foot,
  Player,
  PositionGroup,
} from '../../data/types'
import { getStatDef } from '../../data/selectors'

export type PositionGroupFilter = PositionGroup | 'ALL'
export type DetailedPositionFilter = DetailedPosition | 'ALL'

export interface MarketFilters {
  positionGroup: PositionGroupFilter
  detailedPosition: DetailedPositionFilter
  teamId: string
  country: string
  classYear: ClassYear | 'ALL'
  foot: Foot | 'ALL'
  heightMin: number // inches, 0 means any
  heightMax: number // inches, 0 means any
  overallMin: number
  overallMax: number
  ageMax: number // 0 means any
  // Each entry is a minimum threshold keyed by a STAT_CATALOG stat key.
  statMins: Record<string, number>
}

export const OVERALL_FLOOR = 50
export const OVERALL_CEIL = 99
export const HEIGHT_FLOOR = 62 // 5'2"
export const HEIGHT_CEIL = 80 // 6'8"

export const DEFAULT_FILTERS: MarketFilters = {
  positionGroup: 'ALL',
  detailedPosition: 'ALL',
  teamId: 'ALL',
  country: 'ALL',
  classYear: 'ALL',
  foot: 'ALL',
  heightMin: 0,
  heightMax: 0,
  overallMin: OVERALL_FLOOR,
  overallMax: OVERALL_CEIL,
  ageMax: 0,
  statMins: {},
}

export function inchesToLabel(inches: number): string {
  if (!inches) return 'Any'
  const feet = Math.floor(inches / 12)
  const rest = inches % 12
  return `${feet}'${rest}"`
}

export const POSITION_GROUP_LABEL: Record<PositionGroup, string> = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
}

// Detailed FIFA-style positions grouped by area, used to build the position
// dropdown and to validate parsed search queries.
export const DETAILED_POSITIONS: Record<PositionGroup, DetailedPosition[]> = {
  GK: ['GK'],
  DEF: ['RB', 'CB', 'LB', 'RWB', 'LWB'],
  MID: ['CDM', 'CM', 'CAM', 'RM', 'LM'],
  FWD: ['RW', 'ST', 'LW'],
}

export const DETAILED_POSITION_LABEL: Record<DetailedPosition, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  LB: 'Left Back',
  RB: 'Right Back',
  LWB: 'Left Wing Back',
  RWB: 'Right Wing Back',
  CDM: 'Defensive Mid',
  CM: 'Central Mid',
  CAM: 'Attacking Mid',
  LM: 'Left Mid',
  RM: 'Right Mid',
  LW: 'Left Wing',
  RW: 'Right Wing',
  CF: 'Center Forward',
  ST: 'Striker',
}

// A player covers a detailed position if it is their primary or one of their
// FIFA-style secondary positions.
export function playsDetailedPosition(
  player: Player,
  position: DetailedPosition,
): boolean {
  return (
    player.primaryPosition === position ||
    player.secondaryPositions.includes(position)
  )
}

// Hides goalkeeper only stats from outfielders and vice versa.
function statAppliesTo(player: Player, statKey: string): boolean {
  const def = getStatDef(statKey)
  if (!def) return false
  if (def.scope === 'gk') return player.positionGroup === 'GK'
  if (def.scope === 'outfield') return player.positionGroup !== 'GK'
  return true
}

export function filterPlayers(
  players: Player[],
  filters: MarketFilters,
): Player[] {
  return players.filter((p) => {
    if (filters.positionGroup !== 'ALL' && p.positionGroup !== filters.positionGroup)
      return false
    if (
      filters.detailedPosition !== 'ALL' &&
      !playsDetailedPosition(p, filters.detailedPosition)
    )
      return false
    if (filters.teamId !== 'ALL' && p.teamId !== filters.teamId) return false
    if (filters.country !== 'ALL' && p.country !== filters.country) return false
    if (filters.classYear !== 'ALL' && p.classYear !== filters.classYear)
      return false
    if (filters.foot !== 'ALL' && p.foot !== filters.foot) return false

    if (filters.heightMin > 0 && (!p.heightInches || p.heightInches < filters.heightMin))
      return false
    if (filters.heightMax > 0 && (!p.heightInches || p.heightInches > filters.heightMax))
      return false

    if (p.overall < filters.overallMin || p.overall > filters.overallMax)
      return false
    if (filters.ageMax > 0 && p.age > filters.ageMax) return false

    for (const [key, min] of Object.entries(filters.statMins)) {
      if (!statAppliesTo(p, key)) return false
      const def = getStatDef(key)
      if (!def) continue
      if (def.get(p) < min) return false
    }
    return true
  })
}

export interface MatchReason {
  label: string
}

// Plain English explanation of why a player satisfies the active filters. Used
// for the "why this player" chips on each result.
export function matchReasons(player: Player, filters: MarketFilters): MatchReason[] {
  const reasons: MatchReason[] = []

  if (filters.detailedPosition !== 'ALL') {
    const isPrimary = player.primaryPosition === filters.detailedPosition
    reasons.push({
      label: isPrimary
        ? filters.detailedPosition
        : `${filters.detailedPosition} alt`,
    })
  } else if (filters.positionGroup !== 'ALL') {
    reasons.push({ label: player.primaryPosition })
  }
  if (filters.foot !== 'ALL') {
    reasons.push({
      label: filters.foot === 'L' ? 'Left footed' : 'Right footed',
    })
  }
  if (filters.ageMax > 0) {
    reasons.push({ label: `Age ${player.age}` })
  }
  if (filters.classYear !== 'ALL') {
    reasons.push({ label: player.classYear })
  }
  if (filters.heightMin > 0 || filters.heightMax > 0) {
    reasons.push({ label: player.heightLabel })
  }
  if (filters.overallMin > OVERALL_FLOOR) {
    reasons.push({ label: `${player.overall} overall` })
  }

  for (const key of Object.keys(filters.statMins)) {
    const def = getStatDef(key)
    if (!def) continue
    reasons.push({
      label: `${def.short} ${def.format(def.get(player))}`,
    })
  }

  return reasons
}

// Chips describing the active filters for the header summary.
export function describeFilters(
  filters: MarketFilters,
  teamName: (teamId: string) => string,
): MatchReason[] {
  const chips: MatchReason[] = []
  if (filters.detailedPosition !== 'ALL')
    chips.push({ label: DETAILED_POSITION_LABEL[filters.detailedPosition] })
  else if (filters.positionGroup !== 'ALL')
    chips.push({ label: POSITION_GROUP_LABEL[filters.positionGroup] })
  if (filters.teamId !== 'ALL')
    chips.push({ label: teamName(filters.teamId) })
  if (filters.country !== 'ALL')
    chips.push({ label: filters.country })
  if (filters.classYear !== 'ALL')
    chips.push({ label: filters.classYear })
  if (filters.foot !== 'ALL')
    chips.push({ label: filters.foot === 'L' ? 'Left footed' : 'Right footed' })
  if (filters.ageMax > 0) chips.push({ label: `Under ${filters.ageMax + 1}` })
  if (filters.heightMin > 0)
    chips.push({ label: `Min ${inchesToLabel(filters.heightMin)}` })
  if (filters.heightMax > 0)
    chips.push({ label: `Max ${inchesToLabel(filters.heightMax)}` })
  if (filters.overallMin > OVERALL_FLOOR)
    chips.push({ label: `Overall ${filters.overallMin}+` })
  for (const [key, min] of Object.entries(filters.statMins)) {
    const def = getStatDef(key)
    if (!def) continue
    chips.push({ label: `${def.label} ${def.format(min)}+` })
  }
  return chips
}

export function hasActiveFilters(filters: MarketFilters): boolean {
  return (
    filters.positionGroup !== 'ALL' ||
    filters.detailedPosition !== 'ALL' ||
    filters.teamId !== 'ALL' ||
    filters.country !== 'ALL' ||
    filters.classYear !== 'ALL' ||
    filters.foot !== 'ALL' ||
    filters.heightMin > 0 ||
    filters.heightMax > 0 ||
    filters.overallMin > OVERALL_FLOOR ||
    filters.overallMax < OVERALL_CEIL ||
    filters.ageMax > 0 ||
    Object.keys(filters.statMins).length > 0
  )
}
