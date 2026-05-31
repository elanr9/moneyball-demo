// A small postseason bracket: quarterfinals, semifinals, and the final laid out
// in columns. Each tie shows both teams, the score, and marks the winner. The
// champion is called out at the end.

import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import type { Match, Team, Universe } from '../../data/types'
import { getTeam } from '../../data/selectors'
import { TeamCrest } from './TeamCrest'

interface BracketProps {
  universe: Universe
  matches: Match[]
}

export function Bracket({ universe, matches }: BracketProps) {
  const quarterfinals = matches.filter((m) => m.stage === 'quarterfinal')
  const semifinals = matches.filter((m) => m.stage === 'semifinal')
  const final = matches.find((m) => m.stage === 'final')

  if (!quarterfinals.length && !semifinals.length && !final) {
    return null
  }

  const champion = final
    ? getTeam(
        universe,
        final.homeGoals > final.awayGoals ? final.homeTeamId : final.awayTeamId,
      )
    : undefined

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
      <div className="relative overflow-x-auto scrollbar-thin">
        {/* Soft trophy aura at the right edge so the eye is pulled toward the
            final and the champion. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-fv-greenLight to-transparent" />
        <div className="relative grid min-w-[760px] grid-cols-3 gap-x-6 p-5">
          <BracketColumn title="Quarterfinals" count={quarterfinals.length}>
            {quarterfinals.map((m) => (
              <TieCard key={m.id} universe={universe} match={m} connectorRight />
            ))}
          </BracketColumn>
          <BracketColumn title="Semifinals" count={semifinals.length}>
            {semifinals.map((m) => (
              <TieCard key={m.id} universe={universe} match={m} connectorRight />
            ))}
          </BracketColumn>
          <BracketColumn title="Final" count={final ? 1 : 0}>
            {final ? <TieCard universe={universe} match={final} highlight /> : null}
          </BracketColumn>
        </div>
      </div>

      {champion ? (
        <div className="relative flex items-center gap-4 border-t border-navy-600 bg-fv-greenLight px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900/40 ring-1 ring-fv-green/30">
            <Trophy size={22} className="text-fv-yellow" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-fv-green">
              National Showcase Champion
            </div>
            <Link
              to={`/team/${champion.id}`}
              className="text-xl font-bold text-ink-100 transition-colors hover:text-team"
            >
              {champion.name}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BracketColumn({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <span className="section-label">{title}</span>
        <span className="font-mono text-[10px] text-ink-500">{count}</span>
      </div>
      <div className="flex flex-1 flex-col justify-around gap-4">{children}</div>
    </div>
  )
}

function TieCard({
  universe,
  match,
  connectorRight,
  highlight,
}: {
  universe: Universe
  match: Match
  connectorRight?: boolean
  highlight?: boolean
}) {
  const home = getTeam(universe, match.homeTeamId)
  const away = getTeam(universe, match.awayTeamId)
  if (!home || !away) return null
  const homeWon = match.homeGoals > match.awayGoals

  return (
    <div className="relative">
      {connectorRight ? (
        <span className="pointer-events-none absolute left-full top-1/2 h-px w-6 -translate-y-1/2 bg-navy-500" />
      ) : null}
      <div
        className={clsx(
          'overflow-hidden rounded-xl border bg-navy-900 transition-colors',
          highlight
            ? 'border-fv-green/40 shadow-glow'
            : 'border-navy-600 hover:border-navy-500',
        )}
      >
        <TieSide team={home} goals={match.homeGoals} won={homeWon} />
        <div className="h-px bg-navy-600" />
        <TieSide team={away} goals={match.awayGoals} won={!homeWon} />
      </div>
    </div>
  )
}

function TieSide({
  team,
  goals,
  won,
}: {
  team: Team
  goals: number
  won: boolean
}) {
  return (
    <Link
      to={`/team/${team.id}`}
      className={clsx(
        'flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-navy-700',
        !won && 'opacity-60',
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {won ? <span className="h-3.5 w-0.5 rounded-full bg-fv-green" /> : <span className="w-0.5" />}
        <TeamCrest team={team} size="sm" />
        <span
          className={clsx(
            'truncate text-sm',
            won ? 'font-bold text-ink-100' : 'font-medium text-ink-300',
          )}
        >
          {team.shortName}
        </span>
      </span>
      <span
        className={clsx(
          'font-mono text-base font-bold nums',
          won ? 'text-ink-100' : 'text-ink-300',
        )}
      >
        {goals}
      </span>
    </Link>
  )
}
