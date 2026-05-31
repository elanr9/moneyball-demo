// A single search result rendered as one cohesive scouting card. Everything the
// scout needs lives in a single light surface: the overall rating, position,
// club, the player initials, the six core attributes, the active sort metric,
// the reasons the player matched the filters, a compare toggle and a similar
// action.

import clsx from 'clsx'
import { Check, Plus, Sparkles } from 'lucide-react'
import type { Player, Team } from '../../data/types'
import { getInitials } from '../../lib/statHelpers'
import { teamLogoUrl } from '../../data/playerMedia'
import type { MatchReason } from './filters'

interface ResultCardProps {
  player: Player
  team?: Team
  reasons: MatchReason[]
  metricLabel: string
  metricValue: string
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  onSimilar: () => void
}

type Tier = 'gold' | 'silver' | 'bronze'

function tierOf(overall: number): Tier {
  if (overall >= 80) return 'gold'
  if (overall >= 70) return 'silver'
  return 'bronze'
}

const TIER_BADGE: Record<Tier, string> = {
  gold: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  silver: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  bronze: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950',
}

interface AttrCell {
  label: string
  value: number
}

function cardAttributes(player: Player): AttrCell[] {
  const a = player.attributes
  if (a) {
    return [
      { label: 'PAC', value: a.pace },
      { label: 'SHO', value: a.shooting },
      { label: 'PAS', value: a.passing },
      { label: 'DRI', value: a.dribbling },
      { label: 'DEF', value: a.defending },
      { label: 'PHY', value: a.physical },
    ]
  }
  const g = player.gkAttributes
  if (g) {
    return [
      { label: 'DIV', value: g.diving },
      { label: 'HAN', value: g.handling },
      { label: 'KIC', value: g.kicking },
      { label: 'REF', value: g.reflexes },
      { label: 'SPD', value: g.speed },
      { label: 'POS', value: g.positioning },
    ]
  }
  return []
}

function attrColor(value: number): string {
  if (value >= 80) return 'text-fv-green'
  if (value >= 70) return 'text-blue-500'
  if (value >= 60) return 'text-ink-100'
  return 'text-ink-300'
}

function barColor(value: number): string {
  if (value >= 80) return 'bg-fv-green'
  if (value >= 70) return 'bg-blue-500'
  if (value >= 60) return 'bg-ink-500'
  return 'bg-navy-500'
}

function Headshot({ player, accent }: { player: Player; accent: string }) {
  return (
    <div
      className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-navy-700 text-lg font-bold text-ink-300"
      style={{ boxShadow: `0 0 0 3px #FFFFFF, 0 0 0 5px ${accent}` }}
    >
      {getInitials(player.name)}
    </div>
  )
}

export function ResultCard({
  player,
  team,
  reasons,
  metricLabel,
  metricValue,
  selected,
  onToggleSelect,
  onOpen,
  onSimilar,
}: ResultCardProps) {
  const tier = tierOf(player.overall)
  const accent = team?.primaryColor ?? '#2563EB'
  const logo = teamLogoUrl(team)
  const attributes = cardAttributes(player)
  const showMetric = metricLabel.toLowerCase() !== 'overall'

  const subtitleParts = [
    team?.shortName ?? player.teamId,
    `#${player.number}`,
    player.heightLabel,
  ].filter(Boolean)

  return (
    <div
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-navy-800 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float',
        selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-navy-600',
      )}
    >
      <span className="h-1 w-full shrink-0" style={{ backgroundColor: accent }} />

      <button
        type="button"
        onClick={onToggleSelect}
        title={selected ? 'Remove from compare' : 'Add to compare'}
        className={clsx(
          'absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-colors',
          selected
            ? 'border-blue-500 bg-blue-500 text-white'
            : 'border-navy-600 bg-navy-800 text-ink-300 hover:border-blue-500 hover:text-blue-500',
        )}
      >
        {selected ? <Check size={14} /> : <Plus size={14} />}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col items-center px-4 pb-3 pt-4 text-center"
      >
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1">
            <span
              className={clsx(
                'flex h-11 w-11 items-center justify-center rounded-xl text-xl font-extrabold tabular-nums shadow-sm',
                TIER_BADGE[tier],
              )}
            >
              {player.overall}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: accent }}
            >
              {player.primaryPosition}
            </span>
          </div>

          {logo ? (
            <img
              src={logo}
              alt={team?.shortName ?? ''}
              className="mr-8 h-7 w-7 object-contain"
            />
          ) : null}
        </div>

        <div className="-mt-7">
          <Headshot player={player} accent={accent} />
        </div>

        <div className="mt-2.5 w-full truncate text-base font-bold text-ink-100" title={player.name}>
          {player.name}
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-300">
          {subtitleParts.join('  ·  ')}
        </div>
      </button>

      <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-navy-600 px-4 py-3">
        {attributes.map((attr) => (
          <div key={attr.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-500">
                {attr.label}
              </span>
              <span className={clsx('text-sm font-bold tabular-nums', attrColor(attr.value))}>
                {attr.value}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-navy-700">
              <span
                className={clsx('block h-full rounded-full', barColor(attr.value))}
                style={{ width: `${Math.min(100, attr.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {showMetric ? (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-blue-500/10 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-500">
            {metricLabel}
          </span>
          <span className="text-sm font-bold tabular-nums text-blue-500">{metricValue}</span>
        </div>
      ) : null}

      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {reasons.slice(0, 3).map((r, i) => (
            <span
              key={`${r.label}-${i}`}
              className="rounded-md bg-navy-700 px-2 py-0.5 text-[10px] font-semibold text-ink-300"
            >
              {r.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto px-4 pb-4">
        <button
          type="button"
          onClick={onSimilar}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-navy-600 py-2 text-[11px] font-bold uppercase tracking-widest text-ink-300 transition-colors hover:border-blue-500 hover:text-blue-500"
        >
          <Sparkles size={13} />
          Similar Players
        </button>
      </div>
    </div>
  )
}
