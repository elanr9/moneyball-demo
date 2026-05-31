// A ranked comparison of the player against their position peers on a chosen
// role. The player is pinned and highlighted so a coach can read where this
// player sits in the league for the brief that matters to them.

import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { Player, Universe } from '../../data/types'
import type { Percentiles, RoleDef } from '../../data/gameModel'
import { roleScore } from '../../data/gameModel'
import { getTeam } from '../../data/selectors'
import { ScoreBar } from '../ui/ScoreBar'
import { TeamCrest } from '../league/TeamCrest'

interface ComparisonListProps {
  universe: Universe
  player: Player
  role: RoleDef
  percentiles: Percentiles
}

export function ComparisonList({ universe, player, role, percentiles }: ComparisonListProps) {
  const ranked = universe.players
    .filter((p) => p.positionGroup === player.positionGroup && p.season.minutes >= 200)
    .map((p) => ({ player: p, score: roleScore(p, role, percentiles) }))
    .sort((a, b) => b.score - a.score)

  const myIndex = ranked.findIndex((r) => r.player.id === player.id)
  // Show a window around the player so context is visible even if not elite.
  const start = Math.max(0, Math.min(myIndex - 3, ranked.length - 8))
  const window = ranked.slice(start, start + 8)

  return (
    <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
      <h2 className="section-label mb-1 text-blue-500">Comparison by {role.name}</h2>
      <div className="mb-4 text-xs text-ink-300">
        {player.positionGroup === 'GK' ? 'Goalkeepers' : 'Players at this position'} ranked across the
        league by your game model.
      </div>
      <div className="space-y-2">
        {window.map((entry) => {
          const isMe = entry.player.id === player.id
          const rank = ranked.indexOf(entry) + 1
          const team = getTeam(universe, entry.player.teamId)
          return (
            <Link
              key={entry.player.id}
              to={`/player/${entry.player.teamId}/${entry.player.slug}`}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                isMe ? 'bg-fv-greenLight ring-1 ring-fv-green' : 'hover:bg-navy-700',
              )}
            >
              <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-ink-300">
                {rank}
              </span>
              {team ? <TeamCrest team={team} size="xs" /> : null}
              <span
                className={clsx(
                  'min-w-0 flex-1 truncate text-sm',
                  isMe ? 'font-bold text-ink-100' : 'text-ink-100',
                )}
              >
                {entry.player.name}
              </span>
              <div className="w-32 shrink-0">
                <ScoreBar value={entry.score} accent={isMe} />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
