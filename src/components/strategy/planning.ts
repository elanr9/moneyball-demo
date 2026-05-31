// Logic for the Strategy Board. Given a squad, a formation and a planning
// season, it builds a depth chart: who starts each position, who backs them up,
// and where the eligibility cliff leaves a gap that needs a recruit. Player
// overalls are projected forward so the squad visibly matures season by season.

import type { DetailedPosition, Player } from '../../data/types'
import type { Formation, FormationSlot } from '../squad/formations'
import { fitTier } from '../squad/lineup'
import type { FitTier } from '../squad/lineup'
import { availableInSeason, eligibilityOf, projectedOverall } from '../../data/eligibility'

const TIER_BONUS: Record<FitTier, number> = {
  natural: 1000,
  position: 600,
  group: 300,
  out: 0,
}

function projectedFit(player: Player, pos: DetailedPosition, seasonYear: number): number {
  return TIER_BONUS[fitTier(player, pos)] + projectedOverall(player, seasonYear)
}

export interface SlotPlan {
  slot: FormationSlot
  starter: Player | null
  depth: Player[]
  gap: boolean
}

export interface DepthChart {
  slots: SlotPlan[]
  starters: Player[]
  available: Player[]
  // Players on the current roster who have graduated by the selected season.
  graduated: Player[]
}

// Builds the full depth chart for one planning season. Starters are picked
// greedily by best projected fit (keeper first), each remaining eligible player
// is slotted as depth to the single position they fit best, and any slot with
// no eligible starter is flagged as a gap.
export function buildDepthChart(
  players: Player[],
  formation: Formation,
  seasonYear: number,
): DepthChart {
  const available = players.filter((p) => availableInSeason(p, seasonYear))
  const graduated = players.filter((p) => !availableInSeason(p, seasonYear))
  const used = new Set<string>()
  const starterBySlot = new Map<string, Player>()

  const gkSlot = formation.slots.find((s) => s.pos === 'GK')
  if (gkSlot) {
    const keeper = available
      .filter((p) => p.positionGroup === 'GK')
      .sort((a, b) => projectedOverall(b, seasonYear) - projectedOverall(a, seasonYear))[0]
    if (keeper) {
      starterBySlot.set(gkSlot.id, keeper)
      used.add(keeper.id)
    }
  }

  for (const slot of formation.slots) {
    if (slot.pos === 'GK') continue
    let best: Player | null = null
    let bestScore = -Infinity
    for (const player of available) {
      if (used.has(player.id) || player.positionGroup === 'GK') continue
      const score = projectedFit(player, slot.pos, seasonYear)
      if (score > bestScore) {
        bestScore = score
        best = player
      }
    }
    if (best) {
      starterBySlot.set(slot.id, best)
      used.add(best.id)
    }
  }

  // Assign every remaining player to the one slot they fit best, building depth.
  const depthBySlot = new Map<string, Player[]>()
  for (const player of available) {
    if (used.has(player.id)) continue
    let bestSlot: FormationSlot | null = null
    let bestScore = -Infinity
    for (const slot of formation.slots) {
      if (slot.pos === 'GK' && player.positionGroup !== 'GK') continue
      if (slot.pos !== 'GK' && player.positionGroup === 'GK') continue
      const score = projectedFit(player, slot.pos, seasonYear)
      if (score > bestScore) {
        bestScore = score
        bestSlot = slot
      }
    }
    if (bestSlot) {
      const list = depthBySlot.get(bestSlot.id) ?? []
      list.push(player)
      depthBySlot.set(bestSlot.id, list)
    }
  }

  const slots: SlotPlan[] = formation.slots.map((slot) => {
    const starter = starterBySlot.get(slot.id) ?? null
    const depth = (depthBySlot.get(slot.id) ?? [])
      .sort((a, b) => projectedOverall(b, seasonYear) - projectedOverall(a, seasonYear))
      .slice(0, 2)
    return { slot, starter, depth, gap: !starter }
  })

  const starters = slots
    .map((s) => s.starter)
    .filter((p): p is Player => Boolean(p))

  return { slots, starters, available, graduated }
}

export interface YearMarker {
  year: number
  graduating: Player[]
}

// Counts graduations per season across the planning horizon. The spring a
// player leaves equals their eligibility through year.
export function graduationTimeline(players: Player[], years: number[]): YearMarker[] {
  return years.map((year) => ({
    year,
    graduating: players.filter((p) => eligibilityOf(p).throughYear === year),
  }))
}
