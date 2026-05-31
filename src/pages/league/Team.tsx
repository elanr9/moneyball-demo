// Team page and opponent scouting view at /team/:teamId. Shows the club identity
// and league position, its best XI in the default formation (read only), the full
// squad grouped by position, and the season schedule with results. A coach uses
// this to scout any opponent's likely shape and key players.

import { useMemo } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useUniverse } from '../../context/UniverseContext'
import {
  getTeam,
  matchesForTeam,
  rankOf,
  standingFor,
  teamAggregate,
  teamPlayers,
} from '../../data/selectors'
import type { Player, PositionGroup } from '../../data/types'
import {
  FORMATIONS,
  normalizeFormation,
} from '../../components/squad/formations'
import { autoLineup } from '../../components/squad/lineup'
import { Pitch } from '../../components/squad/Pitch'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { TeamCrest } from '../../components/league/TeamCrest'
import { FormPills } from '../../components/league/FormPills'
import { MatchRow } from '../../components/league/MatchRow'
import { dateLabel, outcomeFor } from '../../components/league/league'
import type { MatchStage } from '../../data/types'

const STAGE_SHORT: Record<MatchStage, string> = {
  regular: '',
  quarterfinal: 'QF',
  semifinal: 'SF',
  final: 'Final',
}

const GROUP_ORDER: PositionGroup[] = ['GK', 'DEF', 'MID', 'FWD']
const GROUP_LABEL: Record<PositionGroup, string> = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
}

export function Team() {
  const { teamId = '' } = useParams()
  const { universe } = useUniverse()
  const navigate = useNavigate()

  const team = getTeam(universe, teamId)
  const squad = useMemo(() => teamPlayers(universe, teamId), [universe, teamId])
  const schedule = useMemo(() => matchesForTeam(universe, teamId), [universe, teamId])

  const formationName = normalizeFormation(team?.defaultFormation)
  const formation = FORMATIONS[formationName]

  const playersById = useMemo(() => {
    const map = new Map<string, Player>()
    for (const p of squad) map.set(p.id, p)
    return map
  }, [squad])

  const lineup = useMemo(() => autoLineup(squad, formation), [squad, formation])

  if (!team) {
    return <Navigate to="/league" replace />
  }

  const row = standingFor(universe, teamId)
  const rank = rankOf(universe, teamId)
  const agg = teamAggregate(universe, teamId)
  const record = row ? `${row.wins} W · ${row.draws} D · ${row.losses} L` : 'No record'

  function openPlayer(player: Player) {
    navigate(`/player/${player.teamId}/${player.slug}`)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-8">
      <header
        data-tour="team-header"
        className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card"
        style={{ borderLeft: `4px solid ${team.primaryColor}` }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <TeamCrest team={team} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="section-label text-blue-500">{team.conference}</div>
            <h1 className="text-4xl font-bold tracking-tight text-ink-100">{team.name}</h1>
            <div className="mt-1 text-sm text-ink-300">
              {team.school} · {team.city}, {team.state}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <HeaderTile label="Position" value={rank ? `${ordinal(rank)}` : 'NR'} />
            <HeaderTile label="Points" value={String(row?.points ?? 0)} />
            <HeaderTile label="Squad Rating" value={String(agg.avgOverall)} />
            <div className="rounded-md border border-navy-600 bg-navy-700 p-4">
              <div className="text-xs uppercase tracking-widest text-ink-300">Form</div>
              <div className="mt-2.5">
                <FormPills form={row?.form ?? []} size="md" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm font-medium text-ink-100">{record}</div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-navy-600 bg-navy-800 p-4 shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="section-label text-blue-500">Likely XI</div>
              <span className="rounded bg-navy-700 px-2 py-1 font-mono text-xs text-ink-100">
                {formationName}
              </span>
            </div>
            <Pitch
              formation={formation}
              lineup={lineup}
              playersById={playersById}
              team={team}
              onOpenPlayer={openPlayer}
              readOnly
            />
          </div>

          {GROUP_ORDER.map((group) => {
            const players = squad
              .filter((p) => p.positionGroup === group)
              .sort((a, b) => b.overall - a.overall)
            if (!players.length) return null
            return (
              <section
                key={group}
                className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card"
              >
                <div className="border-b border-navy-600 px-5 py-3 text-sm font-bold text-ink-100">
                  {GROUP_LABEL[group]}
                  <span className="ml-2 font-mono text-xs text-ink-300">
                    {players.length}
                  </span>
                </div>
                <div className="divide-y divide-navy-700">
                  {players.map((player) => (
                    <SquadRow
                      key={player.id}
                      player={player}
                      onOpen={() => openPlayer(player)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink-100">Schedule and Results</h2>
          <div className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
            <div className="divide-y divide-navy-700">
              {schedule.map((match) => {
                const outcome = outcomeFor(match, teamId)
                const isPostseason = match.stage !== 'regular'
                return (
                  <div key={match.id} className="flex items-center gap-2 pr-3">
                    <span
                      className={`w-16 shrink-0 pl-3 font-mono text-[11px] ${
                        isPostseason ? 'font-bold text-amber-600' : 'text-ink-300'
                      }`}
                    >
                      {isPostseason ? STAGE_SHORT[match.stage] : dateLabel(match.date)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <MatchRow
                        universe={universe}
                        match={match}
                        highlightTeamId={teamId}
                      />
                    </div>
                    <OutcomeBadge outcome={outcome} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function HeaderTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-navy-600 bg-navy-700 p-4 text-center">
      <div className="text-xs uppercase tracking-widest text-ink-300">{label}</div>
      <div className="mt-2 font-mono text-2xl font-bold leading-none text-ink-100">
        {value}
      </div>
    </div>
  )
}

function SquadRow({ player, onOpen }: { player: Player; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-navy-700"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded font-mono text-sm font-bold text-white"
        style={{ backgroundColor: overallColor(player.overall) }}
      >
        {player.overall}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink-100">{player.name}</div>
        <div className="font-mono text-[11px] text-ink-300">
          #{player.number} · {player.primaryPosition} · {player.classYear}
        </div>
      </div>
      <RatingBadge rating={player.season.fvRating} size="sm" />
    </button>
  )
}

function OutcomeBadge({ outcome }: { outcome: 'W' | 'D' | 'L' }) {
  const tone =
    outcome === 'W'
      ? 'bg-fv-green text-ink-900'
      : outcome === 'L'
      ? 'bg-fv-red text-ink-900'
      : 'bg-navy-600 text-ink-100'
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold ${tone}`}
    >
      {outcome}
    </span>
  )
}

function overallColor(overall: number): string {
  if (overall >= 80) return '#C49A28'
  if (overall >= 70) return '#9CA6B4'
  return '#8F5C34'
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
