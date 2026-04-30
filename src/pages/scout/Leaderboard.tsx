import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { usePlayerData } from '../../context/PlayerDataContext'
import { Tabs } from '../../components/ui/Tabs'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { RatingBadge } from '../../components/ui/RatingBadge'
import type { Player } from '../../types/player'

interface BoardConfig {
  id: string
  label: string
  description: string
  statLabel: string
  getValue: (p: Player) => number
  format: (v: number) => string
}

const BOARDS: BoardConfig[] = [
  {
    id: 'goals',
    label: 'Top Goalscorers',
    description: 'Pure finishing output across the season.',
    statLabel: 'Goals',
    getValue: (p) => p.goals,
    format: (v) => v.toString(),
  },
  {
    id: 'creators',
    label: 'Top Creators',
    description: 'Assists plus chances created.',
    statLabel: 'Creation Score',
    getValue: (p) => p.assists * 2 + p.chancesCreated,
    format: (v) => v.toString(),
  },
  {
    id: 'defenders',
    label: 'Best Defenders',
    description: 'Tackles, interceptions, and recoveries combined.',
    statLabel: 'Def Score',
    getValue: (p) => p.tackles + p.interceptions + p.recoveries / 4,
    format: (v) => Math.round(v).toString(),
  },
  {
    id: 'rating',
    label: 'Highest FV Rating',
    description: 'Overall FieldVision rating across all metrics.',
    statLabel: 'FV',
    getValue: (p) => p.fvRating,
    format: (v) => v.toFixed(1),
  },
]

const RANK_TONE: Record<number, string> = {
  1: 'bg-fv-yellow text-navy-900',
  2: 'bg-ink-100 text-navy-900',
  3: 'bg-fv-red text-white',
}

export function Leaderboard() {
  const { players } = usePlayerData()
  const navigate = useNavigate()
  const [active, setActive] = useState('goals')

  const board = BOARDS.find((b) => b.id === active) ?? BOARDS[0]!

  const ranked = useMemo(() => {
    return [...players]
      .filter((p) => p.gp > 0)
      .sort((a, b) => board.getValue(b) - board.getValue(a))
      .slice(0, 10)
  }, [players, board])

  return (
    <div className="p-8 space-y-6 max-w-[900px] mx-auto">
      <div>
        <div className="section-label text-blue-500 mb-2">Leaderboard</div>
        <h1 className="text-3xl font-bold text-white">
          Top performers, 2025 season
        </h1>
        <div className="text-sm text-ink-300 mt-1">{board.description}</div>
      </div>

      <Tabs
        tabs={BOARDS.map((b) => ({ id: b.id, label: b.label }))}
        active={active}
        onChange={setActive}
      />

      <div className="bg-navy-800 border border-navy-600 rounded-lg divide-y divide-navy-700">
        {ranked.map((p, idx) => {
          const rank = idx + 1
          return (
            <div
              key={p.slug}
              className="flex items-center gap-4 px-5 py-4 hover:bg-navy-700 transition-colors"
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0',
                  RANK_TONE[rank] ?? 'bg-navy-700 text-ink-300 border border-navy-600',
                )}
              >
                {rank}
              </div>
              <PlayerAvatar name={p.name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-white truncate">
                  {p.name}
                </div>
                <div className="text-xs text-ink-300 font-mono mt-0.5">
                  Brandeis Men's Soccer · {p.position} · #{p.number}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-ink-300">
                  {board.statLabel}
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {board.format(board.getValue(p))}
                </div>
              </div>
              <RatingBadge rating={p.fvRating} size="md" />
              <button
                type="button"
                onClick={() => navigate(`/player/${p.slug}`)}
                className="px-3 py-2 text-xs uppercase tracking-widest font-semibold border border-navy-600 text-ink-100 rounded-md hover:bg-navy-600 hover:text-white transition-colors"
              >
                View
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
