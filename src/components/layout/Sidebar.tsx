import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  Home,
  Users,
  Trophy,
  Upload,
  Search,
  Database,
  Award,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMode } from '../../context/ModeContext'
import { ModeToggle } from './ModeToggle'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const COACH_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/roster', label: 'Roster', icon: Users },
  { to: '/games', label: 'Games', icon: Trophy },
  { to: '/dashboard?upload=1', label: 'Upload Game', icon: Upload },
]

const SCOUT_ITEMS: NavItem[] = [
  { to: '/search', label: 'Search', icon: Search },
  { to: '/database', label: 'Database', icon: Database },
  { to: '/leaderboard', label: 'Leaderboard', icon: Award },
]

function NavItemRow({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-2 transition-colors',
          isActive
            ? 'bg-navy-700 text-blue-400 border-blue-500'
            : 'text-ink-100 border-transparent hover:bg-navy-700 hover:text-white',
        )
      }
    >
      <Icon size={16} strokeWidth={1.75} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { mode } = useMode()
  const items = mode === 'coach' ? COACH_ITEMS : SCOUT_ITEMS
  const sectionLabel = mode === 'coach' ? 'Coach' : 'Scout'

  return (
    <aside className="w-[260px] shrink-0 bg-navy-800 border-r border-navy-600 flex flex-col">
      <div className="px-5 py-4 border-b border-navy-600">
        <div className="flex items-center gap-2.5">
          <img
            src="/fieldvision-logo.png"
            alt="FieldVision"
            className="w-9 h-9 rounded bg-white p-0.5 object-contain"
          />
          <div>
            <div className="text-sm font-semibold leading-tight">
              <span className="text-blue-400">FieldVision</span>{' '}
              <span className="text-white">AI</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-blue-300">
              AI Moneyball
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-navy-600">
        <ModeToggle />
      </div>

      <nav className="flex-1 py-4">
        <div className="px-5 mb-2 text-[10px] uppercase tracking-widest text-ink-300">
          {sectionLabel}
        </div>
        <div className="flex flex-col">
          {items.map((item) => (
            <NavItemRow key={item.to} item={item} />
          ))}
        </div>
      </nav>

      <div className="border-t border-navy-600 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-navy-700 border border-blue-500 text-blue-400 flex items-center justify-center text-xs font-semibold">
          ER
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Elan Romo</div>
          <div className="text-[11px] text-ink-300">Brandeis MS</div>
        </div>
      </div>
    </aside>
  )
}
