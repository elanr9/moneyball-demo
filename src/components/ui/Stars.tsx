// Star rating used by scout reports. Supports half stars so a 3.5 reads
// exactly. Pure presentation with no interaction.

import { Star, StarHalf } from 'lucide-react'
import clsx from 'clsx'

interface StarsProps {
  value: number // 0 to 5 in half steps
  size?: number
  showValue?: boolean
}

export function Stars({ value, size = 14, showValue }: StarsProps) {
  const full = Math.floor(value)
  const hasHalf = value - full >= 0.5
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center">
        {Array.from({ length: 5 }, (_, i) => {
          if (i < full) {
            return <Star key={i} size={size} className="fill-fv-yellow text-fv-yellow" />
          }
          if (i === full && hasHalf) {
            return <StarHalf key={i} size={size} className="fill-fv-yellow text-fv-yellow" />
          }
          return <Star key={i} size={size} className="text-navy-500" />
        })}
      </span>
      {showValue ? (
        <span className={clsx('font-mono text-xs font-semibold text-ink-100')}>
          {value.toFixed(1)}
        </span>
      ) : null}
    </span>
  )
}
