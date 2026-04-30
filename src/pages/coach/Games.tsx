import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { usePlayerData } from '../../context/PlayerDataContext'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { getResultColor, getResultLetter } from '../../lib/statHelpers'
import type { PerGameStats } from '../../types/game'

const MONTH_NAMES: Record<string, string> = {
  '9': 'September',
  '10': 'October',
  '11': 'November',
}

export function Games() {
  const { perGameByPlayerSlug } = usePlayerData()
  const navigate = useNavigate()
  const games = perGameByPlayerSlug['elan-romo'] ?? []

  const grouped = new Map<string, PerGameStats[]>()
  for (const g of games) {
    const month = g.date.split('/')[0] ?? '9'
    const list = grouped.get(month) ?? []
    list.push(g)
    grouped.set(month, list)
  }

  return (
    <div className="p-8 space-y-6 max-w-[1100px] mx-auto">
      <div>
        <div className="section-label text-blue-500 mb-2">Games</div>
        <h1 className="text-3xl font-bold text-white">2025 Season</h1>
        <div className="text-sm text-ink-300 mt-1">
          {games.length} games · Sorted chronologically
        </div>
      </div>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([month, list]) => (
          <section key={month}>
            <h2 className="text-xs uppercase tracking-widest text-ink-300 font-semibold mb-3">
              {MONTH_NAMES[month] ?? `Month ${month}`}
            </h2>
            <div className="space-y-2">
              {list.map((g) => {
                const tone = getResultColor(g.result)
                const letter = getResultLetter(g.result)
                const score = g.result.replace(/^[WLD]\s*/, '')
                return (
                  <button
                    key={g.game}
                    type="button"
                    onClick={() => navigate(`/game/${g.game}`)}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg p-5 flex items-center gap-6 hover:bg-navy-700 transition-colors text-left"
                  >
                    <div className="text-xs font-mono text-ink-300 uppercase tracking-widest w-16">
                      {g.date}
                    </div>
                    <div
                      className={clsx(
                        'inline-block w-7 h-7 rounded text-center text-xs leading-7 font-bold',
                        tone === 'green' && 'bg-fv-green text-white',
                        tone === 'red' && 'bg-fv-red text-white',
                        tone === 'gray' && 'bg-navy-600 text-white',
                      )}
                    >
                      {letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-white truncate">
                        {g.opponent}
                      </div>
                      <div className="text-xs text-ink-300 mt-0.5 font-mono">
                        Final · {score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-ink-300">
                        Top Performer
                      </div>
                      <div className="text-sm text-white font-medium mt-0.5">
                        Elan Romo
                      </div>
                    </div>
                    <RatingBadge rating={g.fvRating} size="md" />
                    <ChevronRight size={16} className="text-ink-300" />
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
