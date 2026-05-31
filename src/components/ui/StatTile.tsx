import clsx from 'clsx'

export type StatTileVariant = 'default' | 'good' | 'bad'

interface StatTileProps {
  label: string
  value: string | number
  sublabel?: string
  variant?: StatTileVariant
}

export function StatTile({
  label,
  value,
  sublabel,
  variant = 'default',
}: StatTileProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-colors',
        variant === 'default' && 'border-navy-600 bg-navy-700/60',
        variant === 'good' && 'border-navy-600 border-l-2 border-l-fv-green bg-navy-700/60',
        variant === 'bad' && 'border-navy-600 border-l-2 border-l-fv-red bg-navy-700/60',
      )}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </div>
      <div className="font-mono text-2xl font-bold leading-none text-ink-100 nums">
        {value}
      </div>
      {sublabel ? (
        <div className="mt-1.5 font-mono text-[11px] text-ink-300">{sublabel}</div>
      ) : null}
    </div>
  )
}
