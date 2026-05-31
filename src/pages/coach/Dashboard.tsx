// Home page. The single landing surface for FieldVision: an at a glance
// command center for the managed club that also surfaces the platform's
// scouting brain. Layout takes its cues from a FIFA Career home (matchday,
// timeline, standings, plus brand differentiators in place of fake social
// media and fake player messages).

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Radar,
  Sparkles,
  Trophy,
  Upload,
  Users,
} from 'lucide-react'
import { useUniverse } from '../../context/UniverseContext'
import {
  getStatDef,
  getTeam,
  matchesForTeam,
  rankOf,
  standingFor,
  teamAggregate,
  teamPlayers,
} from '../../data/selectors'
import { buildPercentiles } from '../../data/gameModel'
import {
  landscapeAverages,
  leagueLandscape,
  squadScatter,
  teamStyleProfile,
} from '../../data/teamEval'
import type { Match, Player, Universe } from '../../data/types'
import { TeamDnaRadar } from '../../components/dashboard/TeamDnaRadar'
import { LeagueLandscape } from '../../components/dashboard/LeagueLandscape'
import { SquadScatter } from '../../components/dashboard/SquadScatter'
import { FormPills } from '../../components/league/FormPills'
import { TeamCrest } from '../../components/league/TeamCrest'
import { TeamLink } from '../../components/league/TeamLink'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { PageHeader, PageShell } from '../../components/layout/PageHeader'
import { dateLabel, outcomeFor, POSTSEASON_CUTOFF } from '../../components/league/league'

const MIN_MINUTES_FOR_INSIGHT = 200
const STANDINGS_PREVIEW_ROWS = 6
const SCOUTING_PICK_COUNT = 3

interface InsightSpec {
  statKey: string
  lowerBetter?: boolean
  phrase: (name: string, value: string) => string
}

const INSIGHT_SPECS: InsightSpec[] = [
  {
    statKey: 'progressiveRuns',
    phrase: (name, value) =>
      `${name} drives the team forward with ${value} progressive runs the most in the squad.`,
  },
  {
    statKey: 'runsCreatingChances',
    phrase: (name, value) =>
      `${name} unlocks defenses with ${value} runs that create chances off the ball.`,
  },
  {
    statKey: 'ppda',
    lowerBetter: true,
    phrase: (name, value) =>
      `${name} sets the press with a PPDA of ${value} hounding opponents higher up the pitch.`,
  },
  {
    statKey: 'spaceCreatedPer90',
    phrase: (name, value) =>
      `${name} manufactures space creating ${value} per 90 to free up teammates.`,
  },
  {
    statKey: 'offBallDistanceKm',
    phrase: (name, value) =>
      `${name} covers ${value} km off the ball the engine of the team's movement.`,
  },
]

interface Insight {
  text: string
  statLabel: string
  player: Player
}

function buildInsights(squad: Player[]): Insight[] {
  const eligible = squad.filter((p) => p.season.minutes >= MIN_MINUTES_FOR_INSIGHT)
  const insights: Insight[] = []

  for (const spec of INSIGHT_SPECS) {
    const def = getStatDef(spec.statKey)
    if (!def) continue
    const pool = eligible.filter((p) =>
      def.scope === 'gk' ? p.positionGroup === 'GK' : p.positionGroup !== 'GK',
    )
    if (!pool.length) continue

    const leader = [...pool].sort((a, b) =>
      spec.lowerBetter ? def.get(a) - def.get(b) : def.get(b) - def.get(a),
    )[0]
    if (!leader) continue

    insights.push({
      text: spec.phrase(leader.name, def.format(def.get(leader))),
      statLabel: def.label,
      player: leader,
    })
    if (insights.length >= 3) break
  }

  return insights
}

interface ScoutingPick {
  player: Player
  pitch: string
  statLabel: string
  statValue: string
}

const SCOUTING_SPECS: InsightSpec[] = [
  {
    statKey: 'progressiveRuns',
    phrase: (name, value) =>
      `${name} carries the ball through pressure with ${value} progressive runs.`,
  },
  {
    statKey: 'spaceCreatedPer90',
    phrase: (name, value) =>
      `${name} creates ${value} of space per 90 a true tactical playmaker.`,
  },
  {
    statKey: 'ppda',
    lowerBetter: true,
    phrase: (name, value) =>
      `${name} leads the league press with a PPDA of ${value}.`,
  },
  {
    statKey: 'runsCreatingChances',
    phrase: (name, value) =>
      `${name} runs in behind with ${value} chance creating runs.`,
  },
]

// Picks 3 standout players from other clubs across diverse FieldVision metrics.
// Used as the "AI Scouting Picks" rail (replaces FIFA's fake player messages).
function buildScoutingPicks(universe: Universe, myTeamId: string): ScoutingPick[] {
  const usedPlayerIds = new Set<string>()
  const picks: ScoutingPick[] = []

  for (const spec of SCOUTING_SPECS) {
    if (picks.length >= SCOUTING_PICK_COUNT) break
    const def = getStatDef(spec.statKey)
    if (!def) continue

    const pool = universe.players.filter((p) => {
      if (p.teamId === myTeamId) return false
      if (usedPlayerIds.has(p.id)) return false
      if (p.season.minutes < MIN_MINUTES_FOR_INSIGHT) return false
      if (def.scope === 'gk') return p.positionGroup === 'GK'
      if (def.scope === 'outfield') return p.positionGroup !== 'GK'
      return true
    })
    if (!pool.length) continue

    const leader = [...pool].sort((a, b) =>
      spec.lowerBetter ? def.get(a) - def.get(b) : def.get(b) - def.get(a),
    )[0]
    if (!leader) continue

    usedPlayerIds.add(leader.id)
    picks.push({
      player: leader,
      pitch: spec.phrase(leader.name, def.format(def.get(leader))),
      statLabel: def.short,
      statValue: def.format(def.get(leader)),
    })
  }

  return picks
}

export function Dashboard() {
  const { universe, myTeamId, setMyTeamId } = useUniverse()
  const navigate = useNavigate()

  const team = getTeam(universe, myTeamId)
  const squad = useMemo(() => teamPlayers(universe, myTeamId), [universe, myTeamId])
  const schedule = useMemo(() => matchesForTeam(universe, myTeamId), [universe, myTeamId])

  const row = standingFor(universe, myTeamId)
  const rank = rankOf(universe, myTeamId)
  const agg = teamAggregate(universe, myTeamId)

  const percentiles = useMemo(() => buildPercentiles(universe.players), [universe.players])
  const styleProfile = useMemo(
    () => teamStyleProfile(universe, myTeamId, percentiles),
    [universe, myTeamId, percentiles],
  )
  const landscape = useMemo(() => leagueLandscape(universe), [universe])
  const landscapeAvg = useMemo(() => landscapeAverages(landscape), [landscape])
  const scatterPoints = useMemo(() => squadScatter(squad), [squad])

  const insights = useMemo(() => buildInsights(squad), [squad])
  const scoutingPicks = useMemo(
    () => buildScoutingPicks(universe, myTeamId),
    [universe, myTeamId],
  )

  const lastFive = useMemo(() => [...schedule].slice(-5), [schedule])
  const lastMatch = lastFive[lastFive.length - 1]
  const standingsPreview = useMemo(
    () => universe.standings.slice(0, STANDINGS_PREVIEW_ROWS),
    [universe.standings],
  )

  const sortedTeams = useMemo(
    () => [...universe.teams].sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [universe.teams],
  )

  function openPlayer(player: Player) {
    navigate(`/player/${player.teamId}/${player.slug}`)
  }

  const record = row ? `${row.wins} W · ${row.draws} D · ${row.losses} L` : 'No record'
  const accent = team?.primaryColor ?? '#2563EB'

  return (
    <PageShell>
      <PageHeader
        eyebrow="Command Center"
        lead={team ? <TeamCrest team={team} size="lg" /> : undefined}
        title={team?.name ?? 'Home'}
        subtitle={
          <>
            {team?.conference} · {universe.league.division} ·{' '}
            {universe.league.season}
          </>
        }
        actions={
          <label className="flex flex-col gap-1.5" data-tour="dash-club">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Managed Club
            </span>
            <select
              value={myTeamId}
              onChange={(e) => setMyTeamId(e.target.value)}
              className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 shadow-card transition-colors focus:border-team focus:outline-none"
            >
              {sortedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <section
        data-tour="dash-metrics"
        className="relative overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-50"
          style={{
            background: `linear-gradient(180deg, ${accent}22 0%, transparent 100%)`,
          }}
        />
        <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <MetricTile label="Position" value={rank ? ordinal(rank) : 'NR'} sub={`of ${universe.teams.length}`} />
          <MetricTile label="Points" value={String(row?.points ?? 0)} sub={`${row?.played ?? 0} played`} />
          <MetricTile label="Goals For" value={String(agg.goalsFor)} />
          <MetricTile label="Goals Against" value={String(agg.goalsAgainst)} />
          <MetricTile label="Squad Rating" value={String(agg.avgOverall)} sub="top XI" />
          <MetricTile label="Team FV" value={agg.avgFvRating.toFixed(1)} sub="avg rating" />
          <div className="col-span-2 flex flex-col justify-center rounded-xl border border-navy-600 bg-navy-700/50 p-4 md:col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Form</div>
            <div className="mt-2">
              <FormPills form={row?.form ?? []} size="md" />
            </div>
          </div>
        </div>
        <div className="relative mt-4 text-sm font-semibold text-ink-300">{record}</div>
      </section>

      <section className="space-y-3" data-tour="dash-evaluation">
        <div className="flex items-center gap-2">
          <Radar size={16} className="text-blue-500" />
          <h2 className="section-label text-blue-500">Team Evaluation</h2>
          <span className="text-xs text-ink-300">Beyond the box score</span>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Team DNA" accent="text-blue-500">
            <div className="p-6">
              <TeamDnaRadar
                data={styleProfile}
                teamName={team?.shortName ?? 'This team'}
                accent={accent}
              />
            </div>
          </SectionCard>
          <SectionCard title="League Landscape" accent="text-blue-500">
            <div className="p-6">
              <LeagueLandscape
                points={landscape}
                averages={landscapeAvg}
                myTeamId={myTeamId}
              />
            </div>
          </SectionCard>
        </div>
        <SectionCard
          title="Squad Value Map"
          accent="text-fv-green"
          icon={<span className="h-1.5 w-1.5 rounded-full bg-fv-green" />}
        >
          <SquadScatter points={scatterPoints} />
        </SectionCard>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LastMatchCard
          universe={universe}
          match={lastMatch}
          myTeamId={myTeamId}
        />
        <TimelineCard
          universe={universe}
          matches={lastFive}
          myTeamId={myTeamId}
          onSeeAll={() => navigate('/league')}
        />
        <StandingsPreview
          universe={universe}
          rows={standingsPreview}
          myTeamId={myTeamId}
          onSeeAll={() => navigate('/league')}
        />
      </div>

      <section
        data-tour="dash-insights"
        className="rounded-2xl border border-fv-green/40 bg-fv-greenLight p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-fv-green" />
          <h2 className="section-label text-fv-green">FieldVision AI Insights</h2>
        </div>
        {insights.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {insights.map((insight) => (
              <button
                key={insight.statLabel}
                type="button"
                onClick={() => openPlayer(insight.player)}
                className="flex flex-col gap-3 rounded-xl border border-fv-green/20 bg-navy-800 p-4 text-left shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-fv-green">
                  {insight.statLabel}
                </span>
                <span className="text-sm leading-relaxed text-ink-100">{insight.text}</span>
                <span className="mt-auto flex items-center gap-2">
                  <PlayerAvatar name={insight.player.name} size="sm" />
                  <span className="font-mono text-xs text-ink-100">
                    {insight.player.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-ink-100">
            Insights appear once players log enough minutes this season.
          </div>
        )}
        <div className="mt-4 text-xs text-fv-green">
          Measured by FieldVision computer vision. No other D3 program tracks these.
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RosterSpotlight
          topRated={agg.topRated}
          topScorer={agg.topScorer}
          onOpen={openPlayer}
        />
        <ScoutingBoard
          universe={universe}
          picks={scoutingPicks}
          onOpen={openPlayer}
          onSeeAll={() => navigate('/market')}
        />
      </div>

      <UploadDropzone />
    </PageShell>
  )
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-navy-600 bg-navy-700/50 p-4 text-center transition-colors hover:border-navy-500">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">{label}</div>
      <div className="mt-2 font-mono text-2xl font-bold leading-none text-ink-100 nums">{value}</div>
      {sub ? <div className="mt-1.5 font-mono text-[11px] text-ink-300">{sub}</div> : null}
    </div>
  )
}

function LastMatchCard({
  universe,
  match,
  myTeamId,
}: {
  universe: Universe
  match: Match | undefined
  myTeamId: string
}) {
  if (!match) {
    return (
      <SectionCard title="Last Match" accent="text-blue-500">
        <div className="px-5 py-10 text-center text-sm text-ink-300">
          No matches played yet.
        </div>
      </SectionCard>
    )
  }

  const home = getTeam(universe, match.homeTeamId)
  const away = getTeam(universe, match.awayTeamId)
  const isHome = match.homeTeamId === myTeamId
  const opponent = isHome ? away : home
  const teamGoals = isHome ? match.homeGoals : match.awayGoals
  const oppGoals = isHome ? match.awayGoals : match.homeGoals
  const outcome = outcomeFor(match, myTeamId)

  const outcomeColor =
    outcome === 'W'
      ? 'text-fv-green'
      : outcome === 'L'
        ? 'text-fv-red'
        : 'text-ink-300'
  const outcomeLabel =
    outcome === 'W' ? 'Win' : outcome === 'L' ? 'Loss' : 'Draw'

  return (
    <SectionCard title="Last Match" accent="text-blue-500">
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-ink-300">
          <span>{dateLabel(match.date)}</span>
          <span className={outcomeColor}>{outcomeLabel}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5">
            {home ? <TeamCrest team={home} size="md" /> : null}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-100">
                {home?.shortName ?? '-'}
              </div>
              <div className="font-mono text-[11px] text-ink-300">Home</div>
            </div>
          </div>
          <div className="flex shrink-0 items-baseline gap-2 font-mono text-3xl font-bold tabular-nums text-ink-100">
            <span>{match.homeGoals}</span>
            <span className="text-ink-500">:</span>
            <span>{match.awayGoals}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2.5 text-right">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-100">
                {away?.shortName ?? '-'}
              </div>
              <div className="font-mono text-[11px] text-ink-300">Away</div>
            </div>
            {away ? <TeamCrest team={away} size="md" /> : null}
          </div>
        </div>

        {opponent ? (
          <div className="rounded-lg bg-navy-700 px-3 py-2 text-xs text-ink-300">
            <span className="font-semibold text-ink-100">
              {teamGoals} : {oppGoals}
            </span>{' '}
            vs {opponent.name}
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}

function TimelineCard({
  universe,
  matches,
  myTeamId,
  onSeeAll,
}: {
  universe: Universe
  matches: Match[]
  myTeamId: string
  onSeeAll: () => void
}) {
  const ordered = [...matches]
  return (
    <SectionCard
      title="Season Timeline"
      accent="text-blue-500"
      action={
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
        >
          Full season
          <ArrowUpRight size={12} />
        </button>
      }
    >
      {ordered.length ? (
        <div className="divide-y divide-navy-700">
          {ordered.map((match) => (
            <TimelineRow
              key={match.id}
              universe={universe}
              match={match}
              myTeamId={myTeamId}
            />
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-sm text-ink-300">No games played yet.</div>
      )}
    </SectionCard>
  )
}

function TimelineRow({
  universe,
  match,
  myTeamId,
}: {
  universe: Universe
  match: Match
  myTeamId: string
}) {
  const isHome = match.homeTeamId === myTeamId
  const opponent = getTeam(
    universe,
    isHome ? match.awayTeamId : match.homeTeamId,
  )
  const teamGoals = isHome ? match.homeGoals : match.awayGoals
  const oppGoals = isHome ? match.awayGoals : match.homeGoals
  const outcome = outcomeFor(match, myTeamId)

  const tone =
    outcome === 'W'
      ? 'bg-fv-green text-ink-900'
      : outcome === 'L'
        ? 'bg-fv-red text-ink-900'
        : 'bg-navy-600 text-ink-100'

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${tone}`}
      >
        {outcome}
      </span>
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-300">
        {dateLabel(match.date)}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-[11px] uppercase tracking-widest text-ink-300">
          {isHome ? 'vs' : 'at'}
        </span>
        {opponent ? <TeamCrest team={opponent} size="xs" /> : null}
        <span className="truncate text-sm text-ink-100">
          {opponent?.shortName ?? 'TBD'}
        </span>
      </div>
      <div className="font-mono text-sm font-bold tabular-nums text-ink-100">
        {teamGoals} : {oppGoals}
      </div>
    </div>
  )
}

function StandingsPreview({
  universe,
  rows,
  myTeamId,
  onSeeAll,
}: {
  universe: Universe
  rows: Universe['standings']
  myTeamId: string
  onSeeAll: () => void
}) {
  return (
    <SectionCard
      title="League Position"
      accent="text-blue-500"
      action={
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
        >
          Full table
          <ArrowUpRight size={12} />
        </button>
      }
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-navy-700 text-[10px] uppercase tracking-widest text-ink-300">
            <th className="w-8 py-2 text-center">#</th>
            <th className="py-2 text-left">Team</th>
            <th className="w-10 py-2 text-center">PL</th>
            <th className="w-10 py-2 text-right pr-4 font-bold text-ink-100">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const team = getTeam(universe, row.teamId)
            if (!team) return null
            const rank = index + 1
            const isMine = row.teamId === myTeamId
            const inPostseason = rank <= POSTSEASON_CUTOFF
            return (
              <tr
                key={row.teamId}
                className={`border-b border-navy-700 ${
                  isMine ? 'bg-navy-700' : ''
                }`}
              >
                <td className="relative py-2.5 text-center">
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${
                      inPostseason ? 'bg-fv-green' : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`font-mono text-sm font-semibold ${
                      isMine ? 'text-blue-500' : 'text-ink-100'
                    }`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <TeamLink team={team} crestSize="sm" useShortName />
                </td>
                <td className="py-2 text-center font-mono text-ink-300">
                  {row.played}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-base font-bold text-ink-100">
                  {row.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-2 px-4 py-2.5 text-[10px] text-ink-300">
        <span className="h-3 w-1 rounded bg-fv-green" />
        Postseason qualifies top {POSTSEASON_CUTOFF}
      </div>
    </SectionCard>
  )
}

function RosterSpotlight({
  topRated,
  topScorer,
  onOpen,
}: {
  topRated: Player | null
  topScorer: Player | null
  onOpen: (player: Player) => void
}) {
  return (
    <SectionCard
      title="Roster Spotlight"
      accent="text-blue-500"
      icon={<Trophy size={14} className="text-blue-500" />}
    >
      <div className="divide-y divide-navy-700">
        {topRated ? (
          <SpotlightRow
            player={topRated}
            tag="Top Rated"
            onOpen={() => onOpen(topRated)}
          />
        ) : null}
        {topScorer ? (
          <SpotlightRow
            player={topScorer}
            tag={`${topScorer.season.goals} Goals`}
            onOpen={() => onOpen(topScorer)}
          />
        ) : null}
        {!topRated && !topScorer ? (
          <div className="px-5 py-8 text-sm text-ink-300">No squad data.</div>
        ) : null}
      </div>
    </SectionCard>
  )
}

function SpotlightRow({
  player,
  tag,
  onOpen,
}: {
  player: Player
  tag: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-navy-700"
    >
      <PlayerAvatar name={player.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
          {tag}
        </div>
        <div className="truncate text-sm font-semibold text-ink-100">{player.name}</div>
        <div className="mt-0.5 font-mono text-[11px] text-ink-300">
          #{player.number} · {player.primaryPosition} · {player.classYear}
        </div>
      </div>
      <RatingBadge rating={player.season.fvRating} size="md" />
    </button>
  )
}

function ScoutingBoard({
  universe,
  picks,
  onOpen,
  onSeeAll,
}: {
  universe: Universe
  picks: ScoutingPick[]
  onOpen: (player: Player) => void
  onSeeAll: () => void
}) {
  return (
    <SectionCard
      title="AI Scouting Picks"
      accent="text-blue-500"
      icon={<Users size={14} className="text-blue-500" />}
      action={
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
        >
          Open market
          <ArrowUpRight size={12} />
        </button>
      }
    >
      {picks.length ? (
        <div className="divide-y divide-navy-700">
          {picks.map((pick) => {
            const team = getTeam(universe, pick.player.teamId)
            return (
              <button
                key={pick.player.id}
                type="button"
                onClick={() => onOpen(pick.player)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-navy-700"
              >
                <PlayerAvatar name={pick.player.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                    {team ? <TeamCrest team={team} size="xs" /> : null}
                    <span className="truncate">{team?.shortName ?? 'Free agent'}</span>
                  </div>
                  <div className="truncate text-sm font-semibold text-ink-100">
                    {pick.player.name}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-ink-300">
                    {pick.pitch}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-base font-bold text-ink-100">
                    {pick.statValue}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
                    {pick.statLabel}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="px-5 py-8 text-sm text-ink-300">
          The AI is still studying the league. Check back after more minutes are logged.
        </div>
      )}
    </SectionCard>
  )
}

function SectionCard({
  title,
  accent,
  action,
  icon,
  children,
}: {
  title: string
  accent: string
  action?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
      <div className="flex items-center justify-between border-b border-navy-600 px-5 py-3">
        <h2 className={`section-label flex items-center gap-2 ${accent}`}>
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function UploadDropzone() {
  return (
    <div
      data-tour="dash-upload"
      className="cursor-pointer rounded-2xl border-2 border-dashed border-navy-500 bg-navy-800 transition-colors hover:border-blue-500 hover:bg-navy-700"
    >
      <div className="flex h-[160px] flex-col items-center justify-center px-6 text-center">
        <Upload size={26} strokeWidth={1.5} className="mb-2 text-blue-400" />
        <div className="text-base font-semibold text-ink-100">Drag your match film here</div>
        <div className="mt-1 text-sm text-ink-300">
          Any quality. Any angle. Processed in 12 minutes.
        </div>
        <div className="mt-2 font-mono text-xs text-ink-500">
          Supports MP4 MOV AVI · Up to 4GB
        </div>
      </div>
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
