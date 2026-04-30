import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-navy-600 rounded-lg p-12 text-center bg-navy-800">
      {Icon ? (
        <Icon
          size={32}
          strokeWidth={1.5}
          className="mx-auto mb-4 text-ink-300"
        />
      ) : null}
      <div className="text-base font-semibold text-white mb-2">{title}</div>
      {description ? (
        <div className="text-sm text-ink-300 max-w-md mx-auto">
          {description}
        </div>
      ) : null}
    </div>
  )
}
