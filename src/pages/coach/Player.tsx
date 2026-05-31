// Player profile at /player/:teamId/:slug, used by every other phase. Built on
// the universe: a FIFA style card, full identity, an attribute radar, season
// stat groups from STAT_CATALOG, a per match log with an FV rating trend, and an
// auto generated highlights grid.

import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronRight, PlayCircle, Sparkles } from 'lucide-react'
import { useUniverse } from '../../context/UniverseContext'
import { useRoles } from '../../context/RolesContext'
import {
  STAT_CATALOG,
  getPlayerBySlug,
  getTeam,
} from '../../data/selectors'
import type { StatDef, StatGroup as StatGroupName } from '../../data/selectors'
import type { Player as PlayerType } from '../../data/types'
import { buildPercentiles, playerRoleFits } from '../../data/gameModel'
import type { Percentiles, RoleFit } from '../../data/gameModel'
import { playerSummary } from '../../data/playerSummary'
import { reportsFor } from '../../data/scoutReports'
import { Tabs } from '../../components/ui/Tabs'
import type { TabItem } from '../../components/ui/Tabs'
import { StatTile } from '../../components/ui/StatTile'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PlayerCard } from '../../components/squad/PlayerCard'
import { AttributeBreakdown } from '../../components/squad/AttributeBreakdown'
import { TeamCrest } from '../../components/league/TeamCrest'
import { dateLabel } from '../../components/league/league'
import { MatchDetailModal } from '../../components/player/MatchDetailModal'
import { PlayerIndexes } from '../../components/player/PlayerIndexes'
import { RoleFitGrid } from '../../components/player/RoleFitGrid'
import { ComparisonList } from '../../components/player/ComparisonList'
import { ScoutReportsPanel } from '../../components/player/ScoutReportsPanel'
import { CareerTab } from '../../components/player/CareerTab'
import type { PlayerMatchStat } from '../../data/types'

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'matchlog', label: 'Match Log' },
  { id: 'reports', label: 'Reports' },
  { id: 'career', label: 'Career' },
  { id: 'video', label: 'Video' },
]

const GROUP_ORDER: StatGroupName[] = [
  'Attacking',
  'Passing',
  'Defending',
  'Physical',
  'Advanced',
  'Goalkeeping',
]

export function Player() {
  const { teamId = '', slug = '' } = useParams()
  const { universe } = useUniverse()
  const { roles } = useRoles()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const player = getPlayerBySlug(universe, teamId, slug)
  const team = player ? getTeam(universe, player.teamId) : undefined

  const percentiles = useMemo(() => buildPercentiles(universe.players), [universe.players])
  const fits = useMemo(
    () => (player ? playerRoleFits(player, roles, percentiles) : []),
    [player, roles, percentiles],
  )
  const reportSummary = useMemo(
    () => (player ? reportsFor(player) : { averageStars: 0, count: 0 }),
    [player],
  )

  if (!player) {
    return (
      <div className="p-8">
        <EmptyState
          title="Player not found"
          description="This player is not in the league. Try the transfer market or a team page."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs uppercase tracking-widest text-ink-300 transition-colors hover:text-ink-100"
      >
        Back
      </button>

      <div data-tour="player-header">
        <ProfileHeader
          player={player}
          team={team}
          topFit={fits[0]}
          reportAverage={reportSummary.averageStars}
          reportCount={reportSummary.count}
        />
      </div>

      <div data-tour="player-tabs">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' ? (
        <OverviewTab player={player} fits={fits} percentiles={percentiles} />
      ) : null}
      {tab === 'statistics' ? <StatisticsTab player={player} /> : null}
      {tab === 'matchlog' ? <MatchLogTab player={player} /> : null}
      {tab === 'reports' ? <ScoutReportsPanel player={player} /> : null}
      {tab === 'career' ? <CareerTab player={player} /> : null}
      {tab === 'video' ? <VideoTab player={player} /> : null}
    </div>
  )
}

function ProfileHeader({
  player,
  team,
  topFit,
  reportAverage,
  reportCount,
}: {
  player: PlayerType
  team: ReturnType<typeof getTeam>
  topFit: RoleFit | undefined
  reportAverage: number
  reportCount: number
}) {
  const identity: Array<{ label: string; value: string }> = [
    { label: 'Position', value: player.primaryPosition },
  ]
  if (player.secondaryPositions.length > 0) {
    identity.push({
      label: 'Also Plays',
      value: player.secondaryPositions.join('  '),
    })
  }
  identity.push(
    { label: 'Number', value: `#${player.number}` },
    { label: 'Class', value: player.classYear },
    { label: 'Age', value: String(player.age) },
    { label: 'Foot', value: player.foot === 'L' ? 'Left' : 'Right' },
  )
  if (player.heightLabel) identity.push({ label: 'Height', value: player.heightLabel })
  if (player.weightLbs) identity.push({ label: 'Weight', value: `${player.weightLbs} lbs` })
  if (player.hometown) identity.push({ label: 'Hometown', value: player.hometown })
  if (player.country) identity.push({ label: 'Country', value: player.country })
  if (player.previousSchool) identity.push({ label: 'Previous', value: player.previousSchool })

  return (
    <section
      className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card"
      style={{ borderLeft: `4px solid ${team?.primaryColor ?? '#2563EB'}` }}
    >
      <div className="flex flex-wrap items-start gap-6">
        <PlayerCard player={player} team={team} size="detail" />

        <div className="min-w-0 flex-1">
          <div className="section-label text-blue-500">Player Profile</div>
          <h1 className="text-4xl font-bold tracking-tight text-ink-100">{player.name}</h1>
          {team ? (
            <Link
              to={`/team/${team.id}`}
              className="mt-2 inline-flex items-center gap-2 text-sm text-ink-100 transition-colors hover:text-blue-500"
            >
              <TeamCrest team={team} size="sm" />
              {team.name}
            </Link>
          ) : null}

          <div className="mt-4 flex items-start gap-2 rounded-md border border-navy-600 bg-navy-700/60 p-3">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm leading-relaxed text-ink-100">
              {playerSummary(player, team?.shortName, topFit)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SeasonChip label="Games Played" value={player.season.appearances} />
            <SeasonChip label="Games Started" value={player.season.starts} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {identity.map((item) => (
              <div key={item.label} className="rounded-md border border-navy-600 bg-navy-700 p-3">
                <div className="text-[10px] uppercase tracking-widest text-ink-300">
                  {item.label}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-ink-100" title={item.value}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <RatingBadge rating={player.season.fvRating} size="xl" />
          <div className="flex gap-3">
            <RatingTile label="Overall" value={player.overall} />
            <RatingTile label="Potential" value={player.potential} />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-navy-600 pt-5">
        <PlayerIndexes
          player={player}
          topFit={topFit}
          reportAverage={reportAverage}
          reportCount={reportCount}
        />
      </div>
    </section>
  )
}

function SeasonChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-navy-600 bg-navy-700 px-3 py-1.5">
      <span className="font-mono text-sm font-bold text-ink-100">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-ink-300">{label}</span>
    </div>
  )
}

function RatingTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-navy-600 bg-navy-700 px-4 py-2 text-center">
      <div className="font-mono text-2xl font-bold leading-none text-ink-100">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-ink-300">{label}</div>
    </div>
  )
}

function OverviewTab({
  player,
  fits,
  percentiles,
}: {
  player: PlayerType
  fits: RoleFit[]
  percentiles: Percentiles
}) {
  const { universe } = useUniverse()
  const compareRole = fits[0]?.role

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
        <h2 className="section-label mb-5 text-blue-500">Attribute Details</h2>
        <AttributeBreakdown player={player} />
      </section>

      <RoleFitGrid fits={fits} />

      {compareRole ? (
        <ComparisonList
          universe={universe}
          player={player}
          role={compareRole}
          percentiles={percentiles}
        />
      ) : null}
    </div>
  )
}

function StatisticsTab({ player }: { player: PlayerType }) {
  const groups = useMemo(() => groupedStats(player), [player])

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((groupName) => {
        const defs = groups[groupName]
        if (!defs || !defs.length) return null
        return (
          <section key={groupName} className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="section-label text-blue-500">{groupName}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {defs.map((def) => (
                <StatTile
                  key={def.key}
                  label={def.label}
                  value={def.format(def.get(player))}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function groupedStats(player: PlayerType): Partial<Record<StatGroupName, StatDef[]>> {
  const isGk = player.positionGroup === 'GK'
  const result: Partial<Record<StatGroupName, StatDef[]>> = {}
  for (const def of STAT_CATALOG) {
    if (def.scope === 'gk' && !isGk) continue
    if (def.scope === 'outfield' && isGk) continue
    const list = result[def.group] ?? []
    list.push(def)
    result[def.group] = list
  }
  return result
}

function MatchLogTab({ player }: { player: PlayerType }) {
  const { universe } = useUniverse()
  const [selected, setSelected] = useState<PlayerMatchStat | null>(null)
  const matches = useMemo(
    () => [...player.matches].sort((a, b) => a.date.localeCompare(b.date)),
    [player.matches],
  )

  if (!matches.length) {
    return <EmptyState title="No match data" description="This player has no logged appearances." />
  }

  const trendData = matches.map((m) => ({ label: dateLabel(m.date), rating: m.rating }))
  const bestRating = Math.max(...matches.map((m) => m.rating))
  const selectedOpponent = selected ? getTeam(universe, selected.opponentTeamId) : undefined

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
        <h2 className="section-label mb-4 text-blue-500">FV Rating Trend</h2>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#E7E9EC" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#646B76', fontSize: 11 }} axisLine={{ stroke: '#D6D9DE' }} />
              <YAxis domain={[4, 10]} tick={{ fill: '#9AA0AA', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E7E9EC',
                  borderRadius: 8,
                  color: '#16191E',
                  fontSize: 12,
                  boxShadow: '0 12px 32px -10px rgba(16, 24, 40, 0.16)',
                }}
              />
              <Line type="monotone" dataKey="rating" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
        <div className="border-b border-navy-600 px-5 py-3">
          <h2 className="section-label text-blue-500">Per Match Log</h2>
          <div className="mt-1 text-xs text-ink-300">
            {matches.length} appearances · Best rating {bestRating.toFixed(1)} · Click a match for the
            full breakdown
          </div>
        </div>
        <div className="scrollbar-thin overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-navy-700">
              <tr className="text-[11px] uppercase tracking-widest text-ink-300">
                <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                <th className="px-3 py-2.5 text-left font-semibold">Opponent</th>
                <th className="px-3 py-2.5 text-right font-semibold">Min</th>
                <th className="px-3 py-2.5 text-right font-semibold">G</th>
                <th className="px-3 py-2.5 text-right font-semibold">A</th>
                <th className="px-3 py-2.5 text-right font-semibold">Sh</th>
                <th className="px-3 py-2.5 text-right font-semibold">xG</th>
                <th className="px-3 py-2.5 text-right font-semibold">FV</th>
                <th className="px-3 py-2.5" aria-label="Open match" />
              </tr>
            </thead>
            <tbody className="font-mono">
              {matches.map((m) => {
                const opponent = getTeam(universe, m.opponentTeamId)
                return (
                  <tr
                    key={m.matchId}
                    onClick={() => setSelected(m)}
                    className="group cursor-pointer border-t border-navy-700 transition-colors hover:bg-navy-700"
                  >
                    <td className="px-3 py-2.5 text-ink-300">{dateLabel(m.date)}</td>
                    <td className="px-3 py-2.5">
                      {opponent ? (
                        <span className="inline-flex items-center gap-2 font-sans text-ink-100">
                          <TeamCrest team={opponent} size="xs" />
                          {opponent.shortName}
                        </span>
                      ) : (
                        <span className="font-sans text-ink-100">{m.opponentTeamId}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink-100">{m.minutes}</td>
                    <td className="px-3 py-2.5 text-right text-ink-100">{m.goals}</td>
                    <td className="px-3 py-2.5 text-right text-ink-100">{m.assists}</td>
                    <td className="px-3 py-2.5 text-right text-ink-100">{m.shots}</td>
                    <td className="px-3 py-2.5 text-right text-ink-100">{m.xg.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <RatingBadge rating={m.rating} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ChevronRight
                        size={16}
                        className="ml-auto text-ink-300 transition-colors group-hover:text-blue-500"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <MatchDetailModal
          player={player}
          match={selected}
          opponent={selectedOpponent}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}

// One every touch video per match the player featured in. Each card is titled
// "{Player} vs {Opponent}" so a coach can pull up a full game of touches in one
// click rather than a grid of disconnected clips.
function VideoTab({ player }: { player: PlayerType }) {
  const { universe } = useUniverse()
  const matches = useMemo(
    () => [...player.matches].sort((a, b) => b.date.localeCompare(a.date)),
    [player.matches],
  )

  if (!matches.length) {
    return <EmptyState title="No video" description="This player has no logged appearances yet." />
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {matches.map((m) => {
          const opponent = getTeam(universe, m.opponentTeamId)
          const opponentName = opponent ? opponent.shortName : m.opponentTeamId
          return (
            <button
              key={m.matchId}
              type="button"
              className="group relative aspect-video overflow-hidden rounded-xl border border-navy-600 bg-gradient-to-br from-slate-700 to-slate-900 shadow-card transition-colors hover:border-blue-500"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle
                  size={40}
                  strokeWidth={1.25}
                  className="text-white opacity-80 transition-opacity group-hover:opacity-100"
                />
              </div>
              <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] text-white">
                {dateLabel(m.date)}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                <span className="truncate rounded bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {player.firstName} vs {opponentName}
                </span>
                <span className="rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] text-white">
                  {m.minutes}'
                </span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="rounded-r border-l-2 border-fv-green bg-fv-greenLight p-3 text-center text-xs text-fv-green">
        Every touch video for each game this season. Tracked and tagged by FieldVision computer
        vision so you see everything in one place.
      </div>
    </div>
  )
}
