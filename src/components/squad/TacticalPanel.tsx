// Tactical insight visuals for the squad view. Three readouts stacked into one
// rail: the shape's playing idea with strength chips, the formation tactical
// fingerprint (attack, midfield, defence, width) and the FIFA style squad
// attribute averages drawn from the starting eleven.

import type { Player } from '../../data/types'
import type { Formation } from './formations'
import {
  FORMATION_AXES,
  FORMATION_AXIS_KEYS,
  SQUAD_ATTRIBUTE_KEYS,
  squadAttributes,
} from './tactics'

interface TacticalPanelProps {
  formation: Formation
  starters: Player[]
  accent?: string
}

export function TacticalPanel({
  formation,
  starters,
  accent = '#3B82F6',
}: TacticalPanelProps) {
  const axes = FORMATION_AXES[formation.name]
  const attrs = squadAttributes(starters)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-5">
        <div className="section-label mb-3 text-blue-500">How they play</div>
        <p className="text-sm leading-relaxed text-ink-100">{formation.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {formation.strengths.map((strength) => (
            <span
              key={strength}
              className="rounded-full border border-navy-600 bg-navy-900 px-3 py-1 text-[11px] font-semibold text-ink-100"
            >
              {strength}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-5">
        <div className="section-label mb-4 text-blue-500">Tactical balance</div>
        <div className="space-y-3">
          {FORMATION_AXIS_KEYS.map(({ key, label }) => (
            <Bar key={key} label={label} value={axes[key]} max={100} accent={accent} />
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-ink-300">
          Balance is read from where the shape sits players on the pitch and
          compared across every formation.
        </p>
      </section>

      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-5">
        <div className="section-label mb-1 text-blue-500">Squad attributes</div>
        <p className="mb-4 text-[11px] text-ink-300">
          Starting eleven averages from the outfield players.
        </p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          {SQUAD_ATTRIBUTE_KEYS.map(({ key, label }) => (
            <Bar key={key} label={label} value={attrs[key]} max={99} accent={accent} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Bar({
  label,
  value,
  max,
  accent,
}: {
  label: string
  value: number
  max: number
  accent: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">
          {label}
        </span>
        <span className="font-mono text-xs font-bold text-ink-100">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-900">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  )
}
