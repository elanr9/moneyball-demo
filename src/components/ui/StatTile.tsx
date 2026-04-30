import clsx from 'clsx'

export type StatTileVariant = 'default' | 'fv-only' | 'good' | 'bad'

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
        'rounded-md p-4 border transition-colors',
        variant === 'default' && 'bg-navy-700 border-navy-600',
        variant === 'fv-only' &&
          'bg-fv-greenLight border-fv-green border-l-2',
        variant === 'good' && 'bg-navy-700 border-l-2 border-fv-green',
        variant === 'bad' && 'bg-navy-700 border-l-2 border-fv-red',
      )}
    >
      <div
        className={clsx(
          'text-xs uppercase tracking-widest mb-2',
          variant === 'fv-only' ? 'text-fv-green' : 'text-ink-300',
        )}
      >
        {label}
      </div>
      <div className="font-mono text-2xl font-bold text-white leading-none">
        {value}
      </div>
      {sublabel ? (
        <div className="mt-1.5 text-xs text-ink-300 font-mono">{sublabel}</div>
      ) : null}
    </div>
  )
}
