import clsx from 'clsx'

export interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-navy-600">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative px-4 py-3 text-sm font-semibold transition-colors duration-200',
              isActive ? 'text-ink-100' : 'text-ink-300 hover:text-ink-100',
            )}
          >
            {tab.label}
            <span
              className={clsx(
                'absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-all duration-200',
                isActive ? 'bg-team opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
