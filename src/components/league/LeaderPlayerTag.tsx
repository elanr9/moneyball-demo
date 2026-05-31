// A player's avatar with their club crest tucked in the corner, plus their name.
// Clicking routes to the player profile. Shared by every leaderboard row.

import { Link } from 'react-router-dom'
import type { Player, Team } from '../../data/types'
import { PlayerAvatar } from '../ui/PlayerAvatar'
import { TeamCrest } from './TeamCrest'

interface LeaderPlayerTagProps {
  player: Player
  team?: Team
}

export function LeaderPlayerTag({ player, team }: LeaderPlayerTagProps) {
  return (
    <Link
      to={`/player/${player.teamId}/${player.slug}`}
      className="group flex min-w-0 items-center gap-3"
    >
      <span className="relative shrink-0">
        <PlayerAvatar name={player.name} size="md" />
        {team ? (
          <span className="absolute -bottom-1 -right-1">
            <TeamCrest team={team} size="xs" />
          </span>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink-100 group-hover:text-blue-500">
          {player.name}
        </span>
        <span className="block truncate font-mono text-[11px] text-ink-300">
          {team?.shortName ?? player.teamId} · {player.primaryPosition}
        </span>
      </span>
    </Link>
  )
}
