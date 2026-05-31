// Tactical math for the squad view. Two things live here:
//   1. squadAttributes: the FIFA style PAC SHO PAS DRI DEF PHY readout, averaged
//      across the outfield players in the starting eleven.
//   2. formationAxes: a tactical fingerprint (attack, midfield, defence, width)
//      derived purely from where a formation's slots sit on the pitch, then
//      normalised across every formation so the bars are comparable. Deriving it
//      from the slot data means new formations get a profile for free.

import type { DetailedPosition, Player } from '../../data/types'
import { FORMATIONS, FORMATION_NAMES } from './formations'
import type { Formation, FormationName } from './formations'

export interface SquadAttributes {
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
}

const EMPTY_ATTRIBUTES: SquadAttributes = {
  pace: 0,
  shooting: 0,
  passing: 0,
  dribbling: 0,
  defending: 0,
  physical: 0,
}

export const SQUAD_ATTRIBUTE_KEYS: Array<{ key: keyof SquadAttributes; label: string }> = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
]

// Averages the six outfield attributes across the starting eleven. Keepers are
// skipped because they carry a different attribute set.
export function squadAttributes(starters: Player[]): SquadAttributes {
  const outfield = starters.filter((p) => p.attributes)
  if (!outfield.length) return EMPTY_ATTRIBUTES

  const totals = outfield.reduce(
    (acc, p) => {
      const a = p.attributes!
      acc.pace += a.pace
      acc.shooting += a.shooting
      acc.passing += a.passing
      acc.dribbling += a.dribbling
      acc.defending += a.defending
      acc.physical += a.physical
      return acc
    },
    { ...EMPTY_ATTRIBUTES },
  )

  const n = outfield.length
  return {
    pace: Math.round(totals.pace / n),
    shooting: Math.round(totals.shooting / n),
    passing: Math.round(totals.passing / n),
    dribbling: Math.round(totals.dribbling / n),
    defending: Math.round(totals.defending / n),
    physical: Math.round(totals.physical / n),
  }
}

export interface FormationAxes {
  attack: number
  midfield: number
  defence: number
  width: number
}

export const FORMATION_AXIS_KEYS: Array<{ key: keyof FormationAxes; label: string }> = [
  { key: 'attack', label: 'Attack' },
  { key: 'midfield', label: 'Midfield' },
  { key: 'defence', label: 'Defence' },
  { key: 'width', label: 'Width' },
]

// How much each detailed position contributes to an attacking or defensive
// emphasis. Positions left out contribute zero.
const ATTACK_WEIGHT: Partial<Record<DetailedPosition, number>> = {
  ST: 1,
  CF: 0.95,
  LW: 0.9,
  RW: 0.9,
  CAM: 0.75,
  LM: 0.45,
  RM: 0.45,
  CM: 0.2,
}

const DEFENCE_WEIGHT: Partial<Record<DetailedPosition, number>> = {
  CB: 1,
  LB: 0.7,
  RB: 0.7,
  LWB: 0.55,
  RWB: 0.55,
  CDM: 0.8,
  CM: 0.3,
}

const WIDTH_WEIGHT: Partial<Record<DetailedPosition, number>> = {
  LW: 1,
  RW: 1,
  LM: 1,
  RM: 1,
  LWB: 1,
  RWB: 1,
  LB: 0.65,
  RB: 0.65,
}

const MIDFIELD_POSITIONS: DetailedPosition[] = ['CDM', 'CM', 'CAM', 'LM', 'RM']

interface RawAxes {
  attack: number
  midfield: number
  defence: number
  width: number
}

function rawAxes(formation: Formation): RawAxes {
  let attack = 0
  let midfield = 0
  let defence = 0
  let width = 0
  for (const slot of formation.slots) {
    attack += ATTACK_WEIGHT[slot.pos] ?? 0
    defence += DEFENCE_WEIGHT[slot.pos] ?? 0
    width += WIDTH_WEIGHT[slot.pos] ?? 0
    if (MIDFIELD_POSITIONS.includes(slot.pos)) midfield += 1
  }
  return { attack, midfield, defence, width }
}

// Maps a raw value onto a 0 to 100 bar using the spread across all formations.
// We floor at 35 so the weakest shape still reads as a real bar, not an empty
// one, which keeps the comparison legible.
function scale(value: number, min: number, max: number): number {
  if (max <= min) return 70
  const ratio = (value - min) / (max - min)
  return Math.round(35 + ratio * 65)
}

function buildAxes(): Record<FormationName, FormationAxes> {
  const raws = FORMATION_NAMES.map((name) => rawAxes(FORMATIONS[name]))
  const range = (pick: (r: RawAxes) => number) => {
    const values = raws.map(pick)
    return { min: Math.min(...values), max: Math.max(...values) }
  }
  const attack = range((r) => r.attack)
  const midfield = range((r) => r.midfield)
  const defence = range((r) => r.defence)
  const width = range((r) => r.width)

  const result = {} as Record<FormationName, FormationAxes>
  FORMATION_NAMES.forEach((name, i) => {
    const r = raws[i]
    result[name] = {
      attack: scale(r.attack, attack.min, attack.max),
      midfield: scale(r.midfield, midfield.min, midfield.max),
      defence: scale(r.defence, defence.min, defence.max),
      width: scale(r.width, width.min, width.max),
    }
  })
  return result
}

export const FORMATION_AXES: Record<FormationName, FormationAxes> = buildAxes()
