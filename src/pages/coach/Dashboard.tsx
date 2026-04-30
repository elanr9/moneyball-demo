import { useNavigate } from 'react-router-dom'
import { Upload, ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'
import { usePlayerData } from '../../context/PlayerDataContext'
import { StatTile } from '../../components/ui/StatTile'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { getResultColor, getResultLetter, topByStat } from '../../lib/statHelpers'

export function Dashboard() {
  const { players, perGameByPlayerSlug } = usePlayerData()
  const navigate = useNavigate()

  if (players.length === 0) return null

  const teamGoals = players.reduce((s, p) => s + p.goals, 0)
  const teamXg = players.reduce((s, p) => s + p.xg, 0)
  const avgRating =
    players.reduce((s, p) => s + p.fvRating, 0) / players.length

  const elanGames = perGameByPlayerSlug['elan-romo'] ?? []
  const recentGames = [...elanGames].slice(-5).reverse()

  const spotlight = topByStat(players, 'fvRating', 3)

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-label text-blue-500 mb-2">Coach Dashboard</div>
          <h1 className="text-3xl font-bold text-white">
            Brandeis Men's Soccer
          </h1>
          <div className="text-sm text-ink-300 mt-1">
            2025 Season · NCAA Division III · UAA Conference
          </div>
        </div>
        <div className="text-xs text-ink-300 font-mono uppercase tracking-widest">
          Updated 2 minutes ago
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Team Goals" value={teamGoals} sublabel="+8 vs 2024" />
        <StatTile
          label="Team xG"
          value={teamXg.toFixed(2)}
          sublabel="Conference rank: 2"
        />
        <StatTile
          label="Team FV Rating"
          value={`${avgRating.toFixed(1)} / 10`}
          sublabel="Top quartile in D-III"
        />
        <StatTile
          label="Games Played"
          value="18 / 18"
          sublabel="Season Complete"
        />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <section className="col-span-3 bg-navy-800 rounded-lg border border-navy-600">
          <div className="px-6 py-4 border-b border-navy-600 flex items-center justify-between">
            <h2 className="section-label text-blue-500">Recent Games</h2>
            <button
              type="button"
              onClick={() => navigate('/games')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all
              <ArrowUpRight size={12} />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-widest text-ink-300">
                <th className="text-left px-6 py-3 font-semibold">Date</th>
                <th className="text-left px-3 py-3 font-semibold">Opponent</th>
                <th className="text-left px-3 py-3 font-semibold">Result</th>
                <th className="text-left px-3 py-3 font-semibold">
                  Top Performer
                </th>
                <th className="text-right px-6 py-3 font-semibold">FV</th>
              </tr>
            </thead>
            <tbody>
              {recentGames.map((g) => {
                const tone = getResultColor(g.result)
                const letter = getResultLetter(g.result)
                return (
                  <tr
                    key={g.game}
                    onClick={() => navigate(`/game/${g.game}`)}
                    className="border-t border-navy-700 hover:bg-navy-700 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-ink-300">
                      {g.date}
                    </td>
                    <td className="px-3 py-3 text-white font-medium">
                      {g.opponent}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-2 text-xs font-semibold',
                          tone === 'green' && 'text-fv-green',
                          tone === 'red' && 'text-fv-red',
                          tone === 'gray' && 'text-ink-300',
                        )}
                      >
                        <span
                          className={clsx(
                            'inline-block w-5 h-5 rounded text-center text-[10px] leading-5 font-bold',
                            tone === 'green' && 'bg-fv-green text-white',
                            tone === 'red' && 'bg-fv-red text-white',
                            tone === 'gray' && 'bg-navy-600 text-white',
                          )}
                        >
                          {letter}
                        </span>
                        <span className="font-mono">
                          {g.result.replace(/^[WLD]\s*/, '')}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-100">Elan Romo</td>
                    <td className="px-6 py-3 text-right">
                      <RatingBadge rating={g.fvRating} size="sm" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="col-span-2 bg-navy-800 rounded-lg border border-navy-600">
          <div className="px-6 py-4 border-b border-navy-600">
            <h2 className="section-label text-blue-500">Roster Spotlight</h2>
          </div>
          <div className="divide-y divide-navy-700">
            {spotlight.map((p, idx) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => navigate(`/player/${p.slug}`)}
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-navy-700 text-left transition-colors"
              >
                <div className="text-xs font-mono text-ink-300 w-5">
                  {idx + 1}
                </div>
                <PlayerAvatar name={p.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-ink-300 font-mono mt-0.5">
                    #{p.number} · {p.position} · {p.year}
                  </div>
                </div>
                <RatingBadge rating={p.fvRating} size="md" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <UploadDropzone />
    </div>
  )
}

function UploadDropzone() {
  return (
    <div
      className="border-2 border-dashed border-navy-600 rounded-lg bg-navy-800 hover:bg-navy-700 transition-colors cursor-pointer"
      onClick={() => console.log('upload clicked')}
    >
      <div className="h-[200px] flex flex-col items-center justify-center text-center px-6">
        <Upload
          size={28}
          strokeWidth={1.5}
          className="text-blue-400 mb-3"
        />
        <div className="text-base font-semibold text-white">
          Drag your match film here
        </div>
        <div className="text-sm text-ink-300 mt-1">
          Any quality. Any angle. Processed in 12 minutes.
        </div>
        <div className="text-xs text-ink-500 mt-3 font-mono">
          Supports MP4, MOV, AVI · Up to 4GB
        </div>
      </div>
    </div>
  )
}
