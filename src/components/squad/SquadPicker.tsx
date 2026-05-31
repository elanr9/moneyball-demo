// Modal for swapping a player into a formation slot. Lists the whole squad,
// best fit first, with a tag showing how well each player suits the slot. The
// player already in the slot is marked, and players in the rest of the XI are
// flagged so the coach knows a pick will swap them out.

import { useMemo, useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import clsx from 'clsx'
import type { Player, Team } from '../../data/types'
import type { FormationSlot } from './formations'
import type { Lineup } from './lineup'
import { fitTier } from './lineup'
import type { FitTier } from './lineup'

interface SquadPickerProps {
  slot: FormationSlot
  squad: Player[]
  lineup: Lineup
  team?: Team
  onSelect: (playerId: string) => void
  onClose: () => void
}

const FIT_LABEL: Record<FitTier, string> = {
  natural: 'Natural',
  position: 'Can play',
  group: 'Out of position',
  out: 'Emergency',
}

const FIT_STYLE: Record<FitTier, string> = {
  natural: 'bg-fv-green text-ink-900',
  position: 'bg-blue-500 text-white',
  group: 'bg-fv-yellow text-ink-900',
  out: 'bg-fv-red text-ink-900',
}

export function SquadPicker({
  slot,
  squad,
  lineup,
  team,
  onSelect,
  onClose,
}: SquadPickerProps) {
  const [query, setQuery] = useState('')

  const currentId = lineup[slot.id]
  const inXi = useMemo(() => new Set(Object.values(lineup)), [lineup])

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...squad]
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const tierRank: Record<FitTier, number> = {
          natural: 0,
          position: 1,
          group: 2,
          out: 3,
        }
        const ta = tierRank[fitTier(a, slot.pos)]
        const tb = tierRank[fitTier(b, slot.pos)]
        if (ta !== tb) return ta - tb
        return b.overall - a.overall
      })
  }, [squad, query, slot.pos])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-navy-600 px-5 py-4">
          <div>
            <div className="section-label text-blue-500">Choose a player</div>
            <div className="mt-1 text-sm text-ink-300">
              Filling the {slot.pos} slot
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-300 transition-colors hover:text-ink-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-navy-600 px-5 py-3">
          <div className="relative">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <input
              type="text"
              autoFocus
              placeholder="Search the squad"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-navy-600 bg-navy-900 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-auto">
          {ranked.map((player) => {
            const tier = fitTier(player, slot.pos)
            const isCurrent = player.id === currentId
            const isStarter = inXi.has(player.id) && !isCurrent
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelect(player.id)}
                className={clsx(
                  'flex w-full items-center gap-3 border-t border-navy-700 px-5 py-3 text-left transition-colors hover:bg-navy-700',
                  isCurrent && 'bg-navy-700',
                )}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded font-mono text-sm font-bold text-white"
                  style={{ backgroundColor: team?.primaryColor ?? '#2563EB' }}
                >
                  {player.overall}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-100">
                    {player.name}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-ink-300">
                    #{player.number} · {player.primaryPosition}
                    {isCurrent ? ' · In this slot' : ''}
                    {isStarter ? ' · In the XI' : ''}
                  </div>
                </div>
                <span
                  className={clsx(
                    'shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    FIT_STYLE[tier],
                  )}
                >
                  {FIT_LABEL[tier]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
