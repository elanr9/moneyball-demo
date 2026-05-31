// Landing hub for the Transfer Market. The whole screen is built around one
// calm idea: describe the player you want in plain English. A single centered
// column holds the headline, the search field and a quiet set of secondary
// entry points, so the scout always knows where to look first.

import type { FormEvent } from 'react'
import {
  ArrowUp,
  Crown,
  GitCompare,
  Search as SearchIcon,
  Hand,
  Shield,
  Wand2,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PositionGroup } from '../../data/types'

interface MarketHubProps {
  playerCount: number
  teamCount: number
  query: string
  exampleQueries: string[]
  shortlistCount: number
  onQueryChange: (value: string) => void
  onSearch: (text: string) => void
  onExample: (text: string) => void
  onTopRated: () => void
  onPosition: (group: PositionGroup) => void
  onShortlist: () => void
}

const POSITION_LINKS: Array<{
  id: PositionGroup
  label: string
  icon: LucideIcon
}> = [
  { id: 'GK', label: 'Keepers', icon: Hand },
  { id: 'DEF', label: 'Defenders', icon: Shield },
  { id: 'MID', label: 'Midfielders', icon: Wand2 },
  { id: 'FWD', label: 'Forwards', icon: Target },
]

export function MarketHub({
  playerCount,
  teamCount,
  query,
  exampleQueries,
  shortlistCount,
  onQueryChange,
  onSearch,
  onExample,
  onTopRated,
  onPosition,
  onShortlist,
}: MarketHubProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-2xl animate-fade-rise">
        <div className="text-center">
          <div className="section-label text-blue-400">FieldVision Scout</div>
          <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight text-ink-100">
            Describe the player you want
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-300">
            Our model reads plain English and turns it into advanced filters
            across {playerCount} players and {teamCount} clubs.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mt-9"
          data-tour="market-search"
        >
          <div
            className="pointer-events-none absolute -inset-x-10 -top-8 h-40 rounded-full bg-blue-500/15 blur-3xl"
            aria-hidden
          />
          <div className="group relative flex items-center gap-3 rounded-2xl border border-navy-600 bg-navy-800 px-5 py-4 shadow-card transition-all focus-within:border-blue-500 focus-within:shadow-glow">
            <SearchIcon size={20} className="shrink-0 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Try a fast clinical finisher rated 80 plus"
              autoFocus
              className="flex-1 bg-transparent text-base text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-all hover:bg-blue-400 disabled:opacity-30"
              disabled={query.trim().length === 0}
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </div>
        </form>

        <div
          className="mt-5 flex flex-wrap justify-center gap-2"
          data-tour="market-examples"
        >
          {exampleQueries.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onExample(ex)}
              className="rounded-full border border-navy-600 bg-navy-800/60 px-3.5 py-1.5 text-[13px] font-medium text-ink-300 transition-colors hover:border-navy-500 hover:text-ink-100"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-navy-600" />
          <span className="section-label text-ink-500">Or jump straight in</span>
          <span className="h-px flex-1 bg-navy-600" />
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
          data-tour="market-quicklinks"
        >
          <QuickLink icon={Crown} label="Top rated" onClick={onTopRated} />
          {POSITION_LINKS.map((p) => (
            <QuickLink
              key={p.id}
              icon={p.icon}
              label={p.label}
              onClick={() => onPosition(p.id)}
            />
          ))}
          <QuickLink
            icon={GitCompare}
            label={
              shortlistCount > 0 ? `Shortlist ${shortlistCount}` : 'Shortlist'
            }
            active={shortlistCount > 0}
            onClick={onShortlist}
          />
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 ${
        active
          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
          : 'border-navy-600 bg-navy-800 text-ink-300 hover:border-navy-500 hover:text-ink-100'
      }`}
    >
      <Icon size={16} strokeWidth={2.1} />
      {label}
    </button>
  )
}
