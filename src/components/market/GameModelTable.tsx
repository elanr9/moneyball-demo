// The game model results table. When a scout picks a role to evaluate by, the
// market switches from FUT style cards to this dense, sortable table that ranks
// every matching player by your custom model and shows the FieldVision skill and
// physical indexes alongside the role fit and how much film backs it up.

import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { Player, Universe } from '../../data/types'
import type { Percentiles, RoleDef } from '../../data/gameModel'
import {
  roleScore,
  rolePrecision,
  precisionLabel,
  skillIndex,
  physicalIndex,
} from '../../data/gameModel'
import { getTeam } from '../../data/selectors'
import { ScoreBar } from '../ui/ScoreBar'
import { PlayerAvatar } from '../ui/PlayerAvatar'
import { TeamCrest } from '../league/TeamCrest'

interface GameModelTableProps {
  universe: Universe
  players: Player[]
  role: RoleDef
  percentiles: Percentiles
  minPrecision: number
  onOpen: (player: Player) => void
}

function formTrend(player: Player): 'up' | 'down' | 'flat' {
  const matches = player.matches
  if (matches.length < 4) return 'flat'
  const recent = matches.slice(-3)
  const prior = matches.slice(-6, -3)
  if (!prior.length) return 'flat'
  const avg = (arr: typeof matches) => arr.reduce((s, m) => s + m.rating, 0) / arr.length
  const diff = avg(recent) - avg(prior)
  if (diff > 0.25) return 'up'
  if (diff < -0.25) return 'down'
  return 'flat'
}

function FormArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <ArrowUp size={15} className="text-fv-green" />
  if (trend === 'down') return <ArrowDown size={15} className="text-fv-red" />
  return <ArrowRight size={15} className="text-ink-300" />
}

export function GameModelTable({
  universe,
  players,
  role,
  percentiles,
  minPrecision,
  onOpen,
}: GameModelTableProps) {
  const ranked = players
    .filter((p) => role.groups.includes(p.positionGroup))
    .map((p) => ({
      player: p,
      score: roleScore(p, role, percentiles),
      precision: rolePrecision(p),
    }))
    .filter((r) => r.precision >= minPrecision)
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
      <div className="scrollbar-thin overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-navy-700">
            <tr className="text-[11px] uppercase tracking-widest text-ink-300">
              <th className="px-3 py-2.5 text-left font-semibold">#</th>
              <th className="px-3 py-2.5 text-left font-semibold">Player</th>
              <th className="px-3 py-2.5 text-center font-semibold">Age</th>
              <th className="px-3 py-2.5 text-center font-semibold">Pos</th>
              <th className="px-3 py-2.5 text-center font-semibold">Foot</th>
              <th className="px-3 py-2.5 text-center font-semibold">Form</th>
              <th className="px-3 py-2.5 text-right font-semibold">Min</th>
              <th className="px-3 py-2.5 text-left font-semibold">Skill</th>
              <th className="px-3 py-2.5 text-left font-semibold">Physical</th>
              <th className="px-3 py-2.5 text-left font-semibold text-fv-green">{role.name}</th>
              <th className="px-3 py-2.5 text-center font-semibold">Precision</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((entry, index) => {
              const p = entry.player
              const team = getTeam(universe, p.teamId)
              return (
                <tr
                  key={p.id}
                  onClick={() => onOpen(p)}
                  className="cursor-pointer border-t border-navy-700 transition-colors hover:bg-navy-700"
                >
                  <td className="px-3 py-2.5 font-mono text-xs font-bold text-ink-300">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar name={p.name} size="md" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink-100">{p.name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-300">
                          {team ? <TeamCrest team={team} size="xs" /> : null}
                          <span className="truncate">{team?.shortName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-ink-100">{p.age}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-ink-100">
                    {p.primaryPosition}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-ink-100">{p.foot}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center">
                      <FormArrow trend={formTrend(p)} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink-300">
                    {p.season.minutes}
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={skillIndex(p)} width="sm" />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={physicalIndex(p)} width="sm" />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={entry.score} width="sm" accent />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-[11px] font-semibold text-ink-300">
                      {precisionLabel(entry.precision)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!ranked.length ? (
        <div className="px-5 py-10 text-center text-sm text-ink-300">
          No players match this role and precision. Loosen a filter or lower min precision.
        </div>
      ) : null}
    </div>
  )
}
