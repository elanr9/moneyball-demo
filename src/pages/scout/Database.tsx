import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Download, SlidersHorizontal, X } from 'lucide-react'
import { usePlayerData } from '../../context/PlayerDataContext'
import { RatingBadge } from '../../components/ui/RatingBadge'
import type { Player } from '../../types/player'

type GroupId = 'profile' | 'top' | 'attack' | 'duels' | 'defense' | 'fv' | 'rating'

interface ColumnDef {
  key: keyof Player | 'name'
  label: string
  group: GroupId
  align?: 'left' | 'right'
  format?: (p: Player) => string
}

const COLUMNS: ColumnDef[] = [
  { key: 'number', label: '#', group: 'profile' },
  { key: 'name', label: 'Name', group: 'profile' },
  { key: 'position', label: 'Pos', group: 'profile' },
  { key: 'year', label: 'Year', group: 'profile' },
  { key: 'gp', label: 'GP', group: 'profile', align: 'right' },
  { key: 'gs', label: 'GS', group: 'profile', align: 'right' },
  { key: 'minutes', label: 'Min', group: 'profile', align: 'right' },

  { key: 'goals', label: 'G', group: 'top', align: 'right' },
  { key: 'assists', label: 'A', group: 'top', align: 'right' },
  { key: 'xg', label: 'xG', group: 'top', align: 'right', format: (p) => p.xg.toFixed(2) },
  { key: 'xgOt', label: 'xGOT', group: 'top', align: 'right', format: (p) => p.xgOt.toFixed(2) },
  { key: 'xa', label: 'xA', group: 'top', align: 'right', format: (p) => p.xa.toFixed(2) },
  { key: 'shots', label: 'Sh', group: 'top', align: 'right' },
  { key: 'shotsOnTarget', label: 'SoT', group: 'top', align: 'right' },
  { key: 'shotsOffTarget', label: 'OffT', group: 'top', align: 'right' },
  { key: 'blockedShots', label: 'Blk', group: 'top', align: 'right' },
  { key: 'chancesCreated', label: 'CC', group: 'top', align: 'right' },
  { key: 'bigChancesCreated', label: 'BCC', group: 'top', align: 'right' },
  { key: 'defensiveContributions', label: 'DefC', group: 'top', align: 'right' },

  { key: 'touches', label: 'Tch', group: 'attack', align: 'right' },
  { key: 'touchesOppBox', label: 'TchBox', group: 'attack', align: 'right' },
  { key: 'passesFinalThird', label: 'P3rd', group: 'attack', align: 'right' },
  { key: 'corners', label: 'Crn', group: 'attack', align: 'right' },
  { key: 'dispossessed', label: 'Disp', group: 'attack', align: 'right' },

  { key: 'wasFouled', label: 'Fld', group: 'duels', align: 'right' },
  { key: 'foulsCommitted', label: 'FlsC', group: 'duels', align: 'right' },

  { key: 'tackles', label: 'Tkl', group: 'defense', align: 'right' },
  { key: 'interceptions', label: 'Int', group: 'defense', align: 'right' },
  { key: 'recoveries', label: 'Rec', group: 'defense', align: 'right' },
  { key: 'dribbledPast', label: 'DrbP', group: 'defense', align: 'right' },

  { key: 'offBallDistanceKm', label: 'Off km', group: 'fv', align: 'right', format: (p) => p.offBallDistanceKm.toFixed(1) },
  { key: 'sprintDistanceM', label: 'Sprint m', group: 'fv', align: 'right', format: (p) => p.sprintDistanceM.toLocaleString() },
  { key: 'topSpeedKmh', label: 'Top km/h', group: 'fv', align: 'right', format: (p) => p.topSpeedKmh.toFixed(1) },
  { key: 'pressureEvents', label: 'Press', group: 'fv', align: 'right' },
  { key: 'runsCreatingChances', label: 'RunsCC', group: 'fv', align: 'right' },
  { key: 'spaceCreatedPer90', label: 'Space/90', group: 'fv', align: 'right', format: (p) => p.spaceCreatedPer90.toFixed(1) },
  { key: 'progressiveRuns', label: 'ProgR', group: 'fv', align: 'right' },
  { key: 'defensiveActionsPer90', label: 'DefA/90', group: 'fv', align: 'right', format: (p) => p.defensiveActionsPer90.toFixed(1) },

  { key: 'fvRating', label: 'FV', group: 'rating', align: 'right' },
]

const GROUPS: Array<{ id: GroupId; label: string; tone: 'navy' | 'blue' | 'green' | 'rating' }> = [
  { id: 'profile', label: 'Profile', tone: 'navy' },
  { id: 'top', label: 'Top Stats', tone: 'blue' },
  { id: 'attack', label: 'Attack', tone: 'blue' },
  { id: 'duels', label: 'Duels', tone: 'blue' },
  { id: 'defense', label: 'Defense', tone: 'blue' },
  { id: 'fv', label: 'Off Ball · FV Only', tone: 'green' },
  { id: 'rating', label: 'Rating', tone: 'rating' },
]

export function Database() {
  const { players } = usePlayerData()
  const navigate = useNavigate()
  const [hidden, setHidden] = useState<Set<GroupId>>(new Set())
  const [showModal, setShowModal] = useState(false)

  const visibleCols = useMemo(
    () => COLUMNS.filter((c) => !hidden.has(c.group)),
    [hidden],
  )

  const visibleGroups = useMemo(() => {
    const counts = new Map<GroupId, number>()
    for (const c of visibleCols) {
      counts.set(c.group, (counts.get(c.group) ?? 0) + 1)
    }
    return GROUPS.filter((g) => (counts.get(g.id) ?? 0) > 0).map((g) => ({
      ...g,
      span: counts.get(g.id) ?? 0,
    }))
  }, [visibleCols])

  function toggleGroup(id: GroupId) {
    setHidden((h) => {
      const next = new Set(h)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-label text-blue-500 mb-2">Database</div>
          <h1 className="text-3xl font-bold text-white">
            Global Player Database
          </h1>
          <div className="text-sm text-ink-300 mt-1">
            {players.length} players · 38 KPIs per player · 1 league connected
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3 py-2 text-xs uppercase tracking-widest font-semibold bg-navy-800 border border-navy-600 text-ink-100 rounded-md hover:bg-navy-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal size={13} />
            Show / Hide Groups
          </button>
          <button
            type="button"
            onClick={() => console.log('export triggered')}
            className="px-3 py-2 text-xs uppercase tracking-widest font-semibold bg-blue-500 text-navy-900 rounded-md hover:bg-blue-400 transition-colors flex items-center gap-2"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-600 rounded-lg overflow-hidden">
        <div className="overflow-auto scrollbar-thin max-h-[calc(100vh-220px)]">
          <table className="text-xs border-collapse w-max min-w-full">
            <thead className="sticky top-0 z-20">
              <tr>
                {visibleGroups.map((g) => (
                  <th
                    key={g.id}
                    colSpan={g.span}
                    className={clsx(
                      'px-3 py-2 text-[10px] uppercase tracking-widest font-bold border-b border-navy-600 bg-navy-700',
                      g.tone === 'green' && 'text-fv-green border-r-2 border-r-fv-green',
                      g.tone === 'blue' && 'text-blue-500 border-r border-r-navy-600',
                      g.tone === 'navy' && 'text-blue-400 border-r border-r-navy-600',
                      g.tone === 'rating' && 'text-white',
                    )}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-navy-700">
                {visibleCols.map((c, i) => {
                  const isLastInGroup =
                    visibleCols[i + 1]?.group !== c.group
                  const isSticky = c.key === 'number' || c.key === 'name' || c.key === 'position'
                  return (
                    <th
                      key={String(c.key)}
                      className={clsx(
                        'px-3 py-2 text-[10px] uppercase tracking-widest font-semibold text-ink-300 border-b border-navy-600 whitespace-nowrap',
                        c.align === 'right' ? 'text-right' : 'text-left',
                        isLastInGroup && c.group === 'fv' && 'border-r-2 border-r-fv-green',
                        isLastInGroup && c.group !== 'fv' && c.group !== 'rating' && 'border-r border-r-navy-600',
                        isSticky && 'sticky bg-navy-700 z-10',
                        c.key === 'number' && 'left-0',
                        c.key === 'name' && 'left-[42px]',
                        c.key === 'position' && 'left-[200px]',
                      )}
                    >
                      {c.label}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="font-mono">
              {players.map((p) => (
                <tr
                  key={p.slug}
                  onClick={() => navigate(`/player/${p.slug}`)}
                  className="border-t border-navy-700 hover:bg-navy-700 cursor-pointer transition-colors"
                >
                  {visibleCols.map((c, i) => {
                    const isLastInGroup =
                      visibleCols[i + 1]?.group !== c.group
                    const isSticky = c.key === 'number' || c.key === 'name' || c.key === 'position'
                    return (
                      <td
                        key={String(c.key)}
                        className={clsx(
                          'px-3 py-2 whitespace-nowrap text-ink-100',
                          c.align === 'right' ? 'text-right' : 'text-left',
                          isLastInGroup && c.group === 'fv' && 'border-r-2 border-r-fv-green/40',
                          isLastInGroup && c.group !== 'fv' && c.group !== 'rating' && 'border-r border-r-navy-700',
                          c.group === 'fv' && 'text-fv-green',
                          isSticky && 'sticky bg-navy-800 z-[5]',
                          c.key === 'number' && 'left-0 text-ink-300',
                          c.key === 'name' && 'left-[42px] font-sans font-medium text-white',
                          c.key === 'position' && 'left-[200px] text-ink-300',
                        )}
                      >
                        {renderCell(p, c)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal ? (
        <GroupVisibilityModal
          hidden={hidden}
          onToggle={toggleGroup}
          onClose={() => setShowModal(false)}
        />
      ) : null}
    </div>
  )
}

function renderCell(p: Player, c: ColumnDef) {
  if (c.key === 'name') return p.name
  if (c.key === 'fvRating') {
    return (
      <div className="flex justify-end">
        <RatingBadge rating={p.fvRating} size="sm" />
      </div>
    )
  }
  if (c.format) return c.format(p)
  const v = p[c.key as keyof Player]
  if (typeof v === 'number') return v.toLocaleString()
  return String(v ?? '')
}

function GroupVisibilityModal({
  hidden,
  onToggle,
  onClose,
}: {
  hidden: Set<GroupId>
  onToggle: (id: GroupId) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-navy-900/80 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-navy-800 border border-navy-600 rounded-lg w-[420px] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Show / Hide Column Groups
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {GROUPS.map((g) => {
            const isVisible = !hidden.has(g.id)
            return (
              <label
                key={g.id}
                className="flex items-center justify-between px-3 py-2 bg-navy-700 rounded-md cursor-pointer hover:bg-navy-600 transition-colors"
              >
                <span
                  className={clsx(
                    'text-sm font-medium',
                    g.tone === 'green' && 'text-fv-green',
                    g.tone === 'blue' && 'text-blue-400',
                    g.tone === 'navy' && 'text-white',
                    g.tone === 'rating' && 'text-white',
                  )}
                >
                  {g.label}
                </span>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggle(g.id)}
                  className="accent-blue-500 w-4 h-4"
                />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
