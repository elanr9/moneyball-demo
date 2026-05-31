// Replacement suggestions for a target player. Lists the closest profiles from
// the same position group with a clear similarity score and the reasons behind
// it, so a scout can immediately understand why each name showed up.

import { useMemo } from 'react'
import { X } from 'lucide-react'
import type { Player, Team } from '../../data/types'
import { similarPlayers } from './similar'

interface SimilarModalProps {
  target: Player
  players: Player[]
  teams: Team[]
  onView: (player: Player) => void
  onClose: () => void
}

export function SimilarModal({
  target,
  players,
  teams,
  onView,
  onClose,
}: SimilarModalProps) {
  const teamName = useMemo(() => {
    const map = new Map(teams.map((t) => [t.id, t.shortName]))
    return (teamId: string) => map.get(teamId) ?? teamId
  }, [teams])

  const suggestions = useMemo(
    () => similarPlayers(target, players),
    [target, players],
  )

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
            <div className="section-label text-blue-500">Replacement Targets</div>
            <div className="mt-1 text-sm text-ink-300">
              Similar to {target.name} · {target.primaryPosition} · {target.overall} overall
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

        <div className="scrollbar-thin flex-1 overflow-auto">
          {suggestions.map((s) => (
            <button
              key={s.player.id}
              type="button"
              onClick={() => onView(s.player)}
              className="flex w-full items-center gap-3 border-t border-navy-700 px-5 py-3 text-left transition-colors hover:bg-navy-700"
            >
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded bg-navy-900 font-mono leading-none">
                <span className="text-sm font-bold text-fv-green">{s.score}</span>
                <span className="text-[8px] uppercase tracking-wide text-ink-300">
                  match
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold text-ink-100">
                    {s.player.name}
                  </span>
                  <span className="font-mono text-xs text-ink-300">
                    {s.player.overall}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-ink-300">
                  {teamName(s.player.teamId)} · {s.player.primaryPosition} ·{' '}
                  {s.reasons[s.reasons.length - 1]}
                </div>
              </div>
            </button>
          ))}
          {suggestions.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-300">
              No similar players found in this position group.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
