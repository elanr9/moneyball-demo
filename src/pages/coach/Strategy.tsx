// Strategy Board at /strategy. The multi season planning surface: see your
// squad on the pitch with full depth at every position, projected forward year
// by year as players develop and graduate. A timeline scrubs through the
// eligibility horizon, gaps light up where a class graduates out, and Plan A B C
// let a coach keep three competing blueprints. This is the club strategy pillar,
// reframed from pro contracts to college eligibility.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, GraduationCap, Target, TrendingUp, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import { useUniverse } from '../../context/UniverseContext'
import { getTeam, teamPlayers } from '../../data/selectors'
import type { Player, Team } from '../../data/types'
import {
  FORMATIONS,
  FORMATION_GROUPS,
  normalizeFormation,
} from '../../components/squad/formations'
import type { FormationName } from '../../components/squad/formations'
import {
  buildDepthChart,
  graduationTimeline,
} from '../../components/strategy/planning'
import type { SlotPlan } from '../../components/strategy/planning'
import {
  SEASON_START_YEAR,
  developmentOf,
  eligibilityOf,
  projectedOverall,
} from '../../data/eligibility'
import { TeamCrest } from '../../components/league/TeamCrest'

const HORIZON_YEARS = [0, 1, 2, 3, 4].map((n) => SEASON_START_YEAR + n)

interface Plan {
  id: string
  label: string
  formation: FormationName
}

const STAGE_DOT: Record<string, string> = {
  Breakout: 'bg-fv-green',
  Rising: 'bg-blue-400',
  Prime: 'bg-ink-300',
  Veteran: 'bg-fv-yellow',
}

export function Strategy() {
  const { universe, myTeamId, setMyTeamId } = useUniverse()
  const navigate = useNavigate()

  const team = getTeam(universe, myTeamId)
  const squad = useMemo(() => teamPlayers(universe, myTeamId), [universe, myTeamId])

  const defaultFormation = normalizeFormation(team?.defaultFormation)
  const [plans, setPlans] = useState<Plan[]>([
    { id: 'a', label: 'Plan A', formation: defaultFormation },
    { id: 'b', label: 'Plan B', formation: '4-2-3-1' },
    { id: 'c', label: 'Plan C', formation: '3-5-2' },
  ])
  const [activePlanId, setActivePlanId] = useState('a')
  const [seasonYear, setSeasonYear] = useState(SEASON_START_YEAR)

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0]
  const formation = FORMATIONS[activePlan.formation]

  const depth = useMemo(
    () => buildDepthChart(squad, formation, seasonYear),
    [squad, formation, seasonYear],
  )
  const timeline = useMemo(() => graduationTimeline(squad, HORIZON_YEARS), [squad])

  function setFormation(name: FormationName) {
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, formation: name } : p)),
    )
  }

  const sortedTeams = useMemo(
    () => [...universe.teams].sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [universe.teams],
  )

  const gaps = depth.slots.filter((s) => s.gap)
  const yearsAhead = seasonYear - SEASON_START_YEAR

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {team ? <TeamCrest team={team} size="lg" /> : null}
          <div>
            <div className="section-label text-blue-500">Club Strategy</div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-100">Strategy Board</h1>
            <div className="mt-0.5 text-sm text-ink-300">
              Plan the squad across four seasons of eligibility
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center rounded-full border border-navy-600 bg-navy-800 p-1 shadow-card"
            data-tour="strategy-plans"
          >
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setActivePlanId(plan.id)}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors',
                  plan.id === activePlanId
                    ? 'bg-blue-500 text-white'
                    : 'text-ink-300 hover:text-ink-100',
                )}
              >
                {plan.label}
              </button>
            ))}
          </div>
          <select
            value={activePlan.formation}
            onChange={(e) => setFormation(e.target.value as FormationName)}
            className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-sm font-semibold text-ink-100 shadow-card focus:border-blue-500 focus:outline-none"
          >
            {FORMATION_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={myTeamId}
            onChange={(e) => setMyTeamId(e.target.value)}
            className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 shadow-card focus:border-blue-500 focus:outline-none"
          >
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <SeasonTimeline
        years={HORIZON_YEARS}
        selected={seasonYear}
        markers={timeline}
        onSelect={setSeasonYear}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <section
          data-tour="strategy-depth"
          className="relative overflow-hidden rounded-3xl border border-navy-600 shadow-float"
        >
          <PitchMarkings />
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-6xl font-extrabold text-white/10">
            {activePlan.formation}
          </div>
          <div className="absolute right-4 top-4 rounded-lg bg-black/40 px-3 py-1.5 text-right backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/70">Planning season</div>
            <div className="font-mono text-lg font-bold text-white">
              {seasonYear}-{String((seasonYear + 1) % 100).padStart(2, '0')}
            </div>
          </div>

          <div className="relative aspect-[16/11] w-full">
            {depth.slots.map((slotPlan) => (
              <div
                key={slotPlan.slot.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${slotPlan.slot.x}%`, top: `${slotPlan.slot.y}%` }}
              >
                <SlotColumn
                  slotPlan={slotPlan}
                  team={team}
                  seasonYear={seasonYear}
                  onOpen={(p) => navigate(`/player/${p.teamId}/${p.slug}`)}
                />
              </div>
            ))}
          </div>
        </section>

        <HorizonPanel
          team={team}
          seasonYear={seasonYear}
          yearsAhead={yearsAhead}
          starters={depth.starters}
          gaps={gaps}
          graduated={depth.graduated}
          squad={squad}
          onTargets={() => navigate('/market')}
        />
      </div>
    </div>
  )
}

function SeasonTimeline({
  years,
  selected,
  markers,
  onSelect,
}: {
  years: number[]
  selected: number
  markers: ReturnType<typeof graduationTimeline>
  onSelect: (year: number) => void
}) {
  return (
    <section
      data-tour="strategy-timeline"
      className="rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <CalendarRange size={15} className="text-blue-500" />
        <h2 className="section-label text-blue-500">Eligibility Horizon</h2>
        <span className="ml-auto text-xs text-ink-300">
          Scrub a season to project the squad forward
        </span>
      </div>
      <div className="relative flex items-end justify-between">
        <div className="absolute left-0 right-0 top-[14px] h-0.5 bg-navy-600" />
        {years.map((year) => {
          const marker = markers.find((m) => m.year === year)
          const grads = marker ? marker.graduating.length : 0
          const isSelected = year === selected
          return (
            <button
              key={year}
              type="button"
              onClick={() => onSelect(year)}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <span
                className={clsx(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-navy-500 bg-navy-800 text-ink-300 hover:border-blue-400',
                )}
              >
                {grads > 0 ? (
                  <span className="font-mono text-[11px] font-bold">{grads}</span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={clsx(
                  'font-mono text-sm font-bold',
                  isSelected ? 'text-ink-100' : 'text-ink-300',
                )}
              >
                {year}
              </span>
              <span className="text-[10px] text-ink-500">
                {grads > 0 ? `${grads} graduating` : 'full squad'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SlotColumn({
  slotPlan,
  team,
  seasonYear,
  onOpen,
}: {
  slotPlan: SlotPlan
  team: Team | undefined
  seasonYear: number
  onOpen: (player: Player) => void
}) {
  const accent = team?.primaryColor ?? '#2563EB'
  const { slot, starter, depth, gap } = slotPlan

  if (gap || !starter) {
    return (
      <div className="flex w-[124px] flex-col items-center">
        <div className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-fv-red/60 bg-fv-red/10 px-2 py-3 text-center">
          <UserPlus size={16} className="text-fv-red" />
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-fv-red">
            Recruit
          </div>
          <div className="text-[9px] text-white/70">{slot.pos} target</div>
        </div>
        <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          {slot.pos}
        </span>
      </div>
    )
  }

  return (
    <div className="flex w-[124px] flex-col items-center">
      <div
        className="w-full overflow-hidden rounded-xl border border-white/15 bg-gradient-to-b from-slate-800 to-slate-950 shadow-card"
        style={{ borderTop: `2px solid ${accent}` }}
      >
        <StarterRow player={starter} seasonYear={seasonYear} onOpen={onOpen} />
        {depth.map((player) => (
          <DepthRow key={player.id} player={player} seasonYear={seasonYear} onOpen={onOpen} />
        ))}
      </div>
      <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        {slot.pos}
      </span>
    </div>
  )
}

function YearBadge({ player, seasonYear }: { player: Player; seasonYear: number }) {
  const through = eligibilityOf(player).throughYear
  const yearsLeft = through - seasonYear
  const tone =
    yearsLeft <= 1 ? 'text-fv-yellow' : yearsLeft <= 2 ? 'text-blue-300' : 'text-white/70'
  return <span className={clsx('font-mono text-[10px] font-bold', tone)}>{through}</span>
}

function StarterRow({
  player,
  seasonYear,
  onOpen,
}: {
  player: Player
  seasonYear: number
  onOpen: (player: Player) => void
}) {
  const stage = developmentOf(player).stage
  const projected = projectedOverall(player, seasonYear)
  return (
    <button
      type="button"
      onClick={() => onOpen(player)}
      className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left transition-colors hover:bg-white/10"
    >
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', STAGE_DOT[stage])} title={stage} />
      <span className="font-mono text-sm font-bold tabular-nums text-amber-300">{projected}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">
        {player.lastName}
      </span>
      <YearBadge player={player} seasonYear={seasonYear} />
    </button>
  )
}

function DepthRow({
  player,
  seasonYear,
  onOpen,
}: {
  player: Player
  seasonYear: number
  onOpen: (player: Player) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(player)}
      className="flex w-full items-center gap-1.5 border-t border-white/10 px-2 py-1 text-left transition-colors hover:bg-white/10"
    >
      <span className="w-4 shrink-0 text-center font-mono text-[10px] text-white/50">
        {projectedOverall(player, seasonYear)}
      </span>
      <span className="min-w-0 flex-1 truncate text-[10px] text-white/80">{player.lastName}</span>
      <YearBadge player={player} seasonYear={seasonYear} />
    </button>
  )
}

function HorizonPanel({
  team,
  seasonYear,
  yearsAhead,
  starters,
  gaps,
  graduated,
  squad,
  onTargets,
}: {
  team: Team | undefined
  seasonYear: number
  yearsAhead: number
  starters: Player[]
  gaps: SlotPlan[]
  graduated: Player[]
  squad: Player[]
  onTargets: () => void
}) {
  const departingNext = useMemo(
    () => squad.filter((p) => eligibilityOf(p).throughYear === seasonYear + 1),
    [squad, seasonYear],
  )
  const risingProspects = useMemo(
    () =>
      squad
        .filter((p) => {
          const stage = developmentOf(p).stage
          return (stage === 'Breakout' || stage === 'Rising') && p.season.minutes > 0
        })
        .sort((a, b) => developmentOf(b).upside - developmentOf(a).upside)
        .slice(0, 4),
    [squad],
  )
  const avgStarter = starters.length
    ? Math.round(
        starters.reduce((s, p) => s + projectedOverall(p, seasonYear), 0) / starters.length,
      )
    : 0

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card">
        <h2 className="section-label mb-3 text-blue-500">Roster Horizon {seasonYear}</h2>
        <div className="grid grid-cols-3 gap-2">
          <HorizonStat label="Starting XI" value={`${starters.length}/11`} />
          <HorizonStat label="Open spots" value={String(gaps.length)} tone={gaps.length ? 'bad' : 'good'} />
          <HorizonStat label="Proj XI" value={String(avgStarter)} />
        </div>
        {yearsAhead === 0 ? (
          <div className="mt-3 text-xs text-ink-300">
            Today the full roster is eligible. Scrub forward to see who graduates out.
          </div>
        ) : (
          <div className="mt-3 text-xs text-ink-300">
            {graduated.length} player{graduated.length === 1 ? '' : 's'} from the current roster
            graduate before this season.
          </div>
        )}
      </section>

      {gaps.length > 0 ? (
        <section className="rounded-2xl border border-fv-red/40 bg-fv-red/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target size={15} className="text-fv-red" />
            <h2 className="section-label text-fv-red">Recruiting Priorities</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {gaps.map((g) => (
              <span
                key={g.slot.id}
                className="rounded-lg bg-fv-red/10 px-2.5 py-1 text-xs font-bold text-fv-red"
              >
                {g.slot.pos}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onTargets}
            className="mt-4 w-full rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-400"
          >
            Find targets in the database
          </button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap size={15} className="text-ink-300" />
          <h2 className="section-label text-ink-300">Departing After This Season</h2>
        </div>
        {departingNext.length ? (
          <div className="space-y-1.5">
            {departingNext.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-ink-100">{p.name}</span>
                <span className="font-mono text-xs text-ink-300">{p.primaryPosition}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-ink-300">No scheduled departures in this window.</div>
        )}
      </section>

      <section className="rounded-2xl border border-fv-green/40 bg-fv-greenLight p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-fv-green" />
          <h2 className="section-label text-fv-green">Rising Core</h2>
        </div>
        {risingProspects.length ? (
          <div className="space-y-2">
            {risingProspects.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-100">{p.name}</div>
                  <div className="font-mono text-[11px] text-ink-300">
                    {p.classYear} · {p.primaryPosition} · ceiling {p.potential}
                  </div>
                </div>
                <span className="shrink-0 rounded bg-fv-green/15 px-2 py-0.5 font-mono text-xs font-bold text-fv-green">
                  +{developmentOf(p).ceilingGap}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-fv-green">No high ceiling prospects logging minutes yet.</div>
        )}
        {team ? (
          <div className="mt-3 text-[11px] text-fv-green">
            Projected growth for {team.shortName} based on age and FieldVision ceiling.
          </div>
        ) : null}
      </section>
    </aside>
  )
}

function HorizonStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'good' | 'bad'
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border p-3 text-center',
        tone === 'bad' ? 'border-fv-red/40 bg-fv-red/5' : 'border-navy-600 bg-navy-700',
      )}
    >
      <div
        className={clsx(
          'font-mono text-xl font-bold leading-none',
          tone === 'bad' ? 'text-fv-red' : tone === 'good' ? 'text-fv-green' : 'text-ink-100',
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-widest text-ink-300">{label}</div>
    </div>
  )
}

function PitchMarkings() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'repeating-linear-gradient(180deg, #1b7d3e 0px, #1b7d3e 7%, #18723a 7%, #18723a 14%)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
      <div className="absolute inset-4 rounded-xl border-2 border-white/25" />
      <div className="absolute left-4 right-4 top-1/2 h-0 border-t-2 border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-[18%] w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
      <div className="absolute left-1/2 top-4 h-[18%] w-[44%] -translate-x-1/2 border-2 border-t-0 border-white/25" />
      <div className="absolute bottom-4 left-1/2 h-[18%] w-[44%] -translate-x-1/2 border-2 border-b-0 border-white/25" />
    </div>
  )
}
