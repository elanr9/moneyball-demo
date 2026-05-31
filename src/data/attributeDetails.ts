// FIFA-style detailed attribute breakdown for a player.
//
// The universe only stores the six headline ratings (pace, shooting, ...). To
// render the detailed card (Acceleration, Sprint Speed, Finishing, ...) we
// derive sub attributes deterministically from each headline value, seeded by
// the player id so the numbers never shift between reloads. This keeps the data
// model small while letting the UI show a rich, believable breakdown.

import type { GoalkeeperAttributes, OutfieldAttributes, Player } from './types'
import { clamp, createRng, intRange, type Rng } from './rng'

export interface AttributeStat {
  label: string
  value: number
}

export interface AttributeCategory {
  label: string
  short: string
  value: number
  stats: AttributeStat[]
}

// Sub attribute labels for each outfield category, mirroring the FIFA card.
const OUTFIELD_CATEGORIES: Array<{
  key: keyof OutfieldAttributes
  label: string
  short: string
  subs: string[]
}> = [
  { key: 'pace', label: 'Pace', short: 'PAC', subs: ['Acceleration', 'Sprint Speed'] },
  {
    key: 'shooting',
    label: 'Shooting',
    short: 'SHO',
    subs: ['Att. Position', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
  },
  {
    key: 'passing',
    label: 'Passing',
    short: 'PAS',
    subs: ['Vision', 'Crossing', 'FK Accuracy', 'Short Pass', 'Long Pass', 'Curve'],
  },
  {
    key: 'dribbling',
    label: 'Dribbling',
    short: 'DRI',
    subs: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
  },
  {
    key: 'defending',
    label: 'Defending',
    short: 'DEF',
    subs: ['Interceptions', 'Heading Acc.', 'Def. Aware', 'Stand Tackle', 'Slide Tackle'],
  },
  {
    key: 'physical',
    label: 'Physical',
    short: 'PHY',
    subs: ['Jumping', 'Stamina', 'Strength', 'Aggression'],
  },
]

const GK_CATEGORIES: Array<{
  key: keyof GoalkeeperAttributes
  label: string
  short: string
  subs: string[]
}> = [
  { key: 'diving', label: 'Diving', short: 'DIV', subs: ['Low Dive', 'High Dive'] },
  { key: 'handling', label: 'Handling', short: 'HAN', subs: ['Catching', 'Punching'] },
  { key: 'kicking', label: 'Kicking', short: 'KIC', subs: ['Goal Kicks', 'Throws'] },
  { key: 'reflexes', label: 'Reflexes', short: 'REF', subs: ['Reactions', 'Shot Stopping'] },
  { key: 'speed', label: 'Speed', short: 'SPD', subs: ['Acceleration', 'Sprint Speed'] },
  { key: 'positioning', label: 'Positioning', short: 'POS', subs: ['Awareness', 'Distribution'] },
]

// Spread sub attributes around the headline value with stable jitter, keeping
// the headline itself as the rough centre of the group.
function deriveStats(parent: number, subs: string[], rng: Rng): AttributeStat[] {
  return subs.map((label) => ({
    label,
    value: clamp(parent + intRange(rng, -9, 9), 24, 99),
  }))
}

export function attributeCategories(player: Player): AttributeCategory[] {
  const rng = createRng(`${player.id}-attr-detail`)

  if (player.positionGroup === 'GK' && player.gkAttributes) {
    const gk = player.gkAttributes
    return GK_CATEGORIES.map((cat) => ({
      label: cat.label,
      short: cat.short,
      value: gk[cat.key],
      stats: deriveStats(gk[cat.key], cat.subs, rng),
    }))
  }

  const attrs = player.attributes
  if (!attrs) return []
  return OUTFIELD_CATEGORIES.map((cat) => ({
    label: cat.label,
    short: cat.short,
    value: attrs[cat.key],
    stats: deriveStats(attrs[cat.key], cat.subs, rng),
  }))
}

// FIFA-style colour ramp from low (red) to elite (bright green).
export function attributeColor(value: number): string {
  if (value >= 80) return '#3DD68C'
  if (value >= 70) return '#7DD957'
  if (value >= 60) return '#F2C94C'
  if (value >= 50) return '#F2994A'
  return '#E5564E'
}
