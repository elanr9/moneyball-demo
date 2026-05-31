// Transfer Market / Scout page. Opening transfers lands on a FIFA FUT style hub
// of large tiles that fills the desktop viewport. From there the scout drops
// into a fixed search frame: a compact control row up top, filters scrolling on
// the left, and results scrolling on the right. The page itself never scrolls.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search as SearchIcon, Sparkles, Wand2 } from 'lucide-react'
import { useUniverse } from '../../context/UniverseContext'
import { useRoles } from '../../context/RolesContext'
import { getTeam, getStatDef } from '../../data/selectors'
import { buildPercentiles } from '../../data/gameModel'
import type { Player, PositionGroup } from '../../data/types'
import { FilterRail } from '../../components/market/FilterRail'
import { ResultCard } from '../../components/market/ResultCard'
import { CompareModal } from '../../components/market/CompareModal'
import { SimilarModal } from '../../components/market/SimilarModal'
import { MarketHub } from '../../components/market/MarketHub'
import { GameModelTable } from '../../components/market/GameModelTable'
import {
  DEFAULT_FILTERS,
  describeFilters,
  filterPlayers,
  hasActiveFilters,
  matchReasons,
} from '../../components/market/filters'
import type { MarketFilters } from '../../components/market/filters'
import { parseMarketQuery } from '../../components/market/parseQuery'

const EXAMPLE_QUERIES = [
  'Attacking left back with elite progressive runs',
  'Tall center back strong in duels who wins the ball',
  'Creative CDM from Brandeis with high chances created',
  'Fast striker clinical finisher 80+ overall',
]

const MAX_COMPARE = 4

type MarketView = 'hub' | 'search'

export function Market() {
  const { universe } = useUniverse()
  const { roles } = useRoles()
  const navigate = useNavigate()

  const [view, setView] = useState<MarketView>('hub')
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS)
  const [query, setQuery] = useState('')
  const [summary, setSummary] = useState<string[]>([])
  const [sortKey, setSortKey] = useState('overall')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [similarTarget, setSimilarTarget] = useState<Player | null>(null)
  const [evalRoleId, setEvalRoleId] = useState('')
  const [minPrecision, setMinPrecision] = useState(0)

  const teams = universe.teams
  const players = universe.players
  const percentiles = useMemo(() => buildPercentiles(players), [players])
  const evalRole = roles.find((r) => r.id === evalRoleId)

  const countries = useMemo(
    () => Array.from(new Set(players.map((p) => p.country))).filter(Boolean).sort(),
    [players],
  )
  const classYears = useMemo(
    () => Array.from(new Set(players.map((p) => p.classYear))),
    [players],
  )

  const sortOptions = useMemo(() => {
    const base = [
      { key: 'overall', label: 'Overall' },
      { key: 'fvRating', label: 'FV Rating' },
    ]
    for (const key of Object.keys(filters.statMins)) {
      const def = getStatDef(key)
      if (def && !base.some((b) => b.key === key)) {
        base.push({ key, label: def.label })
      }
    }
    return base
  }, [filters.statMins])

  const results = useMemo(() => {
    const matched = filterPlayers(players, filters)
    const value = (p: Player) => {
      if (sortKey === 'overall') return p.overall
      const def = getStatDef(sortKey)
      return def ? def.get(p) : p.overall
    }
    return [...matched].sort((a, b) => value(b) - value(a))
  }, [players, filters, sortKey])

  const teamFor = (teamId: string) => getTeam(universe, teamId)

  const filterChips = useMemo(
    () => describeFilters(filters, (id) => teamFor(id)?.shortName ?? id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, universe],
  )

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => Boolean(p)),
    [selectedIds, players],
  )

  function runSearch(text: string) {
    const value = text.trim()
    setQuery(text)
    if (!value) {
      setSummary([])
      return
    }
    const { patch, summary: parsed } = parseMarketQuery(value, players, teams)
    setFilters((prev) => ({
      ...prev,
      ...patch,
      statMins: { ...prev.statMins, ...(patch.statMins ?? {}) },
    }))
    setSummary(parsed)
  }

  function resetAll() {
    setFilters(DEFAULT_FILTERS)
    setQuery('')
    setSummary([])
  }

  function searchFromHub(text: string) {
    runSearch(text)
    setView('search')
  }

  function positionFromHub(group: PositionGroup) {
    setFilters({ ...DEFAULT_FILTERS, positionGroup: group })
    setQuery('')
    setSummary([])
    setSortKey('overall')
    setView('search')
  }

  function topRatedFromHub() {
    setFilters({ ...DEFAULT_FILTERS, overallMin: 80 })
    setQuery('')
    setSummary([])
    setSortKey('overall')
    setView('search')
  }

  function shortlistFromHub() {
    setView('search')
    if (selectedIds.length >= 2) setCompareOpen(true)
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, id]
    })
  }

  function openPlayer(player: Player) {
    navigate(`/player/${player.teamId}/${player.slug}`)
  }

  const sortLabel =
    sortOptions.find((o) => o.key === sortKey)?.label ?? 'Overall'

  function metricFor(player: Player): { label: string; value: string } {
    if (sortKey === 'overall') return { label: 'Overall', value: String(player.overall) }
    const def = getStatDef(sortKey)
    if (!def) return { label: 'Overall', value: String(player.overall) }
    return { label: def.short, value: def.format(def.get(player)) }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {view === 'hub' ? (
        <MarketHub
          playerCount={players.length}
          teamCount={teams.length}
          query={query}
          exampleQueries={EXAMPLE_QUERIES}
          shortlistCount={selectedPlayers.length}
          onQueryChange={setQuery}
          onSearch={searchFromHub}
          onExample={searchFromHub}
          onTopRated={topRatedFromHub}
          onPosition={positionFromHub}
          onShortlist={shortlistFromHub}
        />
      ) : (
        <div className="flex h-full flex-col overflow-hidden p-6">
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setView('hub')}
              className="flex items-center gap-1.5 rounded-xl border border-navy-600 bg-navy-800 px-3 py-3 text-sm text-ink-300 shadow-card transition-colors hover:border-blue-500 hover:text-ink-100"
            >
              <ArrowLeft size={16} />
              Hub
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                runSearch(query)
              }}
              className="relative flex-1"
            >
              <SearchIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe the player you want in plain English"
                className="w-full rounded-xl border border-navy-600 bg-navy-800 py-3 pl-12 pr-4 text-base text-ink-100 shadow-card placeholder:text-ink-500 focus:border-blue-500 focus:outline-none"
              />
            </form>
            <button
              type="button"
              onClick={() => runSearch(query)}
              className="shrink-0 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-400"
            >
              Search
            </button>
            <label className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-fv-green">
                <Wand2 size={12} /> Evaluate by
              </span>
              <select
                value={evalRoleId}
                onChange={(e) => setEvalRoleId(e.target.value)}
                className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 shadow-card focus:border-fv-green focus:outline-none"
              >
                <option value="">Overall (cards)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.custom ? ' (custom)' : ''}
                  </option>
                ))}
              </select>
            </label>
            {evalRole ? (
              <label className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-ink-300">
                  Min precision
                </span>
                <select
                  value={minPrecision}
                  onChange={(e) => setMinPrecision(Number(e.target.value))}
                  className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 shadow-card focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>Any</option>
                  <option value={45}>Medium</option>
                  <option value={75}>High</option>
                </select>
              </label>
            ) : (
              <label className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-ink-300">
                  Sort by
                </span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 shadow-card focus:border-blue-500 focus:outline-none"
                >
                  {sortOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {summary.length > 0 ? (
            <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-navy-600 bg-navy-800 px-4 py-2 shadow-card">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-fv-green">
                <Sparkles size={13} /> Understood
              </span>
              {summary.map((s) => (
                <span
                  key={s}
                  className="rounded bg-navy-700 px-2 py-0.5 font-mono text-xs text-blue-500"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid min-h-0 flex-1 grid-cols-[300px_1fr] gap-6 overflow-hidden">
            <div className="overflow-y-auto pr-1 scrollbar-thin">
              <FilterRail
                filters={filters}
                players={players}
                teams={teams}
                countries={countries}
                classYears={classYears}
                onChange={setFilters}
                onReset={resetAll}
              />
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-3">
                <div className="text-sm text-ink-300">
                  <span className="font-mono text-lg font-bold text-ink-100">
                    {results.length}
                  </span>{' '}
                  players match
                  {hasActiveFilters(filters) ? '' : ' the full database'}
                </div>
              </div>

              {filterChips.length > 0 ? (
                <div className="mt-2 flex shrink-0 flex-wrap gap-2">
                  {filterChips.map((c, i) => (
                    <span
                      key={`${c.label}-${i}`}
                      className="rounded bg-navy-700 px-2 py-0.5 text-xs text-ink-100"
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              ) : null}

              {evalRole ? (
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 pb-24 scrollbar-thin">
                  <GameModelTable
                    universe={universe}
                    players={results}
                    role={evalRole}
                    percentiles={percentiles}
                    minPrecision={minPrecision}
                    onOpen={openPlayer}
                  />
                </div>
              ) : results.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-navy-600 bg-navy-800 p-12 text-center">
                  <div className="text-base font-semibold text-ink-100">
                    No players match
                  </div>
                  <div className="mt-2 text-sm text-ink-300">
                    Loosen a filter or lower a stat minimum to see more.
                  </div>
                </div>
              ) : (
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                  <div
                    className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${
                      selectedPlayers.length > 0 ? 'pb-24' : 'pb-4'
                    }`}
                  >
                    {results.slice(0, 60).map((player) => {
                      const metric = metricFor(player)
                      return (
                        <ResultCard
                          key={player.id}
                          player={player}
                          team={teamFor(player.teamId)}
                          reasons={matchReasons(player, filters)}
                          metricLabel={metric.label}
                          metricValue={metric.value}
                          selected={selectedIds.includes(player.id)}
                          onToggleSelect={() => toggleSelect(player.id)}
                          onOpen={() => openPlayer(player)}
                          onSimilar={() => setSimilarTarget(player)}
                        />
                      )
                    })}
                  </div>

                  {results.length > 60 ? (
                    <div className="pb-4 text-center text-xs text-ink-300">
                      Showing the top 60 by {sortLabel}. Refine your filters to
                      narrow the list.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPlayers.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-600 bg-navy-800/95 px-8 py-3 shadow-float backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="shrink-0 text-[11px] uppercase tracking-widest text-ink-300">
                Compare
              </span>
              {selectedPlayers.map((p) => (
                <span
                  key={p.id}
                  className="shrink-0 rounded bg-navy-700 px-2 py-1 text-xs font-semibold text-ink-100"
                >
                  {p.lastName}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-md border border-navy-600 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 transition-colors hover:text-ink-100"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={selectedPlayers.length < 2}
                onClick={() => setCompareOpen(true)}
                className="rounded-md bg-blue-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Compare {selectedPlayers.length}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {compareOpen && selectedPlayers.length >= 2 ? (
        <CompareModal
          players={selectedPlayers}
          onRemove={(id) => toggleSelect(id)}
          onClose={() => setCompareOpen(false)}
        />
      ) : null}

      {similarTarget ? (
        <SimilarModal
          target={similarTarget}
          players={players}
          teams={teams}
          onView={(p) => {
            setSimilarTarget(null)
            openPlayer(p)
          }}
          onClose={() => setSimilarTarget(null)}
        />
      ) : null}
    </div>
  )
}
