import type { Player } from '../types/player'

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type RatingTone = 'green' | 'yellow' | 'white' | 'red'

export function getRatingColor(rating: number): RatingTone {
  if (rating >= 8.0) return 'green'
  if (rating >= 7.0) return 'yellow'
  if (rating >= 6.0) return 'white'
  return 'red'
}

export type ResultTone = 'green' | 'red' | 'gray'

export function getResultColor(result: string): ResultTone {
  const trimmed = result.trim().toUpperCase()
  if (trimmed.startsWith('W')) return 'green'
  if (trimmed.startsWith('L')) return 'red'
  return 'gray'
}

export function getResultLetter(result: string): 'W' | 'L' | 'D' {
  const trimmed = result.trim().toUpperCase()
  if (trimmed.startsWith('W')) return 'W'
  if (trimmed.startsWith('L')) return 'L'
  return 'D'
}

export type StatFormat = 'integer' | 'decimal' | 'percent' | 'distance'

export function formatStat(value: number | string, format: StatFormat): string {
  if (typeof value === 'string') return value
  if (Number.isNaN(value)) return '0'
  switch (format) {
    case 'integer':
      return Math.round(value).toLocaleString()
    case 'decimal':
      return value.toFixed(2)
    case 'percent':
      return `${Math.round(value)}%`
    case 'distance':
      return `${value.toFixed(1)}`
    default:
      return String(value)
  }
}

export function topByStat<K extends keyof Player>(
  players: Player[],
  stat: K,
  n = 10,
): Player[] {
  return [...players]
    .sort((a, b) => Number(b[stat]) - Number(a[stat]))
    .slice(0, n)
}

export function getTeamAverages(players: Player[]) {
  if (players.length === 0) {
    return { fvRating: 0, goals: 0, xg: 0 }
  }
  const sum = players.reduce(
    (acc, p) => {
      acc.fvRating += p.fvRating || 0
      acc.goals += p.goals || 0
      acc.xg += p.xg || 0
      return acc
    },
    { fvRating: 0, goals: 0, xg: 0 },
  )
  return {
    fvRating: sum.fvRating / players.length,
    goals: sum.goals,
    xg: sum.xg,
  }
}

export function parseFraction(text: string | null | undefined): {
  numerator: number
  denominator: number
  pct: number
} {
  if (!text) return { numerator: 0, denominator: 0, pct: 0 }
  const match = String(text).match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return { numerator: 0, denominator: 0, pct: 0 }
  const numerator = Number(match[1])
  const denominator = Number(match[2])
  const pct = denominator === 0 ? 0 : (numerator / denominator) * 100
  return { numerator, denominator, pct }
}

export function approxAgeFromYear(year: string): number {
  const y = year?.toLowerCase() ?? ''
  if (y.includes('first')) return 18
  if (y.includes('soph')) return 19
  if (y.includes('junior')) return 20
  if (y.includes('senior')) return 21
  if (y.includes('grad')) return 23
  return 20
}

export function heightToInches(height: string): number {
  if (!height) return 0
  const match = height.match(/(\d+)'\s*(\d+)?/)
  if (!match) return 0
  const feet = Number(match[1] ?? 0)
  const inches = Number(match[2] ?? 0)
  return feet * 12 + inches
}
