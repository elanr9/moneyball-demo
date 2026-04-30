import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Target, Shield, Zap, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { usePlayerData } from '../../context/PlayerDataContext'
import { Loader } from '../../components/ui/Loader'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { RatingBadge } from '../../components/ui/RatingBadge'
import { parseScoutQuery } from '../../lib/openaiClient'
import type { ScoutResult } from '../../lib/mockScoutSearch'

interface SuggestedQuery {
  icon: LucideIcon
  query: string
}

const SUGGESTED: SuggestedQuery[] = [
  { icon: Target, query: 'Forward under 22 with high xG and progressive runs' },
  { icon: Shield, query: "Defensive mid, won't lose the ball, 6'+ tall" },
  { icon: Zap, query: 'Fast winger, 30+ km/h, high pressure events' },
  { icon: Palette, query: 'Holding mid, high passing, recoveries' },
]

const LOADING_STEPS = [
  'Translating natural language to filters',
  'Searching 29 players across 38 KPIs',
  'Ranking matches',
  'Done',
]

type Stage = 'idle' | 'loading' | 'results'

export function Search() {
  const { players } = usePlayerData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<ScoutResult | null>(null)

  useEffect(() => {
    if (stage !== 'loading') return
    const timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= LOADING_STEPS.length) {
          clearInterval(timer)
          return s
        }
        return s + 1
      })
    }, 600)
    return () => clearInterval(timer)
  }, [stage])

  async function runSearch(q: string) {
    if (!q.trim()) return
    setQuery(q)
    setStage('loading')
    setStep(0)
    const start = Date.now()
    const data = await parseScoutQuery(q, players)
    const elapsed = Date.now() - start
    const remaining = Math.max(0, 2400 - elapsed)
    setTimeout(() => {
      setResult(data)
      setStage('results')
    }, remaining)
  }

  function reset() {
    setStage('idle')
    setQuery('')
    setResult(null)
    setStep(0)
  }

  if (stage === 'loading') {
    return <SearchLoading step={step} query={query} />
  }
  if (stage === 'results' && result) {
    return (
      <SearchResults
        query={query}
        result={result}
        onReset={reset}
        onView={(slug) => navigate(`/player/${slug}`)}
      />
    )
  }

  return (
    <div className="px-8 py-16 max-w-[720px] mx-auto">
      <div className="text-center space-y-3 mb-12">
        <div className="text-xs uppercase tracking-widest text-blue-500 font-semibold">
          FieldVision Scout
        </div>
        <h1 className="text-4xl font-bold text-white">
          Search every player. Find any profile.
        </h1>
        <div className="text-sm text-ink-300 max-w-lg mx-auto">
          Describe the player you want in plain English. FieldVision matches
          across 38 performance metrics in seconds.
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
      />

      <div className="mt-10">
        <div className="text-xs uppercase tracking-widest text-ink-300 mb-3">
          Try one of these
        </div>
        <div className="grid grid-cols-1 gap-2">
          {SUGGESTED.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.query}
                type="button"
                onClick={() => runSearch(s.query)}
                className="bg-navy-800 border border-navy-600 rounded-md px-4 py-3 text-sm text-ink-100 hover:bg-navy-700 hover:border-blue-500 transition-colors flex items-center gap-3 text-left"
              >
                <Icon size={16} className="text-blue-400" />
                <span>{s.query}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-ink-300 font-mono uppercase tracking-widest">
        Searching across 1 league · {players.length} players · 38 KPIs
      </div>
    </div>
  )
}

function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex gap-3"
    >
      <div className="relative flex-1">
        <SearchIcon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your dream player..."
          autoFocus
          className="w-full bg-navy-800 border border-navy-600 rounded-md pl-11 pr-4 py-4 text-base text-white placeholder:text-ink-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-4 bg-blue-500 text-navy-900 rounded-md text-sm font-bold hover:bg-blue-400 transition-colors"
      >
        Search
      </button>
    </form>
  )
}

function SearchLoading({ step, query }: { step: number; query: string }) {
  return (
    <div className="px-8 py-32 max-w-[720px] mx-auto text-center space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-300 font-mono mb-2">
          Query
        </div>
        <div className="text-base text-white font-medium italic">
          "{query}"
        </div>
      </div>
      <Loader />
      <div className="space-y-2 text-sm text-ink-300 font-mono">
        {LOADING_STEPS.map((line, i) => (
          <div
            key={line}
            className={clsx(
              'transition-colors',
              i < step && 'text-fv-green',
              i === step && 'text-blue-400',
              i > step && 'text-ink-500',
            )}
          >
            {i <= step ? '▸ ' : '  '}
            {line}
            {i < step ? ' ✓' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function SearchResults({
  query,
  result,
  onReset,
  onView,
}: {
  query: string
  result: ScoutResult
  onReset: () => void
  onView: (slug: string) => void
}) {
  const { filters, matches, totalConsidered } = result
  const chips: string[] = []
  if (filters.position) chips.push(`Position: ${filters.position}`)
  if (filters.ageRange)
    chips.push(`Age: ${filters.ageRange[0]} – ${filters.ageRange[1]}`)
  if (filters.heightMin) chips.push(`Height: ≥ ${filters.heightMin}`)
  for (const f of filters.filters) chips.push(f.label)

  return (
    <div className="p-8 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-blue-500 mb-2">
            Search Results
          </div>
          <div className="text-base text-white italic">"{query}"</div>
          <div className="text-xs text-ink-300 mt-2 font-mono">
            {totalConsidered} matches in database · Showing top {matches.length}
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs uppercase tracking-widest text-ink-300 hover:text-white border border-navy-600 px-3 py-2 rounded-md transition-colors"
        >
          New Search
        </button>
      </div>

      {chips.length > 0 ? (
        <div className="bg-navy-800 border border-navy-600 rounded-lg p-4">
          <div className="text-[11px] uppercase tracking-widest text-ink-300 mb-2 font-semibold">
            Parsed Filters
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 text-xs font-mono bg-navy-700 border border-navy-600 text-blue-400 rounded"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="bg-navy-800 border border-navy-600 rounded-lg p-12 text-center">
            <div className="text-base text-white font-semibold mb-2">
              No matches found
            </div>
            <div className="text-sm text-ink-300">
              Try loosening your criteria or removing a filter.
            </div>
          </div>
        ) : (
          matches.map((m) => (
            <div
              key={m.player.slug}
              className="bg-navy-800 border border-navy-600 rounded-lg p-5 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start gap-4">
                <PlayerAvatar name={m.player.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-lg font-bold text-white">
                      {m.player.name}
                    </h3>
                    <RatingBadge rating={m.player.fvRating} size="sm" />
                  </div>
                  <div className="text-xs text-ink-300 font-mono mt-1">
                    Brandeis Men's Soccer · {m.player.position} · #
                    {m.player.number} · {m.player.year}
                  </div>

                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-widest text-fv-green font-semibold mb-1.5">
                      Why this match
                    </div>
                    <ul className="space-y-1">
                      {m.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="text-xs text-ink-100 flex items-start gap-2 font-mono"
                        >
                          <span className="text-fv-green">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 text-xs text-ink-300 font-mono">
                    Goals: {m.player.goals} · Assists: {m.player.assists} ·
                    Top Speed: {m.player.topSpeedKmh.toFixed(1)} km/h
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onView(m.player.slug)}
                  className="shrink-0 self-start px-4 py-2 text-xs uppercase tracking-widest font-semibold bg-blue-500 text-navy-900 rounded-md hover:bg-blue-400 transition-colors"
                >
                  View Profile →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalConsidered > matches.length ? (
        <div className="text-center text-xs text-ink-300">
          + {totalConsidered - matches.length} more matches. Refine your search
          to see them.
        </div>
      ) : null}
    </div>
  )
}
