// A single match line: home team on the left, the final score in the middle,
// away team on the right. Team crests link to their pages. The winning side is
// emphasized. Used in fixtures, results, and team schedules.

import clsx from 'clsx'
import { Link } from 'react-router-dom'
import type { Match, Universe } from '../../data/types'
import { getTeam } from '../../data/selectors'
import { TeamCrest } from './TeamCrest'

interface MatchRowProps {
  universe: Universe
  match: Match
  highlightTeamId?: string
}

export function MatchRow({ universe, match, highlightTeamId }: MatchRowProps) {
  const home = getTeam(universe, match.homeTeamId)
  const away = getTeam(universe, match.awayTeamId)
  if (!home || !away) return null

  const homeWon = match.homeGoals > match.awayGoals
  const awayWon = match.awayGoals > match.homeGoals
  const involvesHighlight =
    highlightTeamId === match.homeTeamId || highlightTeamId === match.awayTeamId

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5',
        involvesHighlight && 'bg-navy-700/60',
      )}
    >
      <Link
        to={`/team/${home.id}`}
        className="flex flex-1 items-center justify-end gap-2.5 text-right"
      >
        <span
          className={clsx(
            'truncate text-sm hover:text-blue-500',
            homeWon ? 'font-semibold text-ink-100' : 'text-ink-300',
          )}
        >
          {home.shortName}
        </span>
        <TeamCrest team={home} size="sm" />
      </Link>

      <div className="flex shrink-0 items-center gap-1 rounded-md bg-navy-900 px-2.5 py-1 font-mono text-sm font-bold tabular-nums">
        <span className={homeWon ? 'text-ink-100' : 'text-ink-300'}>{match.homeGoals}</span>
        <span className="text-ink-500">:</span>
        <span className={awayWon ? 'text-ink-100' : 'text-ink-300'}>{match.awayGoals}</span>
      </div>

      <Link
        to={`/team/${away.id}`}
        className="flex flex-1 items-center gap-2.5 text-left"
      >
        <TeamCrest team={away} size="sm" />
        <span
          className={clsx(
            'truncate text-sm hover:text-blue-500',
            awayWon ? 'font-semibold text-ink-100' : 'text-ink-300',
          )}
        >
          {away.shortName}
        </span>
      </Link>
    </div>
  )
}
