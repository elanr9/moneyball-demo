// Visual media helpers for teams.
//
// Players are shown by their initials across the app, so there are no player
// photos here. Logos: the five featured schools ship real crest art under
// /public/logos. Every other club falls back to the generated color crest
// (see TeamCrest).

import type { Team } from './types'

// Teams that have real logo art on disk under /public/logos/<id>.png.
const TEAMS_WITH_LOGOS = new Set([
  'brandeis',
  'emory',
  'uchicago',
  'babson',
  'suffolk',
])

// Real logo path for a club, or null when only the color crest is available.
export function teamLogoUrl(team: Team | undefined): string | null {
  if (!team) return null
  return TEAMS_WITH_LOGOS.has(team.id) ? `/logos/${team.id}.png` : null
}
