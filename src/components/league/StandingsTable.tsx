// Full league table in the FotMob style. Columns: rank, team, played, W, D, L,
// goals for, goals against, goal difference, points, and a recent form row. The
// managed team is highlighted and the top 8 postseason cutoff is marked.

import clsx from 'clsx'
import type { Universe } from '../../data/types'
import { getTeam } from '../../data/selectors'
import { FormPills } from './FormPills'
import { TeamLink } from './TeamLink'
import { POSTSEASON_CUTOFF } from './league'

interface StandingsTableProps {
  universe: Universe
  myTeamId: string
}

const NUM_COL = 'px-2 py-3 text-center font-mono tabular-nums'

export function StandingsTable({ universe, myTeamId }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-navy-600 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            <th className="w-10 py-3 text-center">#</th>
            <th className="py-3 text-left">Team</th>
            <th className="w-10 py-3 text-center">PL</th>
            <th className="w-10 py-3 text-center">W</th>
            <th className="w-10 py-3 text-center">D</th>
            <th className="w-10 py-3 text-center">L</th>
            <th className="w-12 py-3 text-center">GF</th>
            <th className="w-12 py-3 text-center">GA</th>
            <th className="w-12 py-3 text-center">GD</th>
            <th className="w-12 py-3 text-center font-bold text-ink-100">PTS</th>
            <th className="hidden py-3 pr-4 text-right md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody>
          {universe.standings.map((row, index) => {
            const team = getTeam(universe, row.teamId)
            if (!team) return null
            const rank = index + 1
            const inPostseason = rank <= POSTSEASON_CUTOFF
            const isMine = row.teamId === myTeamId
            const isLastQualifier = rank === POSTSEASON_CUTOFF
            return (
              <tr
                key={row.teamId}
                className={clsx(
                  'border-b border-navy-700 transition-colors hover:bg-navy-700/60',
                  isMine && 'bg-team-soft',
                  isLastQualifier && 'border-b-2 border-b-fv-green/50',
                )}
              >
                <td className="relative py-3 text-center">
                  <span
                    className={clsx(
                      'absolute inset-y-0 left-0 w-1',
                      isMine
                        ? 'bg-team'
                        : inPostseason
                          ? 'bg-fv-green'
                          : 'bg-transparent',
                    )}
                  />
                  <span
                    className={clsx(
                      'font-mono text-sm font-bold nums',
                      isMine ? 'text-team' : 'text-ink-100',
                    )}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <TeamLink team={team} crestSize="md" />
                </td>
                <td className={clsx(NUM_COL, 'text-ink-300')}>{row.played}</td>
                <td className={clsx(NUM_COL, 'text-ink-100')}>{row.wins}</td>
                <td className={clsx(NUM_COL, 'text-ink-100')}>{row.draws}</td>
                <td className={clsx(NUM_COL, 'text-ink-100')}>{row.losses}</td>
                <td className={clsx(NUM_COL, 'text-ink-100')}>{row.goalsFor}</td>
                <td className={clsx(NUM_COL, 'text-ink-100')}>{row.goalsAgainst}</td>
                <td className={clsx(NUM_COL, 'text-ink-100')}>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className={clsx(NUM_COL, 'text-base font-bold text-ink-100')}>
                  {row.points}
                </td>
                <td className="hidden py-2.5 pr-4 md:table-cell">
                  <div className="flex justify-end">
                    <FormPills form={row.form} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center gap-4 border-t border-navy-700 px-4 py-3 text-[11px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-1 rounded bg-fv-green" />
          Postseason (top {POSTSEASON_CUTOFF})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-1 rounded bg-team" />
          Your club
        </span>
      </div>
    </div>
  )
}
