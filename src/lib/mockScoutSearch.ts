import type { Player, Position } from '../types/player'
import { approxAgeFromYear, heightToInches } from './statHelpers'

export type FilterOp = '>' | '<' | '>=' | '<=' | '='

export interface StatFilter {
  stat: keyof Player
  op: FilterOp
  value: number
  label: string
}

export interface ScoutFilters {
  position: Position | null
  ageRange: [number, number] | null
  heightMin: string | null
  filters: StatFilter[]
}

export interface ScoutMatch {
  player: Player
  reasons: string[]
}

export interface ScoutResult {
  filters: ScoutFilters
  matches: ScoutMatch[]
  totalConsidered: number
}

export function parseQuery(query: string): ScoutFilters {
  const q = query.toLowerCase()
  const filters: StatFilter[] = []

  let position: Position | null = null
  if (/\b(forward|striker|winger|number\s*9|attacker)\b/.test(q))
    position = 'F'
  else if (/\b(midfielder|midfield|number\s*10)\b/.test(q)) position = 'M'
  else if (/\b(defender|center back|fullback|back\b|center-back)\b/.test(q))
    position = 'B'
  else if (/\b(goalkeeper|keeper|gk)\b/.test(q)) position = 'GK'

  let ageRange: [number, number] | null = null
  const underAge = q.match(/under\s*(\d{2})/)
  if (underAge) ageRange = [0, Number(underAge[1])]
  else if (/\byoung\b/.test(q)) ageRange = [0, 22]

  let heightMin: string | null = null
  const tallMatch = q.match(/(\d)['\u2019]\s*(\d{1,2})?/)
  if (tallMatch) {
    heightMin = `${tallMatch[1]}'${tallMatch[2] ?? '0'}"`
  } else if (/\btall\b/.test(q)) {
    heightMin = `6'0"`
  }

  if (/\b(elite\s*xg|high\s*xg|goal\s*scorer|prolific)\b/.test(q)) {
    filters.push({
      stat: 'xg',
      op: '>',
      value: 5,
      label: 'xG > 5.0',
    })
  }
  if (/\b(creative|playmaker|chance creator|assists?)\b/.test(q)) {
    filters.push({
      stat: 'assists',
      op: '>',
      value: 3,
      label: 'Assists > 3',
    })
    filters.push({
      stat: 'chancesCreated',
      op: '>',
      value: 15,
      label: 'Chances Created > 15',
    })
  }
  if (/\b(defensive|destroyer|tackles?)\b/.test(q)) {
    filters.push({
      stat: 'tackles',
      op: '>',
      value: 15,
      label: 'Tackles > 15',
    })
    filters.push({
      stat: 'interceptions',
      op: '>',
      value: 5,
      label: 'Interceptions > 5',
    })
  }
  if (/\b(fast|quick|speed|sprint)\b/.test(q)) {
    filters.push({
      stat: 'topSpeedKmh',
      op: '>',
      value: 30,
      label: 'Top Speed > 30 km/h',
    })
  }
  if (/\b(progressive|prog\s*runs|drives forward|carries)\b/.test(q)) {
    filters.push({
      stat: 'progressiveRuns',
      op: '>',
      value: 30,
      label: 'Progressive Runs > 30',
    })
  }
  if (/\b(high pressure|press|pressure events|presses)\b/.test(q)) {
    filters.push({
      stat: 'pressureEvents',
      op: '>',
      value: 50,
      label: 'Pressure Events > 50',
    })
  }
  if (/\b(high pass|passing|pass accuracy|distributor)\b/.test(q)) {
    filters.push({
      stat: 'touches',
      op: '>',
      value: 400,
      label: 'Touches > 400',
    })
  }
  if (/\b(recoveries|win the ball|ball winner)\b/.test(q)) {
    filters.push({
      stat: 'recoveries',
      op: '>',
      value: 30,
      label: 'Recoveries > 30',
    })
  }
  if (/\b(box presence|box threat)\b/.test(q)) {
    filters.push({
      stat: 'touchesOppBox',
      op: '>',
      value: 30,
      label: 'Touches in Opp Box > 30',
    })
  }

  return { position, ageRange, heightMin, filters }
}

export function mockScoutSearch(
  query: string,
  players: Player[],
): ScoutResult {
  const filters = parseQuery(query)
  const heightMinIn = filters.heightMin ? heightToInches(filters.heightMin) : 0

  const filtered = players.filter((p) => {
    if (filters.position) {
      if (filters.position === 'B') {
        if (p.position !== 'B' && p.position !== 'M/B') return false
      } else if (p.position !== filters.position) return false
    }
    if (filters.ageRange) {
      const age = approxAgeFromYear(p.year)
      const [min, max] = filters.ageRange
      if (age < min || age > max) return false
    }
    if (heightMinIn) {
      if (heightToInches(p.height) < heightMinIn) return false
    }
    for (const f of filters.filters) {
      const v = Number(p[f.stat])
      if (Number.isNaN(v)) return false
      if (f.op === '>' && !(v > f.value)) return false
      if (f.op === '<' && !(v < f.value)) return false
      if (f.op === '>=' && !(v >= f.value)) return false
      if (f.op === '<=' && !(v <= f.value)) return false
      if (f.op === '=' && v !== f.value) return false
    }
    return true
  })

  const ranked = [...filtered].sort((a, b) => b.fvRating - a.fvRating)

  const matches: ScoutMatch[] = ranked.slice(0, 5).map((p) => {
    const reasons: string[] = []
    for (const f of filters.filters.slice(0, 3)) {
      const v = Number(p[f.stat])
      reasons.push(`${humanizeStat(f.stat)}: ${formatStatValue(f.stat, v)} (matches ${f.label})`)
    }
    if (reasons.length === 0) {
      reasons.push(`FV Rating: ${p.fvRating.toFixed(1)}`)
      reasons.push(`Goals: ${p.goals} · Assists: ${p.assists}`)
    }
    return { player: p, reasons }
  })

  return {
    filters,
    matches,
    totalConsidered: filtered.length,
  }
}

function humanizeStat(key: keyof Player): string {
  switch (key) {
    case 'xg':
      return 'xG'
    case 'xa':
      return 'xA'
    case 'topSpeedKmh':
      return 'Top Speed'
    case 'progressiveRuns':
      return 'Progressive Runs'
    case 'pressureEvents':
      return 'Pressure Events'
    case 'offBallDistanceKm':
      return 'Off Ball Distance'
    case 'chancesCreated':
      return 'Chances Created'
    case 'touchesOppBox':
      return 'Touches in Opp Box'
    case 'fvRating':
      return 'FV Rating'
    default:
      return String(key).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  }
}

function formatStatValue(key: keyof Player, value: number): string {
  if (key === 'xg' || key === 'xa') return value.toFixed(2)
  if (key === 'topSpeedKmh' || key === 'offBallDistanceKm') return value.toFixed(1)
  return Math.round(value).toString()
}
