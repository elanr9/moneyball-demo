// Renders a team's recent form as a row of small W / D / L pills, most recent
// last, exactly like the FotMob table.

import clsx from 'clsx'
import type { MatchOutcome } from './league'

const TONE: Record<MatchOutcome, string> = {
  W: 'bg-fv-green text-ink-900',
  D: 'bg-navy-600 text-ink-100',
  L: 'bg-fv-red text-ink-900',
}

interface FormPillsProps {
  form: MatchOutcome[]
  size?: 'sm' | 'md'
}

export function FormPills({ form, size = 'sm' }: FormPillsProps) {
  if (!form.length) {
    return <span className="text-xs text-ink-500">No games</span>
  }
  return (
    <div className="flex items-center gap-1">
      {form.map((result, i) => (
        <span
          key={`${result}-${i}`}
          className={clsx(
            'inline-flex items-center justify-center rounded font-bold',
            size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs',
            TONE[result],
          )}
        >
          {result}
        </span>
      ))}
    </div>
  )
}
