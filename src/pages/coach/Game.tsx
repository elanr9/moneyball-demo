import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { usePlayerData } from '../../context/PlayerDataContext'
import { StatTile } from '../../components/ui/StatTile'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { getResultLetter, getResultColor } from '../../lib/statHelpers'
import type { Player } from '../../types/player'

interface ShotPoint {
  x: number
  y: number
  outcome: 'goal' | 'saved' | 'miss'
  player: string
}

const DEFAULT_SHOTS: ShotPoint[] = [
  { x: 78, y: 50, outcome: 'goal', player: 'Elan Romo' },
  { x: 65, y: 38, outcome: 'saved', player: 'Elan Romo' },
  { x: 60, y: 60, outcome: 'miss', player: 'Aidan Chuang' },
  { x: 82, y: 55, outcome: 'goal', player: 'Elan Romo' },
  { x: 55, y: 35, outcome: 'miss', player: 'Sam Roesler' },
  { x: 70, y: 50, outcome: 'saved', player: 'Elan Romo' },
  { x: 50, y: 65, outcome: 'miss', player: 'Will Scofield' },
]

export function Game() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { players, perGameByPlayerSlug } = usePlayerData()

  const gameNum = Number(id)
  const elanGame = (perGameByPlayerSlug['elan-romo'] ?? []).find(
    (g) => g.game === gameNum,
  )

  const shots = DEFAULT_SHOTS

  if (!elanGame) {
    return (
      <div className="p-8">
        <EmptyState
          title="Game not found"
          description="That game ID doesn't exist."
        />
      </div>
    )
  }

  const tone = getResultColor(elanGame.result)
  const letter = getResultLetter(elanGame.result)
  const score = elanGame.result.replace(/^[WLD]\s*/, '')

  const lineup = useMemo(() => buildLineup(players, elanGame), [
    players,
    elanGame,
  ])

  const insights = [
    `Elan Romo logged ${elanGame.pressure} pressure events, his best of the season.`,
    `Brandeis xG (${elanGame.xg.toFixed(1)} from #9 alone) significantly exceeded ${elanGame.opponent}'s.`,
    `Sprint distance peaked at ${elanGame.topSpeed} km/h in the 67th minute.`,
    `Right side attack created 67% of total chances created.`,
  ]

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <button
        type="button"
        onClick={() => navigate('/games')}
        className="text-xs text-ink-300 hover:text-white uppercase tracking-widest"
      >
        ← Back to Games
      </button>

      <section className="bg-navy-800 rounded-lg border border-navy-600 p-8">
        <div className="flex items-end gap-6">
          <div
            className={clsx(
              'inline-block w-10 h-10 rounded text-center text-base leading-10 font-bold',
              tone === 'green' && 'bg-fv-green text-white',
              tone === 'red' && 'bg-fv-red text-white',
              tone === 'gray' && 'bg-navy-600 text-white',
            )}
          >
            {letter}
          </div>
          <div className="flex-1">
            <div className="section-label text-blue-500 mb-2">
              Game {elanGame.game} · {elanGame.date}
            </div>
            <h1 className="text-3xl font-bold text-white">
              Brandeis vs {elanGame.opponent}
            </h1>
            <div className="text-sm text-ink-300 mt-1 font-mono">
              {score} · Home · Gordon Field
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-ink-300 mb-1">
              Team FV
            </div>
            <div className="font-mono text-3xl font-bold text-white">7.4</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Possession" value="58%" sublabel="vs 42%" />
        <StatTile
          label="Shots"
          value={String(elanGame.shots * 3 + 4)}
          sublabel={`${elanGame.shots} from #9`}
        />
        <StatTile
          label="Shots on Target"
          value={String(elanGame.sot * 2 + 1)}
          sublabel="62% accuracy"
        />
        <StatTile label="Corners" value="6" sublabel="3 dangerous" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2 bg-navy-800 rounded-lg border border-navy-600">
          <div className="px-6 py-4 border-b border-navy-600">
            <h2 className="section-label text-blue-500">Lineup Stats</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-navy-700">
              <tr className="text-[11px] uppercase tracking-widest text-ink-300">
                <th className="px-4 py-2.5 text-left font-semibold">#</th>
                <th className="px-3 py-2.5 text-left font-semibold">Player</th>
                <th className="px-3 py-2.5 text-right font-semibold">Min</th>
                <th className="px-3 py-2.5 text-right font-semibold">G</th>
                <th className="px-3 py-2.5 text-right font-semibold">A</th>
                <th className="px-3 py-2.5 text-right font-semibold">Shots</th>
                <th className="px-3 py-2.5 text-right font-semibold">xG</th>
                <th className="px-3 py-2.5 text-right font-semibold">Pass%</th>
                <th className="px-4 py-2.5 text-right font-semibold">FV</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {lineup.map((row) => (
                <tr
                  key={row.slug}
                  onClick={() => navigate(`/player/${row.slug}`)}
                  className={clsx(
                    'border-t border-navy-700 hover:bg-navy-700 cursor-pointer transition-colors',
                    row.slug === 'elan-romo' && 'border-l-2 border-l-blue-500',
                  )}
                >
                  <td className="px-4 py-2.5 text-ink-300">{row.number}</td>
                  <td className="px-3 py-2.5 font-sans text-white font-medium">
                    {row.name}
                  </td>
                  <td className="px-3 py-2.5 text-right">{row.min}</td>
                  <td className="px-3 py-2.5 text-right">{row.goals}</td>
                  <td className="px-3 py-2.5 text-right">{row.assists}</td>
                  <td className="px-3 py-2.5 text-right">{row.shots}</td>
                  <td className="px-3 py-2.5 text-right">
                    {row.xg.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">{row.passPct}%</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end">
                      <RatingBadge rating={row.fvRating} size="sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <h2 className="section-label text-blue-500 mb-4">Shot Map</h2>
          <ShotMap shots={shots} />
          <div className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-widest text-ink-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-fv-green" />
              Goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              On Target
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink-500" />
              Miss
            </span>
          </div>
        </section>
      </div>

      <section className="bg-navy-800 rounded-lg border border-navy-600 p-6">
        <h2 className="section-label text-fv-green mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-fv-green" />
          FieldVision AI Insights
        </h2>
        <ul className="space-y-2.5">
          {insights.map((line, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm text-ink-100 border-l-2 border-fv-green pl-4 py-1"
            >
              <span className="text-fv-green font-mono">{i + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

interface LineupRow {
  slug: string
  number: string
  name: string
  min: number
  goals: number
  assists: number
  shots: number
  xg: number
  passPct: number
  fvRating: number
}

function buildLineup(
  players: Player[],
  elanGame: { fvRating: number; min: number; goals: number; assists: number; shots: number; xg: number; passPct: number },
): LineupRow[] {
  const sorted = [...players].sort((a, b) => b.fvRating - a.fvRating)
  const eleven = sorted
    .filter((p) => p.gp > 0)
    .slice(0, 11)
    .sort((a, b) => Number(a.number) - Number(b.number))

  return eleven.map((p) => {
    if (p.slug === 'elan-romo') {
      return {
        slug: p.slug,
        number: p.number,
        name: p.name,
        min: elanGame.min,
        goals: elanGame.goals,
        assists: elanGame.assists,
        shots: elanGame.shots,
        xg: elanGame.xg,
        passPct: Math.round(elanGame.passPct),
        fvRating: elanGame.fvRating,
      }
    }
    const gp = Math.max(p.gp, 1)
    return {
      slug: p.slug,
      number: p.number,
      name: p.name,
      min: Math.min(90, Math.round(p.minutes / gp)),
      goals: Math.round(p.goals / gp),
      assists: Math.round(p.assists / gp),
      shots: Math.round(p.shots / gp),
      xg: p.xg / gp,
      passPct: 80,
      fvRating: clampRating(p.fvRating + (Math.random() - 0.5) * 0.6),
    }
  })
}

function clampRating(v: number): number {
  return Math.max(5.5, Math.min(9.5, Math.round(v * 10) / 10))
}

function ShotMap({ shots }: { shots: ShotPoint[] }) {
  return (
    <svg viewBox="0 0 100 70" className="w-full h-auto bg-navy-900 rounded">
      <rect
        x="1"
        y="1"
        width="98"
        height="68"
        fill="none"
        stroke="#2A567F"
        strokeWidth="0.4"
      />
      <line
        x1="50"
        y1="1"
        x2="50"
        y2="69"
        stroke="#2A567F"
        strokeWidth="0.3"
      />
      <circle
        cx="50"
        cy="35"
        r="9"
        fill="none"
        stroke="#2A567F"
        strokeWidth="0.3"
      />
      <rect
        x="83"
        y="20"
        width="16"
        height="30"
        fill="none"
        stroke="#2A567F"
        strokeWidth="0.3"
      />
      <rect
        x="93"
        y="28"
        width="6"
        height="14"
        fill="none"
        stroke="#2A567F"
        strokeWidth="0.3"
      />
      <circle
        cx="88"
        cy="35"
        r="0.6"
        fill="#2A567F"
      />

      {shots.map((s, i) => {
        const fill =
          s.outcome === 'goal'
            ? '#2E7D32'
            : s.outcome === 'saved'
              ? '#4A99E0'
              : '#64748B'
        return (
          <g key={i}>
            <circle
              cx={s.x}
              cy={s.y}
              r="1.6"
              fill={fill}
              stroke="#0B1A2E"
              strokeWidth="0.3"
            />
          </g>
        )
      })}
    </svg>
  )
}
