// Single premium navigation bar for the whole product. It replaces the old
// sidebar plus top bar split with one clean horizontal header: brand on the
// left, the primary destinations in the middle, and the season context and
// the user on the right.

import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  Home,
  LayoutGrid,
  Search,
  Globe2,
  CalendarRange,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUniverse } from '../../context/UniverseContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/squad', label: 'Squad', icon: LayoutGrid },
  { to: '/strategy', label: 'Strategy', icon: CalendarRange },
  { to: '/development', label: 'Development', icon: TrendingUp },
  { to: '/market', label: 'Transfer Market', icon: Search },
  { to: '/roles', label: 'Player Finder', icon: Sparkles },
  { to: '/league', label: 'League', icon: Globe2 },
]

function NavTab({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200',
          isActive
            ? 'text-ink-100'
            : 'text-ink-300 hover:text-ink-100',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute inset-0 rounded-lg bg-navy-700 ring-1 ring-navy-600" />
          ) : (
            <span className="absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:bg-navy-700/60 group-hover:opacity-100" />
          )}
          <Icon
            size={16}
            strokeWidth={2.2}
            className={clsx('relative', isActive && 'text-team')}
          />
          <span className="relative">{item.label}</span>
          {isActive ? (
            <span className="absolute -bottom-[9px] left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-team" />
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export function TopNav() {
  const { universe } = useUniverse()

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-navy-600 bg-navy-900/80 backdrop-blur-xl">
      <div className="flex h-full w-full items-center gap-7 px-6">
        <div className="flex items-center gap-2.5" data-tour="nav-brand">
          <img
            src="/fieldvision-logo.png"
            alt="FieldVision"
            className="h-9 w-9 rounded-lg object-contain ring-1 ring-navy-600"
          />
          <div className="text-[15px] font-bold tracking-tight">
            <span className="text-ink-100">FieldVision</span>
            <span className="text-team"> AI</span>
          </div>
        </div>

        <nav className="flex items-center gap-1" data-tour="nav-links">
          {NAV_ITEMS.map((item) => (
            <NavTab key={item.to} item={item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-navy-600 bg-navy-800/60 px-3 py-1.5 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-fv-green opacity-70 fv-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-fv-green" />
            </span>
            <span className="text-xs font-medium text-ink-300">
              {universe.league.division} · {universe.league.season}
            </span>
          </div>

          <div className="ml-1 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-ink-100 ring-1 ring-navy-600">
              ER
            </div>
            <div className="hidden leading-tight xl:block">
              <div className="text-sm font-semibold text-ink-100">Elan Romo</div>
              <div className="text-[11px] text-ink-300">Brandeis MS</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
