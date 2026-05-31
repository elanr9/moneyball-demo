// Builds the identity, FIFA-style overall rating, and attribute profile for a
// player from a roster row. Season and match stats are attached separately
// (see generateStats.ts) because they depend on the generated schedule.

import type {
  ClassYear,
  DetailedPosition,
  Foot,
  GoalkeeperAttributes,
  OutfieldAttributes,
  Player,
  PositionGroup,
  Team,
} from './types'
import type { RosterRow } from './rosters'
import { FIRST_NAMES, HOMETOWNS, INTL_HOMETOWNS, LAST_NAMES } from './rosters'
import type { PlayerOverride } from './playerOverrides'
import { clamp, createRng, intRange, pick, range, type Rng } from './rng'

export type PlayerBase = Omit<Player, 'season' | 'matches'>

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
  'WI', 'WY', 'DC',
])

export function heightToInches(label: string): number {
  const match = label.match(/(\d+)'\s*(\d+)?/)
  if (!match) return 0
  return Number(match[1]) * 12 + Number(match[2] ?? 0)
}

function detectCountry(hometown: string): string {
  const parts = hometown.split(',').map((p) => p.trim())
  const last = parts[parts.length - 1]
  if (US_STATES.has(last)) return 'USA'
  return last || 'USA'
}

function normalizeClassYear(raw: string): ClassYear {
  const r = raw.toLowerCase()
  if (r.startsWith('fresh') || r.includes('first')) return 'Freshman'
  if (r.startsWith('soph')) return 'Sophomore'
  if (r.startsWith('jun')) return 'Junior'
  if (r.startsWith('sen')) return 'Senior'
  if (r.startsWith('grad')) return 'Graduate'
  return 'Junior'
}

function ageForClass(year: ClassYear): number {
  switch (year) {
    case 'Freshman':
      return 18
    case 'Sophomore':
      return 19
    case 'Junior':
      return 20
    case 'Senior':
      return 21
    case 'Graduate':
      return 23
  }
}

// FIFA-style alternate positions a player can naturally cover, keyed by their
// primary detailed position. Used to give every outfielder a realistic set of
// secondary positions so the market can be filtered like the FIFA player search.
const ALT_POSITIONS: Record<DetailedPosition, DetailedPosition[]> = {
  GK: [],
  CB: ['RB', 'LB', 'CDM'],
  LB: ['LWB', 'LM', 'CB'],
  RB: ['RWB', 'RM', 'CB'],
  LWB: ['LB', 'LM'],
  RWB: ['RB', 'RM'],
  CDM: ['CM', 'CB'],
  CM: ['CDM', 'CAM'],
  CAM: ['CM', 'LW', 'RW'],
  LM: ['LW', 'LWB'],
  RM: ['RW', 'RWB'],
  LW: ['LM', 'CAM', 'ST'],
  RW: ['RM', 'CAM', 'ST'],
  CF: ['ST', 'CAM'],
  ST: ['CF', 'CAM', 'LW', 'RW'],
}

// Position group each detailed position belongs to. Used when an override sets
// a player's primary position so the group stays consistent.
const GROUP_FOR_DETAILED: Record<DetailedPosition, PositionGroup> = {
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

// Build one or two natural FIFA-style secondary positions for a primary. Used
// when an override changes a player's primary position.
function buildSecondaryFor(primary: DetailedPosition, rng: Rng): DetailedPosition[] {
  if (primary === 'GK') return []
  const pool = ALT_POSITIONS[primary].filter((d) => d !== primary)
  const secondary: DetailedPosition[] = []
  const target = intRange(rng, 1, 2)
  while (secondary.length < target && pool.length > 0) {
    const choice = pick(rng, pool)
    secondary.push(choice)
    pool.splice(pool.indexOf(choice), 1)
  }
  return secondary
}

// Map a school's position label (e.g. "B/M") to a position group plus a
// primary and a set of FIFA-style secondary detailed positions.
function mapPositions(
  label: string,
  rng: Rng,
  heightIn: number,
): {
  group: PositionGroup
  primary: DetailedPosition
  secondary: DetailedPosition[]
} {
  const tokens = label.split('/').map((t) => t.trim().toUpperCase()).filter(Boolean)
  const groupOf = (token: string): PositionGroup => {
    if (token === 'GK') return 'GK'
    if (token === 'D' || token === 'B') return 'DEF'
    if (token === 'M') return 'MID'
    return 'FWD'
  }

  const groups = tokens.length ? tokens.map(groupOf) : ['MID' as PositionGroup]
  const primaryGroup = groups[0]

  const detailedFor = (group: PositionGroup): DetailedPosition => {
    switch (group) {
      case 'GK':
        return 'GK'
      case 'DEF':
        if (heightIn >= 73) return 'CB'
        return pick(rng, ['CB', 'LB', 'RB', 'CB'] as DetailedPosition[])
      case 'MID':
        return pick(rng, ['CDM', 'CM', 'CM', 'CAM', 'LM', 'RM'] as DetailedPosition[])
      case 'FWD':
        return pick(rng, ['ST', 'ST', 'LW', 'RW'] as DetailedPosition[])
    }
  }

  const primary = detailedFor(primaryGroup)
  const secondary: DetailedPosition[] = []

  // Any extra positions the school listed (e.g. "B/M") come first.
  for (let i = 1; i < groups.length; i += 1) {
    const d = detailedFor(groups[i])
    if (d !== primary && !secondary.includes(d)) secondary.push(d)
  }

  // Then top up with natural FIFA-style alternates so every outfielder can
  // cover one or two extra positions. Keepers stay specialists.
  if (primary !== 'GK') {
    const candidates = ALT_POSITIONS[primary].filter(
      (d) => d !== primary && !secondary.includes(d),
    )
    const target = secondary.length >= 2 ? secondary.length : intRange(rng, 1, 2)
    while (secondary.length < target && candidates.length > 0) {
      const choice = pick(rng, candidates)
      secondary.push(choice)
      candidates.splice(candidates.indexOf(choice), 1)
    }
  }

  return { group: primaryGroup, primary, secondary }
}

// Attribute deltas relative to the overall rating, per detailed position.
// Order: pace, shooting, passing, dribbling, defending, physical.
const OUTFIELD_ARCHETYPES: Record<DetailedPosition, [number, number, number, number, number, number]> = {
  GK: [0, 0, 0, 0, 0, 0],
  CB: [-8, -22, -6, -12, 14, 10],
  LB: [6, -12, 2, 2, 8, -2],
  RB: [6, -12, 2, 2, 8, -2],
  LWB: [10, -8, 4, 6, 4, -4],
  RWB: [10, -8, 4, 6, 4, -4],
  CDM: [-4, -10, 6, 0, 12, 8],
  CM: [0, 0, 10, 6, 2, 0],
  CAM: [2, 8, 12, 12, -10, -4],
  LM: [8, 2, 6, 10, -6, -4],
  RM: [8, 2, 6, 10, -6, -4],
  LW: [12, 8, 4, 14, -14, -6],
  RW: [12, 8, 4, 14, -14, -6],
  CF: [6, 14, 2, 12, -16, 4],
  ST: [8, 16, -4, 8, -18, 6],
}

function buildOutfieldAttributes(
  overall: number,
  primary: DetailedPosition,
  rng: Rng,
): OutfieldAttributes {
  const [dPac, dSho, dPas, dDri, dDef, dPhy] = OUTFIELD_ARCHETYPES[primary]
  const a = (delta: number) => clamp(Math.round(overall + delta + range(rng, -4, 4)), 32, 97)
  return {
    pace: a(dPac),
    shooting: a(dSho),
    passing: a(dPas),
    dribbling: a(dDri),
    defending: a(dDef),
    physical: a(dPhy),
  }
}

function buildGkAttributes(overall: number, rng: Rng): GoalkeeperAttributes {
  const a = (delta: number) => clamp(Math.round(overall + delta + range(rng, -3, 3)), 34, 97)
  return {
    diving: a(2),
    handling: a(0),
    kicking: a(-6),
    reflexes: a(3),
    speed: a(-14),
    positioning: a(1),
  }
}

function classBaseRating(year: ClassYear): number {
  switch (year) {
    case 'Freshman':
      return 65
    case 'Sophomore':
      return 68
    case 'Junior':
      return 71
    case 'Senior':
      return 73
    case 'Graduate':
      return 74
  }
}

// A handful of marquee names anchor the demo with standout ratings.
const MARQUEE_OVERALL: Record<string, number> = {
  'Elan Romo': 86,
}

export function buildPlayerFromRow(
  team: Team,
  row: RosterRow,
  override?: PlayerOverride,
): PlayerBase {
  const [number, name, posLabel, heightLabel, weightLbs, yearRaw, hometown, prev] = row
  const id = `${team.id}-${number}`
  const rng = createRng(id)

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const nameParts = name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || nameParts[0]

  const classYear = normalizeClassYear(yearRaw)
  const heightIn = heightToInches(heightLabel)
  let { group, primary, secondary } = mapPositions(posLabel, rng, heightIn)

  // A manual override sets the exact primary position and rebuilds the group and
  // secondary positions so the card, attributes, and filters stay consistent.
  if (override?.position) {
    primary = override.position
    group = GROUP_FOR_DETAILED[primary]
    secondary = buildSecondaryFor(primary, rng)
  }

  const starBump = Number(number) > 0 && Number(number) <= 11 ? range(rng, 0, 4) : 0
  const gkBump = group === 'GK' ? 1 : 0
  let overall = clamp(
    Math.round(classBaseRating(classYear) + starBump + gkBump + range(rng, -5, 7)),
    57,
    87,
  )
  if (MARQUEE_OVERALL[name]) overall = MARQUEE_OVERALL[name]
  if (override?.rating != null) overall = clamp(Math.round(override.rating), 1, 99)

  const potential = clamp(
    overall + intRange(rng, classYear === 'Freshman' ? 2 : 0, classYear === 'Freshman' ? 8 : 4),
    overall,
    93,
  )

  const foot: Foot = rng() < 0.24 ? 'L' : 'R'

  return {
    id,
    teamId: team.id,
    number,
    name,
    firstName,
    lastName,
    slug,
    positionGroup: group,
    primaryPosition: primary,
    secondaryPositions: secondary,
    heightInches: heightIn,
    heightLabel: heightLabel || '—',
    weightLbs,
    classYear,
    age: ageForClass(classYear),
    hometown,
    country: detectCountry(hometown),
    previousSchool: prev,
    foot,
    overall,
    potential,
    attributes: group === 'GK' ? null : buildOutfieldAttributes(overall, primary, rng),
    gkAttributes: group === 'GK' ? buildGkAttributes(overall, rng) : null,
  }
}

// Generate a believable roster of raw rows for a filler team so it has a full
// squad for the schedule, leaderboards, and opponent scouting.
export function generateFillerRows(team: Team, size: number): RosterRow[] {
  const rng = createRng(`${team.id}-roster`)
  const usedNumbers = new Set<number>()
  const usedNames = new Set<string>()

  // Positional template ensures a realistic spread: ~3 GK, 8 DEF, 8 MID, 5 FWD.
  const template: string[] = [
    'GK', 'GK', 'GK',
    'D', 'D', 'D', 'D', 'D', 'B', 'B', 'B',
    'M', 'M', 'M', 'M', 'M', 'M', 'M/F', 'B/M',
    'F', 'F', 'F', 'F', 'M/F',
  ]
  const heights = [`5'7"`, `5'8"`, `5'9"`, `5'10"`, `5'11"`, `6'0"`, `6'1"`, `6'2"`, `6'3"`]
  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']

  const rows: RosterRow[] = []
  for (let i = 0; i < size; i += 1) {
    let num = intRange(rng, 1, 39)
    let guard = 0
    while (usedNumbers.has(num) && guard < 60) {
      num = intRange(rng, 1, 39)
      guard += 1
    }
    usedNumbers.add(num)

    let name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
    let nameGuard = 0
    while (usedNames.has(name) && nameGuard < 30) {
      name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
      nameGuard += 1
    }
    usedNames.add(name)

    const isIntl = rng() < 0.28
    const [city, region] = isIntl ? pick(rng, INTL_HOMETOWNS) : pick(rng, HOMETOWNS)
    const pos = template[i % template.length]
    const weight = intRange(rng, 150, 195)

    rows.push([
      String(num),
      name,
      pos,
      pick(rng, heights),
      weight,
      pick(rng, years),
      `${city}, ${region}`,
      '',
    ])
  }
  return rows
}
