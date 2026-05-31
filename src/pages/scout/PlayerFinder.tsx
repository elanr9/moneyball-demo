// Player Finder. The simple, plain English way to scout the whole league. A
// coach describes the player they want or taps the qualities that matter, and
// the AI ranks every player instantly with a match score and a human reason.
// Under the hood this builds the same game model the rest of the product uses,
// but the coach never sees a weight or a percentage.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Search, Bookmark, Trash2, Check } from 'lucide-react'
import clsx from 'clsx'
import { useUniverse } from '../../context/UniverseContext'
import { useRoles } from '../../context/RolesContext'
import { getTeam } from '../../data/selectors'
import { buildPercentiles, rankByRole, precisionLabel } from '../../data/gameModel'
import {
  TRAITS,
  TRAIT_CATEGORY_ORDER,
  PLAYSTYLES,
  POSITION_GROUP_LABEL,
  parsePlayerQuery,
  buildRoleFromTraits,
  topReasons,
  getTrait,
} from '../../data/playerSearch'
import type { Trait } from '../../data/playerSearch'
import type { PositionGroup } from '../../data/types'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { TeamCrest } from '../../components/league/TeamCrest'

type GroupOption = PositionGroup | 'ALL'

const GROUP_OPTIONS: Array<{ id: GroupOption; label: string }> = [
  { id: 'ALL', label: 'All positions' },
  { id: 'DEF', label: 'Defenders' },
  { id: 'MID', label: 'Midfielders' },
  { id: 'FWD', label: 'Forwards' },
  { id: 'GK', label: 'Goalkeepers' },
]

const EXAMPLE_PROMPTS = [
  'A fast winger who scores goals',
  'A center back great on the ball who wins headers',
  'A midfielder who wins the ball back and passes well',
]

export function PlayerFinder() {
  const { universe } = useUniverse()
  const { customRoles, saveRole, deleteRole } = useRoles()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<string[]>([])
  const [group, setGroup] = useState<GroupOption>('ALL')
  const [query, setQuery] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  const percentiles = useMemo(() => buildPercentiles(universe.players), [universe.players])

  const draftRole = useMemo(
    () => buildRoleFromTraits(selected, group, { id: 'finder-draft', name: 'Player Finder' }),
    [selected, group],
  )

  const results = useMemo(
    () => (selected.length ? rankByRole(universe.players, draftRole, percentiles).slice(0, 12) : []),
    [selected, draftRole, percentiles, universe.players],
  )

  // Saved searches are custom roles that carry their trait list. Anything older
  // without traits is left to the legacy data model and skipped here.
  const savedSearches = useMemo(
    () => customRoles.filter((r) => Array.isArray(r.traits) && r.traits.length > 0),
    [customRoles],
  )

  function toggleTrait(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
    setSavedId(null)
  }

  function runQuery() {
    const parsed = parsePlayerQuery(query)
    if (!parsed.traits.length && !parsed.group) return
    if (parsed.traits.length) setSelected(parsed.traits)
    if (parsed.group) setGroup(parsed.group)
    setSavedId(null)
  }

  function loadPlaystyle(traits: string[], styleGroup: PositionGroup) {
    setSelected(traits)
    setGroup(styleGroup)
    setQuery('')
    setSavedId(null)
  }

  function loadSaved(id: string) {
    const role = customRoles.find((r) => r.id === id)
    if (!role?.traits) return
    setSelected(role.traits)
    setGroup(role.groups.length === 4 ? 'ALL' : role.groups[0] ?? 'ALL')
    setQuery('')
    setSavedId(role.id)
  }

  function clearAll() {
    setSelected([])
    setGroup('ALL')
    setQuery('')
    setSavedId(null)
  }

  function saveSearch() {
    if (!selected.length) return
    const fallbackName = selected
      .slice(0, 2)
      .map((id) => getTrait(id)?.label ?? id)
      .join(' and ')
    const name = window.prompt('Name this search', fallbackName || 'My search')
    if (!name) return
    const id = savedId ?? `finder-${Date.now()}`
    const role = buildRoleFromTraits(selected, group, { id, name, custom: true })
    saveRole(role)
    setSavedId(id)
  }

  function removeSaved(id: string) {
    deleteRole(id)
    if (savedId === id) setSavedId(null)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-7 p-8">
      <header className="space-y-1">
        <div className="section-label flex items-center gap-2 text-team">
          <Sparkles size={15} /> AI Scout
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-ink-100">Player Finder</h1>
        <p className="max-w-2xl text-sm text-ink-300">
          Describe the player you want or tap the qualities that matter. The AI ranks every player
          in the league for you instantly.
        </p>
      </header>

      <SearchHero
        query={query}
        onChange={setQuery}
        onSubmit={runQuery}
        onExample={(text) => {
          setQuery(text)
          const parsed = parsePlayerQuery(text)
          if (parsed.traits.length) setSelected(parsed.traits)
          if (parsed.group) setGroup(parsed.group)
          setSavedId(null)
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {savedSearches.length ? (
            <SavedSearches
              searches={savedSearches}
              activeId={savedId}
              onLoad={loadSaved}
              onRemove={removeSaved}
            />
          ) : null}

          <PlaystyleStarters onPick={loadPlaystyle} />

          <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-ink-100">What matters to you</h2>
                <p className="text-xs text-ink-300">Tap any quality to add it to your search.</p>
              </div>
              {selected.length ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-ink-300 transition-colors hover:text-ink-100"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-ink-300">Position</span>
              {GROUP_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setGroup(opt.id)
                    setSavedId(null)
                  }}
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    group === opt.id
                      ? 'bg-blue-500 text-white'
                      : 'border border-navy-600 text-ink-300 hover:text-ink-100',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {TRAIT_CATEGORY_ORDER.map((category) => (
                <TraitGroup
                  key={category}
                  title={category}
                  traits={TRAITS.filter((t) => t.category === category)}
                  selected={selected}
                  onToggle={toggleTrait}
                />
              ))}
            </div>
          </section>
        </div>

        <ResultsPanel
          universe={universe}
          results={results}
          selected={selected}
          percentiles={percentiles}
          onOpen={(teamId, slug) => navigate(`/player/${teamId}/${slug}`)}
          onSave={saveSearch}
          isSaved={Boolean(savedId)}
        />
      </div>
    </div>
  )
}

function SearchHero({
  query,
  onChange,
  onSubmit,
  onExample,
}: {
  query: string
  onChange: (value: string) => void
  onSubmit: () => void
  onExample: (text: string) => void
}) {
  return (
    <section
      data-tour="finder-search"
      className="rounded-2xl border border-navy-600 bg-gradient-to-br from-navy-800 to-navy-800/60 p-6 shadow-card"
    >
      <div className="flex items-center gap-3 rounded-xl border border-navy-600 bg-navy-900/60 px-4 py-3 focus-within:border-blue-500">
        <Sparkles size={18} className="shrink-0 text-team" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
          }}
          placeholder="Describe your ideal player in plain English"
          className="min-w-0 flex-1 bg-transparent text-base text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-400"
        >
          <Search size={15} /> Find players
        </button>
      </div>
      <div data-tour="finder-examples" className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-ink-500">Try</span>
        {EXAMPLE_PROMPTS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onExample(text)}
            className="rounded-full border border-navy-600 px-3 py-1 text-xs text-ink-300 transition-colors hover:border-blue-500 hover:text-ink-100"
          >
            {text}
          </button>
        ))}
      </div>
    </section>
  )
}

function PlaystyleStarters({
  onPick,
}: {
  onPick: (traits: string[], group: PositionGroup) => void
}) {
  return (
    <section data-tour="finder-playstyles">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-fv-green" />
        <h2 className="section-label text-fv-green">Start from a playstyle</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PLAYSTYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onPick(style.traits, style.group)}
            className="group rounded-xl border border-navy-600 bg-navy-800 p-4 text-left shadow-card transition-colors hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink-100">{style.name}</span>
              <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-ink-300">
                {POSITION_GROUP_LABEL[style.group]}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-300">{style.blurb}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function TraitGroup({
  title,
  traits,
  selected,
  onToggle,
}: {
  title: string
  traits: Trait[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-widest text-ink-300">{title}</div>
      <div className="flex flex-wrap gap-2">
        {traits.map((trait) => {
          const active = selected.includes(trait.id)
          return (
            <button
              key={trait.id}
              type="button"
              onClick={() => onToggle(trait.id)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-fv-green text-ink-900'
                  : 'border border-navy-600 bg-navy-900/40 text-ink-100 hover:border-fv-green/60',
              )}
            >
              {active ? <Check size={14} strokeWidth={3} /> : null}
              {trait.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ResultsPanel({
  universe,
  results,
  selected,
  percentiles,
  onOpen,
  onSave,
  isSaved,
}: {
  universe: ReturnType<typeof useUniverse>['universe']
  results: ReturnType<typeof rankByRole>
  selected: string[]
  percentiles: ReturnType<typeof buildPercentiles>
  onOpen: (teamId: string, slug: string) => void
  onSave: () => void
  isSaved: boolean
}) {
  return (
    <section
      data-tour="finder-results"
      className="flex h-fit flex-col rounded-2xl border border-navy-600 bg-navy-800 shadow-card lg:sticky lg:top-20"
    >
      <div className="flex items-center justify-between border-b border-navy-600 px-5 py-4">
        <div>
          <h2 className="section-label flex items-center gap-2 text-team">
            <Sparkles size={14} /> Best matches
          </h2>
          <p className="mt-0.5 text-xs text-ink-300">
            {selected.length ? 'Ranked by your search' : 'Add a quality to rank players'}
          </p>
        </div>
        {selected.length ? (
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold text-ink-100 transition-colors hover:bg-navy-700"
          >
            <Bookmark size={13} className={clsx(isSaved && 'fill-current text-fv-green')} /> Save
          </button>
        ) : null}
      </div>

      {results.length ? (
        <div className="divide-y divide-navy-700">
          {results.map((entry, index) => {
            const team = getTeam(universe, entry.player.teamId)
            const match = Math.round(entry.score * 10)
            const reasons = topReasons(entry.player, selected, percentiles)
            return (
              <button
                key={entry.player.id}
                type="button"
                onClick={() => onOpen(entry.player.teamId, entry.player.slug)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-navy-700"
              >
                <span className="w-4 shrink-0 text-center font-mono text-xs font-bold text-ink-500">
                  {index + 1}
                </span>
                <PlayerAvatar name={entry.player.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-100">
                    {entry.player.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-300">
                    {team ? <TeamCrest team={team} size="xs" /> : null}
                    <span className="truncate">{team?.shortName}</span>
                    <span className="text-ink-500">·</span>
                    <span>{entry.player.primaryPosition}</span>
                  </div>
                  {reasons.length ? (
                    <div className="mt-1 truncate text-[11px] font-medium text-fv-green">
                      {reasons.join(' · ')}
                    </div>
                  ) : null}
                </div>
                <MatchScore match={match} precision={entry.precision} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <Sparkles size={28} className="mx-auto text-navy-600" />
          <p className="mt-3 text-sm text-ink-300">
            {selected.length
              ? 'No players match in the selected positions.'
              : 'Describe a player above or tap a quality to begin.'}
          </p>
        </div>
      )}
    </section>
  )
}

function MatchScore({ match, precision }: { match: number; precision: number }) {
  return (
    <div className="w-20 shrink-0 text-right">
      <div className="text-lg font-bold leading-none text-ink-100">
        {match}
        <span className="ml-0.5 text-[10px] font-semibold text-ink-500">match</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-600">
        <div className="h-full rounded-full bg-fv-green" style={{ width: `${Math.max(4, match)}%` }} />
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-widest text-ink-500">
        {precisionLabel(precision)} confidence
      </div>
    </div>
  )
}

function SavedSearches({
  searches,
  activeId,
  onLoad,
  onRemove,
}: {
  searches: ReturnType<typeof useRoles>['customRoles']
  activeId: string | null
  onLoad: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Bookmark size={13} className="text-ink-300" />
        <h2 className="section-label text-ink-300">Saved searches</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((role) => (
          <div
            key={role.id}
            className={clsx(
              'group flex items-center gap-1 rounded-full border px-1 py-1 pl-3 text-sm font-semibold transition-colors',
              role.id === activeId
                ? 'border-blue-500 bg-blue-500/10 text-ink-100'
                : 'border-navy-600 bg-navy-800 text-ink-100 hover:border-blue-500',
            )}
          >
            <button type="button" onClick={() => onLoad(role.id)} className="truncate">
              {role.name}
            </button>
            <button
              type="button"
              onClick={() => onRemove(role.id)}
              className="rounded-full p-1 text-ink-500 transition-colors hover:bg-navy-700 hover:text-fv-red"
              aria-label={`Delete ${role.name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
