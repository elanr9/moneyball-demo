// Tactical movement runs for the squad pitch. Given the starting eleven, this
// reads each player's attributes and their slot in the formation and proposes
// the off ball runs that player is built to make. A fast and fit full back gets
// an overlap up the touchline, a skilful winger gets a cut inside toward goal, a
// quick striker gets a run in behind, and so on.
//
// Everything is pure data keyed off the player attributes and the formation
// geometry, so adding a new rule or tuning a threshold is a one line change and
// any engineer can read exactly why an arrow shows up. Coordinates stay in the
// formation space (x 0 to 100 left to right, y 0 attack to 100 own goal); the
// pitch projects them to the screen so this file never deals with orientation.

import type { DetailedPosition, Player } from '../../data/types'
import type { Formation, FormationSlot } from './formations'
import type { Lineup } from './lineup'

export type RunKind =
  | 'overlap'
  | 'underlap'
  | 'runInBehind'
  | 'cutInside'
  | 'lateRun'
  | 'thirdMan'
  | 'dropLink'
  | 'cover'

// Runs fall into three readable families that share a colour and a legend entry.
export type RunCategory = 'wide' | 'forward' | 'support'

export interface TacticalRun {
  id: string
  kind: RunKind
  category: RunCategory
  label: string
  // The triggering numbers, shown as a small stat readout on the arrow.
  detail: string
  // Endpoints in formation space; the pitch projects these to the screen.
  from: { x: number; y: number }
  to: { x: number; y: number }
  // Signed bow of the arc, roughly minus one to one. Sign sets the curl side.
  curve: number
  priority: number
}

interface RunMeta {
  category: RunCategory
  label: string
  priority: number
}

const RUN_META: Record<RunKind, RunMeta> = {
  overlap: { category: 'wide', label: 'Overlap', priority: 6 },
  underlap: { category: 'wide', label: 'Underlap', priority: 4 },
  runInBehind: { category: 'forward', label: 'Run in behind', priority: 5 },
  cutInside: { category: 'forward', label: 'Cut inside', priority: 5 },
  lateRun: { category: 'forward', label: 'Late run', priority: 4 },
  thirdMan: { category: 'forward', label: 'Third man run', priority: 4 },
  dropLink: { category: 'support', label: 'Drop & link', priority: 2 },
  cover: { category: 'support', label: 'Drop & cover', priority: 2 },
}

export const RUN_CATEGORY_COLOR: Record<RunCategory, string> = {
  wide: '#34d399',
  forward: '#fbbf24',
  support: '#38bdf8',
}

export const RUN_CATEGORY_LABEL: Record<RunCategory, string> = {
  wide: 'Wide run',
  forward: 'Forward run',
  support: 'Support run',
}

// How many arrows we ever draw at once, so a balanced eleven stays readable.
const MAX_RUNS = 7

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

type Side = 'L' | 'R' | 'C'

function sideOf(slot: FormationSlot): Side {
  if (slot.x < 45) return 'L'
  if (slot.x > 55) return 'R'
  return 'C'
}

const WIDE_ATTACK_POS: DetailedPosition[] = ['LW', 'RW', 'LM', 'RM', 'CAM', 'ST']

// The most advanced attacking slot on a flank, used as the overlap target so the
// run actually points past the player ahead rather than into empty grass.
function mostAdvancedWide(slots: FormationSlot[], side: Side): FormationSlot | null {
  const candidates = slots.filter(
    (s) => (side === 'L' ? s.x < 45 : s.x > 55) && WIDE_ATTACK_POS.includes(s.pos),
  )
  if (!candidates.length) return null
  return candidates.reduce((best, s) => (s.y < best.y ? s : best))
}

function make(
  kind: RunKind,
  slot: FormationSlot,
  to: { x: number; y: number },
  curve: number,
  detail: string,
): TacticalRun {
  const meta = RUN_META[kind]
  return {
    id: `${slot.id}-${kind}`,
    kind,
    category: meta.category,
    label: meta.label,
    detail,
    from: { x: slot.x, y: slot.y },
    to,
    curve,
    priority: meta.priority,
  }
}

// Decides which runs a single player makes from their slot. Returns nothing for
// keepers and centre backs so the board stays focused on attacking intent.
function runsForSlot(
  slot: FormationSlot,
  player: Player,
  formation: Formation,
): TacticalRun[] {
  const a = player.attributes
  if (!a) return []

  const side = sideOf(slot)
  const out: TacticalRun[] = []

  switch (slot.pos) {
    case 'LB':
    case 'RB':
    case 'LWB':
    case 'RWB': {
      if (a.pace >= 78 && a.physical >= 70) {
        const wide = mostAdvancedWide(formation.slots, side)
        const baseX = wide ? wide.x : slot.x
        const tx =
          side === 'L' ? clamp(baseX - 3, 8, 46) : clamp(baseX + 3, 54, 92)
        const ty = clamp((wide ? wide.y : slot.y) - 14, 7, 100)
        out.push(
          make('overlap', slot, { x: tx, y: ty }, side === 'L' ? -1 : 1, `${a.pace} PAC · ${a.physical} PHY`),
        )
      } else if (a.dribbling >= 78) {
        const tx = side === 'L' ? clamp(slot.x + 14, 0, 48) : clamp(slot.x - 14, 52, 100)
        out.push(
          make('underlap', slot, { x: tx, y: clamp(slot.y - 22, 10, 100) }, side === 'L' ? 0.6 : -0.6, `${a.dribbling} DRI · ${a.pace} PAC`),
        )
      }
      break
    }

    case 'LW':
    case 'RW':
    case 'LM':
    case 'RM': {
      if (a.dribbling >= 76) {
        const tx = side === 'L' ? 42 : 58
        out.push(
          make('cutInside', slot, { x: tx, y: 22 }, side === 'L' ? 0.85 : -0.85, `${a.dribbling} DRI · ${a.shooting} SHO`),
        )
      } else if (a.pace >= 78) {
        out.push(
          make('runInBehind', slot, { x: slot.x, y: clamp(slot.y - 16, 6, 100) }, side === 'L' ? -0.3 : 0.3, `${a.pace} PAC · ${Math.round(player.season.topSpeedKmh)} km/h`),
        )
      }
      break
    }

    case 'ST': {
      if (a.pace >= 78) {
        out.push(
          make('runInBehind', slot, { x: clamp(slot.x + (side === 'L' ? 4 : side === 'R' ? -4 : 0), 14, 86), y: clamp(slot.y - 13, 5, 100) }, 0.25, `${a.pace} PAC · ${Math.round(player.season.topSpeedKmh)} km/h`),
        )
      } else if (a.physical >= 76) {
        out.push(
          make('dropLink', slot, { x: slot.x, y: clamp(slot.y + 12, 0, 100) }, side === 'L' ? -0.2 : 0.2, `${a.physical} PHY hold up`),
        )
      }
      break
    }

    case 'CF': {
      // A center forward leads with linking play, dropping to combine before a
      // late run, and only burning in behind when the pace is there.
      if (a.passing >= 74 || a.dribbling >= 76) {
        out.push(
          make('dropLink', slot, { x: slot.x, y: clamp(slot.y + 14, 0, 100) }, side === 'L' ? -0.25 : 0.25, `${a.passing} PAS · ${a.dribbling} DRI`),
        )
      } else if (a.pace >= 78) {
        out.push(
          make('runInBehind', slot, { x: clamp(slot.x, 14, 86), y: clamp(slot.y - 12, 5, 100) }, 0.25, `${a.pace} PAC · ${Math.round(player.season.topSpeedKmh)} km/h`),
        )
      }
      break
    }

    case 'CAM': {
      out.push(
        make('thirdMan', slot, { x: lerp(slot.x, 50, 0.3), y: 16 }, side === 'L' ? 0.3 : -0.3, `${a.passing} PAS · ${a.dribbling} DRI`),
      )
      break
    }

    case 'CM': {
      if (a.physical >= 76) {
        out.push(
          make('lateRun', slot, { x: lerp(slot.x, 50, 0.4), y: 24 }, side === 'L' ? 0.4 : -0.4, `${a.physical} PHY · ${player.season.progressiveRuns} prog`),
        )
      }
      break
    }

    case 'CDM': {
      if (a.defending >= 76) {
        out.push(
          make('cover', slot, { x: 50, y: clamp(slot.y + 10, 0, 100) }, 0.15, `${a.defending} DEF screen`),
        )
      }
      break
    }

    default:
      break
  }

  return out
}

// Builds every run for the current eleven, then keeps the highest priority handful
// so the board reads as a clear plan rather than a tangle of arrows.
export function buildTacticalRuns(
  formation: Formation,
  lineup: Lineup,
  playersById: Map<string, Player>,
): TacticalRun[] {
  const runs: TacticalRun[] = []
  for (const slot of formation.slots) {
    const playerId = lineup[slot.id]
    if (!playerId) continue
    const player = playersById.get(playerId)
    if (!player) continue
    runs.push(...runsForSlot(slot, player, formation))
  }
  return runs.sort((a, b) => b.priority - a.priority).slice(0, MAX_RUNS)
}
