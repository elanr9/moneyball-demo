// Builds the best starting eleven for a formation. The rule is simple and
// deterministic: keepers fill the GK slot first, then every outfield slot takes
// the highest scoring available player. A player scores higher when the slot is
// their natural position, then a listed secondary position, then the same
// position group, and lowest when it is out of group.

import type { DetailedPosition, Player, PositionGroup } from '../../data/types'
import type { Formation } from './formations'

const GROUP_OF: Record<DetailedPosition, PositionGroup> = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  LWB: 'DEF',
  RWB: 'DEF',
  CDM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  LM: 'MID',
  RM: 'MID',
  LW: 'FWD',
  RW: 'FWD',
  CF: 'FWD',
  ST: 'FWD',
}

export type FitTier = 'natural' | 'position' | 'group' | 'out'

export function fitTier(player: Player, pos: DetailedPosition): FitTier {
  if (player.primaryPosition === pos) return 'natural'
  if (player.secondaryPositions.includes(pos)) return 'position'
  if (GROUP_OF[player.primaryPosition] === GROUP_OF[pos]) return 'group'
  return 'out'
}

const TIER_BONUS: Record<FitTier, number> = {
  natural: 1000,
  position: 600,
  group: 300,
  out: 0,
}

export function fitScore(player: Player, pos: DetailedPosition): number {
  return TIER_BONUS[fitTier(player, pos)] + player.overall
}

// Maps each formation slot id to a player id. Slots stay unassigned only when
// the squad runs out of players, which keeps the view safe for thin rosters.
export type Lineup = Record<string, string>

// A player picked up for a swap. Starters carry their slotId, while bench and
// reserve players carry a null slotId since they sit off the pitch.
export interface SquadSelection {
  playerId: string
  slotId: string | null
}

// Drag and drop payload key shared by the pitch and the bench rail.
export const DRAG_MIME = 'text/fieldvision-player'

// Places a player into a slot, returning a new lineup. If the player already
// holds another slot the two are swapped; if the player comes from the bench
// the player previously in the slot is simply pushed out of the eleven.
export function placeInSlot(
  lineup: Lineup,
  slotId: string,
  playerId: string,
): Lineup {
  const next: Lineup = { ...lineup }
  const previousInSlot = next[slotId]
  const fromSlot = Object.keys(next).find((id) => next[id] === playerId)
  if (fromSlot && fromSlot !== slotId) {
    if (previousInSlot) next[fromSlot] = previousInSlot
    else delete next[fromSlot]
  }
  next[slotId] = playerId
  return next
}

export function autoLineup(players: Player[], formation: Formation): Lineup {
  const used = new Set<string>()
  const lineup: Lineup = {}

  const gkSlot = formation.slots.find((s) => s.pos === 'GK')
  if (gkSlot) {
    const keeper = players
      .filter((p) => p.positionGroup === 'GK')
      .sort((a, b) => b.overall - a.overall)[0]
    if (keeper) {
      lineup[gkSlot.id] = keeper.id
      used.add(keeper.id)
    }
  }

  for (const slot of formation.slots) {
    if (slot.pos === 'GK') continue
    let best: Player | null = null
    let bestScore = -Infinity
    for (const player of players) {
      if (used.has(player.id)) continue
      if (player.positionGroup === 'GK') continue
      const score = fitScore(player, slot.pos)
      if (score > bestScore) {
        bestScore = score
        best = player
      }
    }
    if (best) {
      lineup[slot.id] = best.id
      used.add(best.id)
    }
  }

  return lineup
}
