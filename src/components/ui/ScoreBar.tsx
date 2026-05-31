// A compact 0 to 10 score with a colored fill bar. This is the house style for
// every game model number across the product: role fit, skill index and
// physical index all render the same way so a coach learns to read one thing.

import clsx from 'clsx'

interface ScoreBarProps {
  value: number // 0 to 10
  label?: string
  width?: 'sm' | 'md'
  accent?: boolean // use the green FieldVision accent instead of the value scale
}

function toneFor(value: number): string {
  if (value >= 8) return 'bg-fv-green'
  if (value >= 6.5) return 'bg-blue-500'
  if (value >= 5) return 'bg-fv-yellow'
  return 'bg-fv-red'
}

export function ScoreBar({ value, label, width = 'md', accent }: ScoreBarProps) {
  const pct = Math.max(4, Math.min(100, value * 10))
  const tone = accent ? 'bg-fv-green' : toneFor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-ink-100">
        {value.toFixed(1)}
      </span>
      <div
        className={clsx(
          'h-1.5 overflow-hidden rounded-full bg-navy-600',
          width === 'sm' ? 'w-16' : 'w-full min-w-[80px]',
        )}
      >
        <div className={clsx('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
      {label ? (
        <span className="shrink-0 text-[10px] uppercase tracking-widest text-ink-300">{label}</span>
      ) : null}
    </div>
  )
}
