// A team name that links to its team page. Optionally shows the crest. Used
// everywhere a team is named so the whole app routes to /team/:teamId.

import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { Team } from '../../data/types'
import { TeamCrest } from './TeamCrest'

interface TeamLinkProps {
  team: Team
  showCrest?: boolean
  crestSize?: 'xs' | 'sm' | 'md' | 'lg'
  useShortName?: boolean
  className?: string
}

export function TeamLink({
  team,
  showCrest = true,
  crestSize = 'md',
  useShortName = false,
  className,
}: TeamLinkProps) {
  return (
    <Link
      to={`/team/${team.id}`}
      className={clsx(
        'group inline-flex items-center gap-2.5 text-left transition-colors',
        className,
      )}
    >
      {showCrest ? <TeamCrest team={team} size={crestSize} /> : null}
      <span className="truncate font-medium text-ink-100 group-hover:text-blue-500">
        {useShortName ? team.shortName : team.name}
      </span>
    </Link>
  )
}
