// Standard page scaffolding for the whole product. PageShell sets the max width,
// padding and a subtle entry animation; PageHeader gives every page the same
// confident title block with an optional eyebrow, lead visual and right side
// actions. Centralizing this keeps every screen on the same rhythm so a new
// engineer only fills in content, never re-invents the header.

import type { ReactNode } from 'react'
import clsx from 'clsx'

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'mx-auto max-w-[1400px] animate-fade-rise space-y-7 px-8 pb-20 pt-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  lead,
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  lead?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex items-center gap-4">
        {lead}
        <div>
          {eyebrow ? (
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-team">
              <span className="h-3 w-1 rounded-full bg-team" />
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-[2.1rem] font-bold leading-none tracking-tight text-ink-100">
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-2 text-sm text-ink-300">{subtitle}</div>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  )
}
