// Fixtures and results tab. Regular season matches grouped by round with the
// match date, followed by the postseason bracket. The whole season is played so
// every match shows a final score.

import { useMemo } from 'react'
import type { Universe } from '../../data/types'
import { MatchRow } from './MatchRow'
import { Bracket } from './Bracket'
import { dateLabel, postseasonMatches, regularRounds } from './league'

interface FixturesPanelProps {
  universe: Universe
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-team">
        <span className="h-3 w-1 rounded-full bg-team" />
        {eyebrow}
      </div>
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-ink-100">{title}</h2>
    </div>
  )
}

export function FixturesPanel({ universe }: FixturesPanelProps) {
  const rounds = useMemo(() => regularRounds(universe.matches), [universe.matches])
  const postseason = useMemo(
    () => postseasonMatches(universe.matches),
    [universe.matches],
  )

  return (
    <div className="space-y-10">
      {postseason.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle eyebrow="Knockouts" title="Postseason Bracket" />
          <Bracket universe={universe} matches={postseason} />
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionTitle eyebrow="Schedule" title="Regular Season" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rounds.map((group) => (
            <div
              key={group.round}
              className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card"
            >
              <div className="flex items-center justify-between border-b border-navy-600 px-4 py-3">
                <span className="text-sm font-bold text-ink-100">
                  Round {group.round}
                </span>
                <span className="font-mono text-xs text-ink-500">
                  {dateLabel(group.date)}
                </span>
              </div>
              <div className="divide-y divide-navy-700">
                {group.matches.map((match) => (
                  <MatchRow key={match.id} universe={universe} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
