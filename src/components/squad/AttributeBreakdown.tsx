// FIFA-style attribute details panel. Renders the six headline categories as
// columns, each with a coloured ring and a list of sub attributes drawn as
// progress bars. Data is derived in data/attributeDetails.ts.

import { attributeCategories, attributeColor } from '../../data/attributeDetails'
import type { Player } from '../../data/types'

export function AttributeBreakdown({ player }: { player: Player }) {
  const categories = attributeCategories(player)
  if (!categories.length) return null

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <div key={cat.short}>
          <div className="mb-3 flex items-center gap-3 border-b border-navy-600 pb-3">
            <CategoryRing value={cat.value} />
            <div>
              <div className="text-sm font-semibold uppercase tracking-widest text-ink-100">
                {cat.label}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-ink-300">{cat.short}</div>
            </div>
          </div>
          <div className="space-y-2.5">
            {cat.stats.map((stat) => (
              <StatBar key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CategoryRing({ value }: { value: number }) {
  const color = attributeColor(value)
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full border-2"
      style={{ borderColor: color }}
    >
      <span className="font-mono text-base font-bold leading-none" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

function StatBar({ label, value }: { label: string; value: number }) {
  const color = attributeColor(value)
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 truncate text-xs text-ink-100">{label}</span>
      <span className="w-6 text-right font-mono text-xs font-semibold text-ink-100">{value}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-600">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
