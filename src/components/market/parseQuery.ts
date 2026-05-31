// Rules based natural language parser for the scout search bar. It reads a plain
// English query and produces a patch for the structured MarketFilters, plus a
// short summary of what it understood. Stat intents ("elite xG", "fast") are
// turned into population percentile thresholds so they stay meaningful as the
// data changes. This is intentionally simple and explainable, not an LLM.

import type {
  ClassYear,
  DetailedPosition,
  Player,
  PositionGroup,
  Team,
} from '../../data/types'
import { getStatDef } from '../../data/selectors'
import { DETAILED_POSITION_LABEL } from './filters'
import type { MarketFilters } from './filters'

export interface ParseResult {
  patch: Partial<MarketFilters>
  summary: string[]
}

interface StatIntent {
  test: RegExp
  statKey: string
  percentile: number
}

// Phrase to stat mappings. Several can fire at once (e.g. "fast ball winner").
const STAT_INTENTS: StatIntent[] = [
  { test: /elite (xg|finishing)|prolific|clinical|goalscorer|goal scorer|poacher/, statKey: 'xg', percentile: 0.85 },
  { test: /\bgoals?\b|finisher|scoring/, statKey: 'goals', percentile: 0.8 },
  { test: /creative|playmaker|chance creator|creator|assist/, statKey: 'chancesCreated', percentile: 0.82 },
  { test: /key pass/, statKey: 'keyPasses', percentile: 0.82 },
  { test: /progressive|ball carrier|carries|drives forward|line breaker/, statKey: 'progressiveRuns', percentile: 0.82 },
  { test: /fast|quick|pace|speed|rapid|sprinter|burner/, statKey: 'topSpeedKmh', percentile: 0.85 },
  { test: /ball winner|ball winning|wins? the ball|win the ball back|destroyer|tackler|combative|aggressive|slide tackle|tackles?/, statKey: 'tackles', percentile: 0.8 },
  { test: /\bduels?\b|strong in (the )?duels|wins? duels|win duels|strong in the air|dominant in the air|wins? headers|win headers/, statKey: 'duelsWonPercent', percentile: 0.8 },
  { test: /intercept|reads the game/, statKey: 'interceptions', percentile: 0.8 },
  { test: /high press|presses|press resistant|intensity|presser/, statKey: 'pressures', percentile: 0.82 },
  { test: /passer|distributor|passing|tidy|metronome/, statKey: 'passAccuracy', percentile: 0.8 },
  { test: /engine|work rate|covers ground|box to box|tireless|runner/, statKey: 'offBallDistanceKm', percentile: 0.82 },
  { test: /space|creates space/, statKey: 'spaceCreatedPer90', percentile: 0.82 },
  { test: /runs creating chances|off ball runs|incisive runs/, statKey: 'runsCreatingChances', percentile: 0.82 },
]

function percentileValue(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length))
  return sorted[idx]!
}

// Phrase to FIFA-style detailed position. Ordered so the most specific phrases
// win (e.g. "left wing back" before "left back"). The first match is used.
const DETAILED_POSITION_INTENTS: Array<{ test: RegExp; position: DetailedPosition }> = [
  { test: /left wing[ -]?back|\blwb\b/, position: 'LWB' },
  { test: /right wing[ -]?back|\brwb\b/, position: 'RWB' },
  { test: /left[ -]?back|\blb\b/, position: 'LB' },
  { test: /right[ -]?back|\brb\b/, position: 'RB' },
  { test: /cent(er|re)[ -]?back|central defender|\bcb\b/, position: 'CB' },
  { test: /defensive mid|holding mid|deep[ -]?lying|anchor|number 6|\bcdm\b/, position: 'CDM' },
  { test: /attacking mid|number 10|\bcam\b/, position: 'CAM' },
  { test: /left mid|\blm\b/, position: 'LM' },
  { test: /right mid|\brm\b/, position: 'RM' },
  { test: /central mid|box to box|\bcm\b/, position: 'CM' },
  { test: /left wing(er)?|\blw\b/, position: 'LW' },
  { test: /right wing(er)?|\brw\b/, position: 'RW' },
  { test: /striker|cent(er|re) forward|number 9|\bst\b|\bcf\b/, position: 'ST' },
  { test: /goalkeeper|keeper|shot stopper|\bgk\b/, position: 'GK' },
]

function detectDetailedPosition(q: string): DetailedPosition | null {
  for (const intent of DETAILED_POSITION_INTENTS) {
    if (intent.test.test(q)) return intent.position
  }
  return null
}

function detectPositionGroup(q: string): PositionGroup | null {
  if (/keeper|goalkeeper|\bgk\b|shot stopper/.test(q)) return 'GK'
  if (/winger|striker|forward|attacker|number 9|finisher|\bcf\b|\blw\b|\brw\b|\bst\b/.test(q))
    return 'FWD'
  if (/midfield|playmaker|box to box|holding mid|deep lying|\bcm\b|\bcdm\b|\bcam\b/.test(q))
    return 'MID'
  if (/defender|center back|centre back|center-back|full ?back|wing ?back|\bcb\b|\blb\b|\brb\b|\bback\b/.test(q))
    return 'DEF'
  return null
}

function detectClassYear(q: string): ClassYear | null {
  if (/freshman|first year/.test(q)) return 'Freshman'
  if (/sophomore/.test(q)) return 'Sophomore'
  if (/junior/.test(q)) return 'Junior'
  if (/senior/.test(q)) return 'Senior'
  if (/graduate|grad student|grad\b/.test(q)) return 'Graduate'
  return null
}

export function parseMarketQuery(
  query: string,
  players: Player[],
  teams: Team[],
): ParseResult {
  const q = query.toLowerCase()
  const patch: Partial<MarketFilters> = {}
  const summary: string[] = []

  const detailed = detectDetailedPosition(q)
  if (detailed) {
    patch.detailedPosition = detailed
    patch.positionGroup = 'ALL'
    summary.push(DETAILED_POSITION_LABEL[detailed])
  } else {
    const group = detectPositionGroup(q)
    if (group) {
      patch.positionGroup = group
      patch.detailedPosition = 'ALL'
      summary.push(`Position ${group}`)
    }
  }

  if (/left[ -]?foot|lefty|left footed/.test(q)) {
    patch.foot = 'L'
    summary.push('Left footed')
  } else if (/right[ -]?foot|right footed/.test(q)) {
    patch.foot = 'R'
    summary.push('Right footed')
  }

  const under = q.match(/under\s*(\d{2})|u(\d{2})\b/)
  if (under) {
    const age = Number(under[1] ?? under[2])
    patch.ageMax = age - 1
    summary.push(`Under ${age}`)
  } else if (/young|youthful/.test(q)) {
    patch.ageMax = 20
    summary.push('Young')
  }

  const classYear = detectClassYear(q)
  if (classYear) {
    patch.classYear = classYear
    summary.push(classYear)
  }

  const heightMatch = q.match(/(\d)\s*['\u2019]\s*(\d{1,2})?/)
  if (heightMatch) {
    const inches = Number(heightMatch[1]) * 12 + Number(heightMatch[2] ?? 0)
    patch.heightMin = inches
    summary.push(`Min ${heightMatch[1]}'${heightMatch[2] ?? '0'}"`)
  } else if (/\btall\b/.test(q)) {
    patch.heightMin = 73
    summary.push("Min 6'1\"")
  }

  const team = teams.find(
    (t) =>
      q.includes(t.shortName.toLowerCase()) ||
      q.includes(t.school.toLowerCase()) ||
      q.includes(t.name.toLowerCase()),
  )
  if (team) {
    patch.teamId = team.id
    summary.push(team.shortName)
  }

  const countries = Array.from(new Set(players.map((p) => p.country)))
  const country = countries.find((c) => c && q.includes(c.toLowerCase()))
  if (country) {
    patch.country = country
    summary.push(country)
  }

  const overallMatch = q.match(/(\d{2})\s*\+?\s*(overall|rated|ovr)/)
  if (overallMatch) {
    patch.overallMin = Number(overallMatch[1])
    summary.push(`Overall ${overallMatch[1]}+`)
  } else if (/elite|world class|star|gold/.test(q)) {
    patch.overallMin = 80
    summary.push('Overall 80+')
  }

  const statMins: Record<string, number> = {}
  const usedKeys = new Set<string>()
  for (const intent of STAT_INTENTS) {
    if (usedKeys.has(intent.statKey)) continue
    if (!intent.test.test(q)) continue
    const def = getStatDef(intent.statKey)
    if (!def) continue
    const eligible = players.filter((p) => {
      if (def.scope === 'gk' && p.positionGroup !== 'GK') return false
      if (def.scope === 'outfield' && p.positionGroup === 'GK') return false
      return p.season.minutes >= 300
    })
    const threshold = percentileValue(
      eligible.map((p) => def.get(p)),
      intent.percentile,
    )
    statMins[intent.statKey] = Math.round(threshold * 100) / 100
    usedKeys.add(intent.statKey)
    summary.push(`${def.label} ${def.format(threshold)}+`)
  }
  if (Object.keys(statMins).length > 0) patch.statMins = statMins

  return { patch, summary }
}
