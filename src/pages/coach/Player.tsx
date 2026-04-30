import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { PlayCircle, Calendar } from 'lucide-react'
import { usePlayerData } from '../../context/PlayerDataContext'
import { Tabs } from '../../components/ui/Tabs'
import { StatTile } from '../../components/ui/StatTile'
import { StatGroup } from '../../components/ui/StatGroup'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Player as PlayerType } from '../../types/player'
import type { PerGameStats } from '../../types/game'

const TAB_ITEMS = [
  { id: 'season', label: 'Season' },
  { id: 'pergame', label: 'Per Game' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'compare', label: 'Compare' },
]

const POSITION_FULL: Record<string, string> = {
  GK: 'GOALKEEPER',
  B: 'DEFENDER',
  M: 'MIDFIELDER',
  F: 'FORWARD',
  'M/B': 'MIDFIELDER / BACK',
}

const PLAYER_PHOTOS: Record<string, string> = {
  'elan-romo': '/players/elan-romo.png',
}

const PLAYER_HIGHLIGHT_VIDEOS: Record<string, string> = {
  'elan-romo': 'https://www.youtube.com/embed/ZVhHnAVedQE',
}

export function Player() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { getPlayerBySlug, getPerGameForPlayer, players } = usePlayerData()
  const [tab, setTab] = useState('season')

  const player = slug ? getPlayerBySlug(slug) : undefined

  if (!player) {
    return (
      <div className="p-8">
        <EmptyState
          title="Player not found"
          description="Try going back to the roster."
        />
      </div>
    )
  }

  const perGame = getPerGameForPlayer(player.slug)
  const minutesPct = player.gp ? Math.round((player.minutes / 1620) * 100) : 0

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <button
        type="button"
        onClick={() => navigate('/roster')}
        className="text-xs text-ink-300 hover:text-white uppercase tracking-widest"
      >
        ← Back to Roster
      </button>

      <PlayerHeader player={player} minutesPct={minutesPct} />

      <Tabs tabs={TAB_ITEMS} active={tab} onChange={setTab} />

      {tab === 'season' && <SeasonTab player={player} />}
      {tab === 'pergame' && (
        <PerGameTab player={player} perGame={perGame} />
      )}
      {tab === 'highlights' && (
        <HighlightsTab videoUrl={PLAYER_HIGHLIGHT_VIDEOS[player.slug]} />
      )}
      {tab === 'compare' && (
        <CompareTab player={player} allPlayers={players} />
      )}
    </div>
  )
}

function PlayerHeader({
  player,
  minutesPct,
}: {
  player: PlayerType
  minutesPct: number
}) {
  return (
    <section className="bg-navy-800 rounded-lg border border-navy-600 p-8">
      <div className="flex items-center gap-8">
        <PlayerAvatar
          name={player.name}
          size="xl"
          photoUrl={PLAYER_PHOTOS[player.slug]}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-blue-500 mb-2">
            Player Profile
          </div>
          <h1 className="text-4xl font-bold text-white">{player.name}</h1>
          <div className="text-sm text-ink-300 mt-2">
            Brandeis Men's Soccer · NCAA Division III · UAA Conference
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="font-mono font-semibold text-blue-400 tracking-widest">
              {POSITION_FULL[player.position] ?? player.position}
            </span>
            <span className="text-ink-500">·</span>
            <span className="font-mono text-white">#{player.number}</span>
            <span className="text-ink-500">·</span>
            <span className="text-ink-300">{player.year}</span>
            {player.height ? (
              <>
                <span className="text-ink-500">·</span>
                <span className="text-ink-300">{player.height}</span>
              </>
            ) : null}
          </div>
          <div className="mt-3 text-xs uppercase tracking-widest text-ink-300 font-mono">
            Min Played · {player.minutes.toLocaleString()} / 1,620 ·{' '}
            {minutesPct}%
          </div>
        </div>
        <RatingBadge rating={player.fvRating} size="xl" />
      </div>
    </section>
  )
}

function SeasonTab({ player }: { player: PlayerType }) {
  return (
    <div className="space-y-5">
      <StatGroup title="Top Stats" tone="navy">
        <StatTile label="Goals" value={player.goals} />
        <StatTile label="Assists" value={player.assists} />
        <StatTile label="xG" value={player.xg.toFixed(2)} />
        <StatTile label="xGOT" value={player.xgOt.toFixed(2)} />
        <StatTile label="xA" value={player.xa.toFixed(2)} />
        <StatTile label="Shots" value={player.shots} />
        <StatTile label="Shots on Target" value={player.shotsOnTarget} />
        <StatTile label="Shots off Target" value={player.shotsOffTarget} />
        <StatTile label="Blocked Shots" value={player.blockedShots} />
        <StatTile
          label="Shot Accuracy"
          value={player.shotAccuracy || '—'}
        />
        <StatTile
          label="Accurate Passes"
          value={player.accuratePasses || '—'}
        />
        <StatTile label="Chances Created" value={player.chancesCreated} />
        <StatTile label="Big Chances" value={player.bigChancesCreated} />
        <StatTile
          label="Defensive Contributions"
          value={player.defensiveContributions}
        />
      </StatGroup>

      <StatGroup title="Attack" tone="blue">
        <StatTile label="Touches" value={player.touches} />
        <StatTile
          label="Touches in Opp Box"
          value={player.touchesOppBox}
        />
        <StatTile
          label="Successful Dribbles"
          value={player.successfulDribbles || '—'}
        />
        <StatTile
          label="Passes into Final Third"
          value={player.passesFinalThird}
        />
        <StatTile
          label="Accurate Crosses"
          value={player.accurateCrosses || '—'}
        />
        <StatTile label="Corners" value={player.corners} />
        <StatTile label="Dispossessed" value={player.dispossessed} />
      </StatGroup>

      <StatGroup title="Duels" tone="blue">
        <StatTile
          label="Ground Duels Won"
          value={player.groundDuelsWon || '—'}
        />
        <StatTile
          label="Aerial Duels Won"
          value={player.aerialDuelsWon || '—'}
        />
        <StatTile label="Was Fouled" value={player.wasFouled} />
        <StatTile label="Fouls Committed" value={player.foulsCommitted} />
      </StatGroup>

      <StatGroup title="Defense" tone="blue">
        <StatTile label="Tackles" value={player.tackles} />
        <StatTile label="Interceptions" value={player.interceptions} />
        <StatTile label="Recoveries" value={player.recoveries} />
        <StatTile label="Dribbled Past" value={player.dribbledPast} />
      </StatGroup>

      <StatGroup
        title="Off Ball · FieldVision Only"
        tone="green"
        footer={
          <div className="text-xs text-fv-green leading-relaxed border-l-2 border-fv-green pl-3 bg-fv-greenLight rounded-r p-3">
            These metrics don't exist on Opta, StatsBomb, or Wyscout.
            Generated by FieldVision computer vision for every player, every
            game.
          </div>
        }
      >
        <StatTile
          label="Off Ball Distance (km)"
          value={player.offBallDistanceKm.toFixed(1)}
          variant="fv-only"
        />
        <StatTile
          label="Sprint Distance (m)"
          value={player.sprintDistanceM.toLocaleString()}
          variant="fv-only"
        />
        <StatTile
          label="Top Speed (km/h)"
          value={player.topSpeedKmh.toFixed(1)}
          variant="fv-only"
        />
        <StatTile
          label="Pressure Events"
          value={player.pressureEvents}
          variant="fv-only"
        />
        <StatTile
          label="Runs Creating Chances"
          value={player.runsCreatingChances}
          variant="fv-only"
        />
        <StatTile
          label="Space Created /90"
          value={player.spaceCreatedPer90.toFixed(1)}
          variant="fv-only"
        />
        <StatTile
          label="Progressive Runs"
          value={player.progressiveRuns}
          variant="fv-only"
        />
        <StatTile
          label="Defensive Actions /90"
          value={player.defensiveActionsPer90.toFixed(1)}
          variant="fv-only"
        />
      </StatGroup>
    </div>
  )
}

function PerGameTab({
  player,
  perGame,
}: {
  player: PlayerType
  perGame: PerGameStats[]
}) {
  if (perGame.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Per game breakdowns coming soon"
        description={`Per game data is currently available for: Elan Romo (#9). Other players will be backfilled before the next season starts.`}
      />
    )
  }

  const bestRating = Math.max(...perGame.map((g) => g.fvRating))

  return (
    <div className="bg-navy-800 rounded-lg border border-navy-600 overflow-hidden">
      <div className="px-6 py-4 border-b border-navy-600 flex items-center justify-between">
        <div>
          <h2 className="section-label text-blue-500">
            Per Game · {player.name}
          </h2>
          <div className="text-xs text-ink-300 mt-1">
            {perGame.length} games · Best rating {bestRating.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="overflow-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-navy-700">
            <tr className="text-[11px] uppercase tracking-widest text-ink-300">
              <th className="px-3 py-2.5 text-left font-semibold">Game</th>
              <th className="px-3 py-2.5 text-left font-semibold">Date</th>
              <th className="px-3 py-2.5 text-left font-semibold">Opponent</th>
              <th className="px-3 py-2.5 text-left font-semibold">Result</th>
              <th className="px-3 py-2.5 text-right font-semibold">Min</th>
              <th className="px-3 py-2.5 text-right font-semibold">G</th>
              <th className="px-3 py-2.5 text-right font-semibold">A</th>
              <th className="px-3 py-2.5 text-right font-semibold">Shots</th>
              <th className="px-3 py-2.5 text-right font-semibold">SoT</th>
              <th className="px-3 py-2.5 text-right font-semibold">xG</th>
              <th className="px-3 py-2.5 text-right font-semibold">xA</th>
              <th className="px-3 py-2.5 text-right font-semibold">Pass%</th>
              <th className="px-3 py-2.5 text-right font-semibold">Touches</th>
              <th className="px-3 py-2.5 text-right font-semibold text-fv-green">
                Off Ball km
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-fv-green">
                Top Speed
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">FV</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {perGame.map((g) => {
              const isBest = g.fvRating === bestRating
              return (
                <tr
                  key={g.game}
                  className={clsx(
                    'border-t border-navy-700 hover:bg-navy-700 transition-colors',
                    isBest && 'border-l-2 border-l-blue-500',
                  )}
                >
                  <td className="px-3 py-2.5 text-ink-300">{g.game}</td>
                  <td className="px-3 py-2.5 text-ink-300">{g.date}</td>
                  <td className="px-3 py-2.5 text-white font-sans font-medium">
                    {g.opponent}
                  </td>
                  <td className="px-3 py-2.5 text-ink-100">{g.result}</td>
                  <td className="px-3 py-2.5 text-right">{g.min}</td>
                  <td className="px-3 py-2.5 text-right">{g.goals}</td>
                  <td className="px-3 py-2.5 text-right">{g.assists}</td>
                  <td className="px-3 py-2.5 text-right">{g.shots}</td>
                  <td className="px-3 py-2.5 text-right">{g.sot}</td>
                  <td className="px-3 py-2.5 text-right">
                    {g.xg.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {g.xa.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {g.passPct.toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5 text-right">{g.touches}</td>
                  <td className="px-3 py-2.5 text-right text-fv-green">
                    {g.offBallKm.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-fv-green">
                    {g.topSpeed.toFixed(1)}
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-2.5 text-right font-bold',
                      g.fvRating >= 8.0
                        ? 'text-fv-green'
                        : g.fvRating < 6.5
                          ? 'text-fv-red'
                          : 'text-white',
                    )}
                  >
                    {g.fvRating.toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const CLIP_TYPES = [
  'Goal',
  'Assist',
  'Big Chance',
  'Tackle',
  'Pressure',
  'Progressive Run',
] as const

function HighlightsTab({ videoUrl }: { videoUrl?: string }) {
  const clips = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        type: CLIP_TYPES[i % CLIP_TYPES.length],
        timestamp: `${(11 + ((i * 7) % 70)).toString().padStart(2, '0')}:${((i * 13) % 60).toString().padStart(2, '0')}`,
      })),
    [],
  )

  return (
    <div className="space-y-5">
      {videoUrl ? (
        <div className="bg-navy-800 rounded-lg border border-navy-600 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-600">
            <h2 className="section-label text-blue-500">Season Highlight Reel</h2>
            <div className="text-xs text-ink-300 mt-1">
              Auto compiled from FieldVision tracked clips
            </div>
          </div>
          <div className="aspect-video bg-navy-900">
            <iframe
              src={videoUrl}
              title="Player highlight reel"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-4">
        {clips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => console.log('clip clicked', c.id)}
            className="group relative aspect-video bg-navy-700 rounded-md border border-navy-600 hover:border-blue-500 transition-colors overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle
                size={40}
                strokeWidth={1.25}
                className="text-white opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-navy-900/80 text-blue-400 rounded">
              {c.type}
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-mono bg-navy-900/80 text-white rounded">
              {c.timestamp}
            </div>
          </button>
        ))}
      </div>
      <div className="text-center text-xs text-fv-green border-l-2 border-fv-green pl-3 bg-fv-greenLight p-3 rounded-r">
        247 clips auto generated this season. Every touch tracked and tagged
        by FieldVision computer vision. No manual editing.
      </div>
    </div>
  )
}

function CompareTab({
  player,
  allPlayers,
}: {
  player: PlayerType
  allPlayers: PlayerType[]
}) {
  const others = allPlayers.filter((p) => p.slug !== player.slug)
  const defaultOther =
    allPlayers.find((p) => p.slug === 'aidan-chuang') ?? others[0]
  const [otherSlug, setOtherSlug] = useState(defaultOther?.slug ?? '')
  const other = allPlayers.find((p) => p.slug === otherSlug)

  if (!other) {
    return (
      <EmptyState
        title="No comparison available"
        description="Need at least one other player on the roster."
      />
    )
  }

  const stats: Array<{
    label: string
    key: keyof PlayerType
    decimals?: number
  }> = [
    { label: 'Goals', key: 'goals' },
    { label: 'Assists', key: 'assists' },
    { label: 'xG', key: 'xg', decimals: 2 },
    { label: 'xA', key: 'xa', decimals: 2 },
    { label: 'Shots', key: 'shots' },
    { label: 'Chances Created', key: 'chancesCreated' },
    { label: 'Touches', key: 'touches' },
    { label: 'Touches Opp Box', key: 'touchesOppBox' },
    { label: 'Tackles', key: 'tackles' },
    { label: 'Interceptions', key: 'interceptions' },
    { label: 'Off Ball Distance (km)', key: 'offBallDistanceKm', decimals: 1 },
    { label: 'Top Speed (km/h)', key: 'topSpeedKmh', decimals: 1 },
    { label: 'Pressure Events', key: 'pressureEvents' },
    { label: 'Progressive Runs', key: 'progressiveRuns' },
    { label: 'FV Rating', key: 'fvRating', decimals: 1 },
  ]

  function formatValue(p: PlayerType, s: (typeof stats)[number]) {
    const v = p[s.key]
    if (typeof v === 'number') {
      return s.decimals ? v.toFixed(s.decimals) : v.toString()
    }
    return String(v)
  }

  const columns = [player, other]

  return (
    <div className="space-y-5">
      <div className="bg-navy-800 rounded-lg border border-navy-600 p-5 flex items-center gap-5">
        <div className="text-xs uppercase tracking-widest text-ink-300">
          Compare with
        </div>
        <select
          value={otherSlug}
          onChange={(e) => setOtherSlug(e.target.value)}
          className="bg-navy-900 border border-navy-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          {others.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} · #{p.number} · {p.position}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {columns.map((p, idx) => {
          const opp = columns[1 - idx]!
          return (
            <div
              key={p.slug}
              className="bg-navy-800 rounded-lg border border-navy-600 p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <PlayerAvatar name={p.name} size="lg" />
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-ink-300 font-mono">
                    #{p.number} · {p.position} · {p.year}
                  </div>
                </div>
                <div className="ml-auto">
                  <RatingBadge rating={p.fvRating} size="lg" />
                </div>
              </div>

              <div className="space-y-2">
                {stats.map((s) => {
                  const mine = Number(p[s.key])
                  const theirs = Number(opp[s.key])
                  const isHigher = mine > theirs
                  const isLower = mine < theirs
                  return (
                    <div
                      key={String(s.key)}
                      className={clsx(
                        'flex items-center justify-between px-3 py-2 rounded-md border-l-2 bg-navy-700',
                        isHigher && 'border-fv-green',
                        isLower && 'border-fv-red',
                        !isHigher && !isLower && 'border-navy-600',
                      )}
                    >
                      <span className="text-xs uppercase tracking-widest text-ink-300">
                        {s.label}
                      </span>
                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatValue(p, s)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
