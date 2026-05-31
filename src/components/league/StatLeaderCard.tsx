// FotMob style leaderboard card for one stat. Shows the top five by default with
// the leader's value in a colored pill, then a "see all" toggle that expands to a
// full ranked table.

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Universe } from '../../data/types'
import type { StatDef } from '../../data/selectors'
import { getTeam, leaderboard } from '../../data/selectors'
import { LeaderPlayerTag } from './LeaderPlayerTag'

interface StatLeaderCardProps {
  universe: Universe
  def: StatDef
}

const TOP_LIMIT = 5
const FULL_LIMIT = 30

export function StatLeaderCard({ universe, def }: StatLeaderCardProps) {
  const [expanded, setExpanded] = useState(false)

  const entries = useMemo(
    () =>
      leaderboard(universe.players, def.key, {
        limit: expanded ? FULL_LIMIT : TOP_LIMIT,
      }),
    [universe.players, def.key, expanded],
  )

  if (!entries.length) return null

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between gap-2 border-b border-navy-600 px-4 py-3 text-left transition-colors hover:bg-navy-700"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink-100">{def.label}</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
          {expanded ? 'Less' : 'See all'}
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      <div className="divide-y divide-navy-700">
        {entries.map((entry) => {
          const player = entry.player
          const isLeader = entry.rank === 1
          return (
            <div key={player.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={clsx(
                  'w-5 shrink-0 text-center font-mono text-xs',
                  isLeader ? 'text-blue-500' : 'text-ink-500',
                )}
              >
                {entry.rank}
              </span>
              <div className="min-w-0 flex-1">
                <LeaderPlayerTag player={player} team={getTeam(universe, player.teamId)} />
              </div>
              <ValuePill value={def.format(entry.value)} leader={isLeader} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ValuePill({ value, leader }: { value: string; leader: boolean }) {
  if (!leader) {
    return (
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink-100">
        {value}
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full bg-blue-500 px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-white">
      {value}
    </span>
  )
}
