// Team stats tab. Ranks every club by aggregate season metrics: goals for, goals
// against, goal difference, average squad overall, and average FieldVision
// rating. Each metric is its own ranked card with a see all toggle.

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Universe } from '../../data/types'
import { TeamLink } from './TeamLink'
import { teamStatRows } from './league'
import type { TeamStatRow } from './league'

interface TeamStatsPanelProps {
  universe: Universe
}

interface MetricDef {
  key: string
  label: string
  blurb: string
  lowerIsBetter?: boolean
  value: (row: TeamStatRow) => number
  format: (row: TeamStatRow) => string
}

const METRICS: MetricDef[] = [
  {
    key: 'goalsFor',
    label: 'Goals For',
    blurb: 'Most goals scored',
    value: (r) => r.goalsFor,
    format: (r) => String(r.goalsFor),
  },
  {
    key: 'goalsAgainst',
    label: 'Goals Against',
    blurb: 'Fewest goals conceded',
    lowerIsBetter: true,
    value: (r) => r.goalsAgainst,
    format: (r) => String(r.goalsAgainst),
  },
  {
    key: 'goalDifference',
    label: 'Goal Difference',
    blurb: 'Net goals',
    value: (r) => r.goalDifference,
    format: (r) => (r.goalDifference > 0 ? `+${r.goalDifference}` : String(r.goalDifference)),
  },
  {
    key: 'avgOverall',
    label: 'Squad Rating',
    blurb: 'Average overall of the best XI',
    value: (r) => r.avgOverall,
    format: (r) => String(r.avgOverall),
  },
  {
    key: 'avgFvRating',
    label: 'Average FV Rating',
    blurb: 'Season FieldVision rating',
    value: (r) => r.avgFvRating,
    format: (r) => r.avgFvRating.toFixed(1),
  },
]

export function TeamStatsPanel({ universe }: TeamStatsPanelProps) {
  const rows = useMemo(() => teamStatRows(universe), [universe])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {METRICS.map((metric) => (
        <TeamLeaderCard key={metric.key} rows={rows} metric={metric} />
      ))}
    </div>
  )
}

const TOP_LIMIT = 6

function TeamLeaderCard({ rows, metric }: { rows: TeamStatRow[]; metric: MetricDef }) {
  const [expanded, setExpanded] = useState(false)

  const ranked = useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      metric.lowerIsBetter ? metric.value(a) - metric.value(b) : metric.value(b) - metric.value(a),
    )
    return expanded ? sorted : sorted.slice(0, TOP_LIMIT)
  }, [rows, metric, expanded])

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between gap-2 border-b border-navy-600 px-4 py-3 text-left transition-colors hover:bg-navy-700"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink-100">{metric.label}</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
          {expanded ? 'Less' : 'See all'}
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      <div className="divide-y divide-navy-700">
        {ranked.map((row, index) => {
          const isLeader = index === 0
          return (
            <div key={row.team.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={clsx(
                  'w-5 shrink-0 text-center font-mono text-xs',
                  isLeader ? 'text-blue-500' : 'text-ink-500',
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <TeamLink team={row.team} crestSize="sm" useShortName />
              </div>
              {isLeader ? (
                <span className="shrink-0 rounded-full bg-blue-500 px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-white">
                  {metric.format(row)}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink-100">
                  {metric.format(row)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
