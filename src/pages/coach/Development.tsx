// Development hub at /development. This is the college reframe of a pro club's
// squad finance suite. There is no money in the college game, so instead of
// salaries, contracts and cash flow we plan the two resources that actually
// matter: eligibility (how long each player can still play) and development
// (how much room they have to grow). The tabs mirror the pro tool one for one:
// player contracts become an eligibility ledger, cash flow becomes roster flow,
// and the cost matrix becomes a development value matrix.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { FileText, Sparkles, Upload } from 'lucide-react'
import clsx from 'clsx'
import { useUniverse } from '../../context/UniverseContext'
import { getTeam, teamPlayers } from '../../data/selectors'
import type { Player, Team } from '../../data/types'
import {
  CLASS_ORDER,
  SEASON_START_YEAR,
  developmentOf,
  eligibilityOf,
} from '../../data/eligibility'
import { createRng, intRange } from '../../data/rng'
import { Tabs } from '../../components/ui/Tabs'
import type { TabItem } from '../../components/ui/Tabs'
import { TeamCrest } from '../../components/league/TeamCrest'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'flow', label: 'Roster Flow' },
  { id: 'matrix', label: 'Value Matrix' },
]

const HORIZON = [0, 1, 2, 3, 4].map((n) => SEASON_START_YEAR + n)
const STAGE_COLOR: Record<string, string> = {
  Breakout: '#15803D',
  Rising: '#2563EB',
  Prime: '#646B76',
  Veteran: '#EAB308',
}

export function Development() {
  const { universe, myTeamId, setMyTeamId } = useUniverse()
  const team = getTeam(universe, myTeamId)
  const squad = useMemo(() => teamPlayers(universe, myTeamId), [universe, myTeamId])
  const [tab, setTab] = useState('overview')

  const sortedTeams = useMemo(
    () => [...universe.teams].sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [universe.teams],
  )

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {team ? <TeamCrest team={team} size="lg" /> : null}
          <div>
            <div className="section-label text-blue-500">Squad Development</div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-100">Development Hub</h1>
            <div className="mt-0.5 text-sm text-ink-300">
              Plan eligibility and growth, the only currencies in the college game
            </div>
          </div>
        </div>
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
      </header>

      <div data-tour="dev-tabs">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' ? <OverviewTab squad={squad} team={team} /> : null}
      {tab === 'eligibility' ? <EligibilityTab squad={squad} /> : null}
      {tab === 'flow' ? <FlowTab squad={squad} teamId={myTeamId} /> : null}
      {tab === 'matrix' ? <MatrixTab squad={squad} /> : null}
    </div>
  )
}

function OverviewTab({ squad, team }: { squad: Player[]; team: Team | undefined }) {
  const avgAge = squad.length
    ? (squad.reduce((s, p) => s + p.age, 0) / squad.length).toFixed(1)
    : '0'
  const avgYears = squad.length
    ? (
        squad.reduce((s, p) => s + eligibilityOf(p).yearsRemaining, 0) / squad.length
      ).toFixed(1)
    : '0'
  const graduatingThisYear = squad.filter(
    (p) => eligibilityOf(p).throughYear === SEASON_START_YEAR + 1,
  ).length
  const avgUpside = squad.length
    ? Math.round(squad.reduce((s, p) => s + developmentOf(p).upside, 0) / squad.length)
    : 0

  const classCounts = CLASS_ORDER.map((cls) => ({
    cls,
    count: squad.filter((p) => p.classYear === cls).length,
  })).filter((c) => c.count > 0)
  const maxClass = Math.max(1, ...classCounts.map((c) => c.count))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5" data-tour="dev-metrics">
        <Metric label="Roster" value={String(squad.length)} sub="players" />
        <Metric label="Avg age" value={avgAge} sub="years" />
        <Metric label="Avg eligibility" value={avgYears} sub="years left" />
        <Metric label="Graduating" value={String(graduatingThisYear)} sub="this spring" />
        <Metric label="Squad upside" value={`${avgUpside}%`} sub="room to grow" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
          <h2 className="section-label mb-5 text-blue-500">Class Balance</h2>
          <div className="space-y-3">
            {classCounts.map((c) => (
              <div key={c.cls} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-ink-100">{c.cls}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(c.count / maxClass) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-sm font-bold text-ink-100">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-ink-300">
            A balanced spread across classes keeps the roster stable as seniors graduate out.
          </div>
        </section>

        <AiIntakeCard team={team} />
      </div>
    </div>
  )
}

// The reframe of AI contract upload. A coach drops a roster export and the
// platform extracts eligibility and class data automatically.
function AiIntakeCard({ team }: { team: Team | undefined }) {
  const [extracting, setExtracting] = useState(false)
  return (
    <section className="flex flex-col rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-fv-green" />
        <h2 className="section-label text-fv-green">AI Roster Intake</h2>
      </div>
      <button
        type="button"
        onClick={() => setExtracting(true)}
        className="group flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-500 px-6 py-8 text-center transition-colors hover:border-fv-green hover:bg-fv-greenLight"
      >
        <Upload size={26} strokeWidth={1.5} className="mb-2 text-fv-green" />
        <div className="text-base font-semibold text-ink-100">Drop a roster sheet</div>
        <div className="mt-1 text-sm text-ink-300">
          We read class year, eligibility and positions automatically.
        </div>
      </button>
      {extracting ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-fv-green/30 bg-fv-greenLight px-4 py-3">
          <FileText size={18} className="text-fv-green" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink-100">
              {team ? team.shortName : 'roster'}_eligibility.pdf
            </div>
            <div className="text-xs text-fv-green">Extracting eligibility details...</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-[11px] text-ink-300">
          Supports CSV PDF and conference exports. No manual entry.
        </div>
      )}
    </section>
  )
}

function EligibilityTab({ squad }: { squad: Player[] }) {
  const navigate = useNavigate()
  const rows = useMemo(
    () =>
      [...squad].sort(
        (a, b) => eligibilityOf(a).yearsRemaining - eligibilityOf(b).yearsRemaining,
      ),
    [squad],
  )

  const outflowByYear = useMemo(() => {
    return HORIZON.slice(1).map((year) => ({
      year,
      count: squad.filter((p) => eligibilityOf(p).throughYear === year).length,
    }))
  }, [squad])
  const maxOut = Math.max(1, ...outflowByYear.map((o) => o.count))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
        <div className="border-b border-navy-600 px-5 py-3">
          <h2 className="section-label text-blue-500">Eligibility Ledger</h2>
          <div className="mt-1 text-xs text-ink-300">
            Sorted by years remaining. Players at the top leave the program soonest.
          </div>
        </div>
        <div className="divide-y divide-navy-700">
          {rows.map((p) => {
            const e = eligibilityOf(p)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/player/${p.teamId}/${p.slug}`)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-navy-700"
              >
                <PlayerAvatar name={p.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-100">{p.name}</div>
                  <div className="font-mono text-[11px] text-ink-300">
                    {p.classYear} · {p.primaryPosition}
                  </div>
                </div>
                <div className="flex w-40 shrink-0 items-center gap-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span
                      key={i}
                      className={clsx(
                        'h-2 flex-1 rounded-full',
                        i < e.yearsRemaining ? 'bg-fv-green' : 'bg-navy-600',
                      )}
                    />
                  ))}
                </div>
                <div className="w-24 shrink-0 text-right">
                  <div className="font-mono text-sm font-bold text-ink-100">
                    {e.yearsRemaining} yr{e.yearsRemaining === 1 ? '' : 's'}
                  </div>
                  <div className="font-mono text-[11px] text-ink-300">through {e.throughYear}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card">
          <h2 className="section-label mb-4 text-blue-500">Eligibility Outflow</h2>
          <div className="space-y-3">
            {outflowByYear.map((o) => (
              <div key={o.year} className="flex items-center gap-3">
                <span className="w-12 shrink-0 font-mono text-sm text-ink-300">{o.year}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className={clsx('h-full rounded-full', o.count ? 'bg-fv-yellow' : 'bg-navy-600')}
                    style={{ width: `${(o.count / maxOut) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-sm font-bold text-ink-100">
                  {o.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-ink-300">
            How many scholarship spots open up each spring as a class graduates.
          </div>
        </section>
      </aside>
    </div>
  )
}

interface FlowRow {
  year: number
  out: number
  incoming: number
  size: number
}

function FlowTab({ squad, teamId }: { squad: Player[]; teamId: string }) {
  const data = useMemo<FlowRow[]>(() => {
    const rng = createRng(`${teamId}:recruiting`)
    let size = squad.length
    const rows: FlowRow[] = []
    for (const year of HORIZON.slice(1)) {
      const out = squad.filter((p) => eligibilityOf(p).throughYear === year).length
      // Incoming recruiting class roughly replaces departures so the roster
      // holds steady, with a little year to year variation.
      const incoming = Math.max(2, out + intRange(rng, -1, 2))
      size = size - out + incoming
      rows.push({ year, out: -out, incoming, size })
    }
    return rows
  }, [squad, teamId])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
        <h2 className="section-label mb-1 text-blue-500">Roster Flow</h2>
        <div className="mb-5 text-xs text-ink-300">
          Graduations out and projected recruiting classes in, with the resulting roster size.
        </div>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#E7E9EC" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: '#646B76', fontSize: 12 }} axisLine={{ stroke: '#D6D9DE' }} />
              <YAxis tick={{ fill: '#9AA0AA', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  if (name === 'out') return [Math.abs(value), 'Graduating out']
                  if (name === 'incoming') return [value, 'Recruits in']
                  return [value, 'Roster size']
                }}
              />
              <Legend
                formatter={(value) =>
                  value === 'out' ? 'Graduating out' : value === 'incoming' ? 'Recruits in' : 'Roster size'
                }
              />
              <Bar dataKey="incoming" fill="#15803D" radius={[4, 4, 0, 0]} />
              <Bar dataKey="out" fill="#DC2626" radius={[0, 0, 4, 4]} />
              <Line type="monotone" dataKey="size" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="rounded-r border-l-2 border-fv-green bg-fv-greenLight p-3 text-xs text-fv-green">
        Recruiting classes are projected to replace graduating eligibility so the program holds a
        competitive roster size every season.
      </div>
    </div>
  )
}

interface MatrixPoint {
  x: number // minutes
  y: number // ceiling gap
  z: number // age for bubble size
  name: string
  teamId: string
  slug: string
  stage: string
}

function MatrixTab({ squad }: { squad: Player[] }) {
  const navigate = useNavigate()
  const points = useMemo<MatrixPoint[]>(
    () =>
      squad
        .filter((p) => p.season.minutes > 0)
        .map((p) => ({
          x: p.season.minutes,
          y: developmentOf(p).ceilingGap,
          z: p.age,
          name: p.name,
          teamId: p.teamId,
          slug: p.slug,
          stage: developmentOf(p).stage,
        })),
    [squad],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
        <h2 className="section-label mb-1 text-blue-500">Development Value Matrix</h2>
        <div className="mb-5 text-xs text-ink-300">
          Minutes played against ceiling room. High ceiling players in the bottom right are getting
          minutes. High ceiling players on the left are untapped value waiting for a run.
        </div>
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid stroke="#E7E9EC" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Minutes"
                tick={{ fill: '#646B76', fontSize: 11 }}
                axisLine={{ stroke: '#D6D9DE' }}
                label={{ value: 'Minutes played', position: 'insideBottom', offset: -12, fill: '#646B76', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Ceiling"
                width={64}
                tick={{ fill: '#9AA0AA', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Ceiling room',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 16,
                  style: { textAnchor: 'middle', fill: '#646B76', fontSize: 11 },
                }}
              />
              <ZAxis type="number" dataKey="z" range={[60, 280]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  if (name === 'Minutes') return [value, 'Minutes']
                  if (name === 'Ceiling') return [`+${value}`, 'Ceiling room']
                  return [value, name]
                }}
                labelFormatter={() => ''}
                content={<MatrixTooltip />}
              />
              <Scatter
                data={points}
                onClick={(p: { payload?: MatrixPoint }) =>
                  p.payload && navigate(`/player/${p.payload.teamId}/${p.payload.slug}`)
                }
                cursor="pointer"
              >
                {points.map((p, i) => (
                  <Cell key={i} fill={STAGE_COLOR[p.stage] ?? '#646B76'} fillOpacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(STAGE_COLOR).map(([stage, color]) => (
            <span key={stage} className="flex items-center gap-1.5 text-xs text-ink-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {stage}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

function MatrixTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MatrixPoint }> }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 shadow-float">
      <div className="text-sm font-semibold text-ink-100">{p.name}</div>
      <div className="font-mono text-[11px] text-ink-300">
        {p.x} min · ceiling +{p.y} · age {p.z}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold" style={{ color: STAGE_COLOR[p.stage] }}>
        {p.stage}
      </div>
    </div>
  )
}

const tooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid #E7E9EC',
  borderRadius: 8,
  color: '#16191E',
  fontSize: 12,
  boxShadow: '0 12px 32px -10px rgba(16, 24, 40, 0.16)',
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-navy-600 bg-navy-800 p-4 text-center shadow-card">
      <div className="text-[10px] uppercase tracking-widest text-ink-300">{label}</div>
      <div className="mt-2 font-mono text-2xl font-bold leading-none text-ink-100">{value}</div>
      <div className="mt-1 font-mono text-[11px] text-ink-300">{sub}</div>
    </div>
  )
}
