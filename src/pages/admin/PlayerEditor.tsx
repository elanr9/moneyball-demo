// Internal Player Editor reachable at /admin. Lets us tweak every featured
// team player's primary position and overall rating live, then copy the
// result back into playerOverrides.ts so the changes become permanent.
//
// Single page, single file, no nav entry. Safe to delete in one step along
// with the /admin route in App.tsx and src/data/devOverrides.ts.

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Copy, RotateCcw, Trash2, Check } from 'lucide-react'
import { PageHeader, PageShell } from '../../components/layout/PageHeader'
import { TeamCrest } from '../../components/league/TeamCrest'
import { useUniverse } from '../../context/UniverseContext'
import { FEATURED_TEAMS } from '../../data/rosters'
import type { DetailedPosition, Player } from '../../data/types'
import {
  clearDevOverrides,
  readDevOverrides,
  setDevOverride,
  subscribeDevOverrides,
  type DevOverrides,
} from '../../data/devOverrides'

const POSITIONS: DetailedPosition[] = [
  'GK',
  'CB',
  'LB',
  'RB',
  'LWB',
  'RWB',
  'CDM',
  'CM',
  'CAM',
  'LM',
  'RM',
  'LW',
  'RW',
  'CF',
  'ST',
]

const MIN_RATING = 1
const MAX_RATING = 99

function jerseySort(a: string, b: string): number {
  const na = Number(a)
  const nb = Number(b)
  const aNum = Number.isFinite(na)
  const bNum = Number.isFinite(nb)
  if (aNum && bNum) return na - nb
  if (aNum) return -1
  if (bNum) return 1
  return a.localeCompare(b)
}

// Dumps every featured team player with their CURRENT effective position and
// overall rating, exactly as they appear in the editor. We always emit both
// fields so the resulting file is a complete snapshot and there is no
// dependence on the auto generated defaults once the code is pasted back into
// playerOverrides.ts.
function formatAsCode(
  overrides: DevOverrides,
  playerIndex: Map<string, Map<string, Player>>,
): string {
  const lines: string[] = []
  lines.push('export const PLAYER_OVERRIDES: Record<string, Record<string, PlayerOverride>> = {')
  FEATURED_TEAMS.forEach((src) => {
    const teamId = src.meta.id
    lines.push(`  ${teamId}: {`)
    src.rows.forEach((row) => {
      const number = row[0]
      const name = row[1]
      const player = playerIndex.get(teamId)?.get(number)
      const entry = overrides[teamId]?.[number]
      const position = entry?.position ?? player?.primaryPosition
      const rating = entry?.rating ?? player?.overall
      const parts: string[] = []
      if (position) parts.push(`position: '${position}'`)
      if (typeof rating === 'number') parts.push(`rating: ${rating}`)
      const body = parts.length > 0 ? ` ${parts.join(', ')} ` : ''
      lines.push(`    '${number}': {${body}}, // ${name}`)
    })
    lines.push('  },')
  })
  lines.push('}')
  return lines.join('\n')
}

interface RowProps {
  player: Player
  rosterPositionLabel: string
  override: { position?: DetailedPosition; rating?: number } | undefined
}

function PlayerRow({ player, rosterPositionLabel, override }: RowProps) {
  const currentPosition = override?.position ?? player.primaryPosition
  const currentRating = override?.rating ?? player.overall
  const isEdited = Boolean(override?.position) || typeof override?.rating === 'number'

  // Local draft string for the rating input so the user can freely edit (clear,
  // type any digits) without the value being clamped on every keystroke. The
  // committed override only updates on blur or Enter.
  const [ratingDraft, setRatingDraft] = useState<string>(String(currentRating))

  useEffect(() => {
    setRatingDraft(String(currentRating))
  }, [currentRating])

  const commitRating = () => {
    const trimmed = ratingDraft.trim()
    if (trimmed === '') {
      setRatingDraft(String(currentRating))
      return
    }
    const value = Number(trimmed)
    if (!Number.isFinite(value)) {
      setRatingDraft(String(currentRating))
      return
    }
    const clamped = Math.max(MIN_RATING, Math.min(MAX_RATING, Math.round(value)))
    setRatingDraft(String(clamped))
    if (clamped !== currentRating) {
      setDevOverride(player.teamId, player.number, { rating: clamped })
    }
  }

  return (
    <tr
      className={clsx(
        'border-t border-navy-700/60 transition-colors',
        isEdited ? 'bg-team-soft' : 'hover:bg-navy-700/30',
      )}
    >
      <td className="px-4 py-3 text-sm font-semibold text-ink-300">
        <span className="inline-flex h-7 w-9 items-center justify-center rounded-md bg-navy-900 ring-1 ring-navy-600">
          {player.number}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-ink-100">{player.name}</td>
      <td className="px-4 py-3 text-xs uppercase tracking-wider text-ink-300">
        {rosterPositionLabel}
      </td>
      <td className="px-4 py-3">
        <select
          value={currentPosition}
          onChange={(e) => {
            const next = e.target.value as DetailedPosition
            setDevOverride(player.teamId, player.number, { position: next })
          }}
          className="w-24 rounded-md border border-navy-600 bg-navy-900 px-2 py-1.5 text-sm font-semibold text-ink-100 focus:border-team focus:outline-none"
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          value={ratingDraft}
          onChange={(e) => {
            const next = e.target.value.replace(/[^0-9]/g, '')
            setRatingDraft(next)
          }}
          onFocus={(e) => e.target.select()}
          onBlur={commitRating}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitRating()
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') {
              setRatingDraft(String(currentRating))
              e.currentTarget.blur()
            }
          }}
          className="w-20 rounded-md border border-navy-600 bg-navy-900 px-2 py-1.5 text-center text-sm font-bold tabular-nums text-ink-100 focus:border-team focus:outline-none"
        />
      </td>
      <td className="px-4 py-3 text-right">
        {isEdited ? (
          <button
            type="button"
            onClick={() => {
              setDevOverride(player.teamId, player.number, {
                position: undefined,
                rating: undefined,
              })
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs font-semibold text-ink-300 hover:text-ink-100"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        ) : (
          <span className="text-xs text-ink-500">Default</span>
        )}
      </td>
    </tr>
  )
}

export function PlayerEditor() {
  const { universe } = useUniverse()
  const [overrides, setOverrides] = useState<DevOverrides>(() => readDevOverrides())
  const [copied, setCopied] = useState(false)

  useEffect(() => subscribeDevOverrides(() => setOverrides(readDevOverrides())), [])

  // Index players by team and jersey for quick rendering.
  const playerIndex = useMemo(() => {
    const map = new Map<string, Map<string, Player>>()
    universe.players.forEach((p) => {
      if (!map.has(p.teamId)) map.set(p.teamId, new Map())
      map.get(p.teamId)!.set(p.number, p)
    })
    return map
  }, [universe.players])

  const editedCount = useMemo(() => {
    let n = 0
    Object.values(overrides).forEach((team) => {
      Object.values(team).forEach((entry) => {
        if (entry?.position || typeof entry?.rating === 'number') n += 1
      })
    })
    return n
  }, [overrides])

  const handleCopy = async () => {
    const code = formatAsCode(overrides, playerIndex)
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copy the code below', code)
    }
  }

  const handleReset = () => {
    if (window.confirm('Clear every override and revert to file values?')) {
      clearDevOverrides()
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Internal tool"
        title="Player Editor"
        subtitle="Tune every featured team player's position and overall. Edits apply live across the app and persist in this browser."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-md border border-navy-600 bg-navy-800 px-3 py-2 text-xs font-semibold text-ink-300 md:flex">
              <span className="text-ink-100">{editedCount}</span>
              <span>edited</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={editedCount === 0}
              className="inline-flex items-center gap-2 rounded-md border border-navy-600 bg-navy-800 px-3 py-2 text-sm font-semibold text-ink-300 transition-colors hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              Reset all
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-md border border-team bg-team px-3 py-2 text-sm font-semibold text-ink-900 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy as code'}
            </button>
          </div>
        }
      />

      <div className="rounded-xl border border-navy-600 bg-navy-800/60 p-4 text-sm text-ink-300">
        <p className="leading-relaxed">
          Pick a new position or type a new overall rating. Changes save instantly
          and flow through Squad, Roster, Player profiles, the League table and
          everywhere else. When you are happy, click <span className="font-semibold text-ink-100">Copy as code</span> and replace the <span className="font-mono text-ink-100">PLAYER_OVERRIDES</span> object in <span className="font-mono text-ink-100">src/data/playerOverrides.ts</span>. The copy is a full snapshot of what you see, so every player gets both a position and a rating locked in.
        </p>
      </div>

      <div className="space-y-6">
        {FEATURED_TEAMS.map((src) => {
          const team = src.meta
          const teamMap = playerIndex.get(team.id)
          if (!teamMap) return null

          const rows = [...src.rows].sort((a, b) => jerseySort(a[0], b[0]))

          return (
            <section
              key={team.id}
              className="overflow-hidden rounded-xl border border-navy-600 bg-navy-800/60 shadow-card"
            >
              <header className="flex items-center gap-3 border-b border-navy-700 px-5 py-4">
                <TeamCrest team={team} size="md" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-ink-300">
                    {team.conference}
                  </div>
                  <div className="text-base font-bold text-ink-100">{team.name}</div>
                </div>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-widest text-ink-500">
                      <th className="px-4 py-2 font-semibold">#</th>
                      <th className="px-4 py-2 font-semibold">Player</th>
                      <th className="px-4 py-2 font-semibold">Roster pos</th>
                      <th className="px-4 py-2 font-semibold">Position</th>
                      <th className="px-4 py-2 font-semibold">Overall</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const number = row[0]
                      const rosterPositionLabel = row[2]
                      const player = teamMap.get(number)
                      if (!player) return null
                      const override = overrides[team.id]?.[number]
                      return (
                        <PlayerRow
                          key={`${team.id}:${number}`}
                          player={player}
                          rosterPositionLabel={rosterPositionLabel}
                          override={override}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    </PageShell>
  )
}
