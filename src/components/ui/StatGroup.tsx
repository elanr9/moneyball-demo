import clsx from 'clsx'
import type { ReactNode } from 'react'

interface StatGroupProps {
  title: string
  tone?: 'navy' | 'blue' | 'green'
  children: ReactNode
  footer?: ReactNode
}

export function StatGroup({
  title,
  tone = 'blue',
  children,
  footer,
}: StatGroupProps) {
  return (
    <section className="bg-navy-800 rounded-lg border border-navy-600 p-6">
      <div className="flex items-center gap-2 mb-4">
        {tone === 'green' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-fv-green" />
        ) : null}
        <h3
          className={clsx(
            'section-label',
            tone === 'navy' && 'text-blue-400',
            tone === 'blue' && 'text-blue-500',
            tone === 'green' && 'text-fv-green',
          )}
        >
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-3">{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  )
}
