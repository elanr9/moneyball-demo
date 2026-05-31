// Player stats tab. Renders FotMob style leaderboards for every stat in the
// catalog, grouped by category, with a dedicated goalkeeping section scoped to
// keepers.

import { useMemo } from 'react'
import type { Universe } from '../../data/types'
import type { StatGroup } from '../../data/selectors'
import { STAT_CATALOG } from '../../data/selectors'
import { StatLeaderCard } from './StatLeaderCard'

interface PlayerStatsPanelProps {
  universe: Universe
}

// Display order for the stat groups.
const GROUP_ORDER: StatGroup[] = [
  'Attacking',
  'Passing',
  'Defending',
  'Physical',
  'Advanced',
  'Goalkeeping',
]

const GROUP_BLURB: Record<StatGroup, string> = {
  Attacking: 'Scoring and finishing',
  Passing: 'Creation and distribution',
  Defending: 'Tackles duels and recoveries',
  Physical: 'Speed and distance',
  Advanced: 'Movement and pressing',
  Goalkeeping: 'Shot stopping and clean sheets',
}

export function PlayerStatsPanel({ universe }: PlayerStatsPanelProps) {
  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      stats: STAT_CATALOG.filter((s) => s.group === group),
    })).filter((g) => g.stats.length > 0)
  }, [])

  return (
    <div className="space-y-8">
      {grouped.map(({ group, stats }) => {
        return (
          <section key={group} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-bold text-ink-100">
                {group}
              </h2>
              <span className="text-xs text-ink-300">{GROUP_BLURB[group]}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {stats.map((def) => (
                <StatLeaderCard key={def.key} universe={universe} def={def} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
