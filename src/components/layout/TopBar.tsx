import { Search as SearchIcon, Bell } from 'lucide-react'
import { useMode } from '../../context/ModeContext'

export function TopBar() {
  const { mode } = useMode()
  return (
    <header className="h-14 bg-navy-800 border-b border-navy-600 flex items-center px-6 gap-4">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            type="text"
            placeholder={
              mode === 'coach'
                ? 'Search players, games, or stats'
                : 'Search the global database'
            }
            className="w-full bg-navy-900 border border-navy-600 rounded-md pl-9 pr-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-ink-300 font-mono">
          NCAA D-III · 2025 Season
        </div>
        <button
          type="button"
          className="w-9 h-9 rounded-md bg-navy-900 border border-navy-600 flex items-center justify-center text-ink-300 hover:text-white transition-colors"
        >
          <Bell size={15} strokeWidth={1.75} />
        </button>
        <div className="w-9 h-9 rounded-full bg-navy-700 border border-blue-500 text-blue-400 flex items-center justify-center text-xs font-semibold">
          ER
        </div>
      </div>
    </header>
  )
}
