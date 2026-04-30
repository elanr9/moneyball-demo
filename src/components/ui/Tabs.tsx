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
    <div className="border-b border-navy-600 flex">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'text-blue-400 border-blue-500'
                : 'text-ink-300 border-transparent hover:text-white',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
