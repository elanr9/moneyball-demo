import clsx from 'clsx'
import { getRatingColor } from '../../lib/statHelpers'

interface RatingBadgeProps {
  rating: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_STYLES: Record<NonNullable<RatingBadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5 min-w-[36px]',
  md: 'text-sm px-2.5 py-1 min-w-[44px]',
  lg: 'text-base px-3 py-1.5 min-w-[52px]',
  xl: 'w-[130px] h-[130px] flex flex-col items-center justify-center text-4xl',
}

const TONE_STYLES: Record<string, string> = {
  green: 'bg-fv-green text-ink-900',
  yellow: 'bg-fv-yellow text-ink-900',
  white: 'bg-navy-700 text-ink-100 border border-navy-600',
  red: 'bg-fv-red text-ink-900',
}

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const tone = getRatingColor(rating)
  const formatted = rating.toFixed(1)

  if (size === 'xl') {
    return (
      <div
        className={clsx(
          'rounded-full font-mono font-bold',
          SIZE_STYLES.xl,
          TONE_STYLES[tone],
        )}
      >
        <div className="leading-none">{formatted}</div>
        <div className="text-[10px] tracking-widest uppercase mt-2 opacity-80">
          FV Rating
        </div>
      </div>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded font-mono font-bold tabular-nums',
        SIZE_STYLES[size],
        TONE_STYLES[tone],
      )}
    >
      {formatted}
    </span>
  )
}
