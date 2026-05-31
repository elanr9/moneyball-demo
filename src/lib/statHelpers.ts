// Small presentation helpers shared by the UI layer. Kept dependency free so any
// component can use them without pulling in the data engine.

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export type RatingTone = 'green' | 'yellow' | 'white' | 'red'

export function getRatingColor(rating: number): RatingTone {
  if (rating >= 8.0) return 'green'
  if (rating >= 7.0) return 'yellow'
  if (rating >= 6.0) return 'white'
  return 'red'
}
