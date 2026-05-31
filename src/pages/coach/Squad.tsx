// Coach squad view: a full height dashboard, no page scrolling. The managed
// team spreads across a wide landscape pitch that owns the whole screen, with
// data driven tactical run arrows layered over the eleven. The bench and
// reserves live in a FIFA style dock that is tucked away at the bottom and
// slides up to reveal the cards on hover, so the board stays uncluttered. The
// coach can switch club, pick a formation, toggle the runs, drag players onto
// the pitch, swap any slot, and open a player profile.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, GripHorizontal, Maximize2, Sparkles, Spline, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUniverse } from '../../context/UniverseContext'
import {
  getTeam,
  teamAggregate,
  teamPlayers,
} from '../../data/selectors'
import type { Player, Team } from '../../data/types'
import { TeamCrest } from '../../components/league/TeamCrest'
import {
  FORMATION_GROUPS,
  FORMATIONS,
  normalizeFormation,
} from '../../components/squad/formations'
import type { FormationName, FormationSlot } from '../../components/squad/formations'
import { autoLineup, placeInSlot, DRAG_MIME } from '../../components/squad/lineup'
import type { Lineup, SquadSelection } from '../../components/squad/lineup'
import { Pitch } from '../../components/squad/Pitch'
import { PlayerCard } from '../../components/squad/PlayerCard'
import { PlayerQuickLook } from '../../components/squad/PlayerQuickLook'
import { SquadPicker } from '../../components/squad/SquadPicker'
import { buildTacticalRuns } from '../../components/squad/tacticalRuns'
import { PlaybookPanel } from '../../components/squad/PlaybookPanel'
import { buildPlaybook } from '../../components/squad/playbook'
import type { Play } from '../../components/squad/playbook'
import { usePlaybookFeedback } from '../../components/squad/playFeedback'
import { squadAttributes } from '../../components/squad/tactics'

const BENCH_SIZE = 7

type RailTab = 'bench' | 'reserves'

export function Squad() {
  const { universe, myTeamId, setMyTeamId } = useUniverse()
  const navigate = useNavigate()

  const team = getTeam(universe, myTeamId)
  const squad = useMemo(() => teamPlayers(universe, myTeamId), [universe, myTeamId])

  const [formationName, setFormationName] = useState<FormationName>(() =>
    normalizeFormation(team?.defaultFormation),
  )
  const formation = FORMATIONS[formationName]

  const [lineup, setLineup] = useState<Lineup>(() => autoLineup(squad, formation))
  const [activeSlot, setActiveSlot] = useState<FormationSlot | null>(null)
  const [railTab, setRailTab] = useState<RailTab>('bench')
  // The player picked up for a swap, shared by the pitch and the rail, plus the
  // ids that just traded so both surfaces can flash them.
  const [selected, setSelected] = useState<SquadSelection | null>(null)
  const [flashedIds, setFlashedIds] = useState<Set<string>>(new Set())
  // The player opened in the quick look peek. Null when the modal is closed.
  const [quickLook, setQuickLook] = useState<Player | null>(null)
  // The bench dock is tucked away at the bottom by default so the pitch owns the
  // screen. Hovering it slides the cards up, and the Squad toggle pins it open.
  // We measure the card row so the collapsed dock hides exactly the cards while
  // the handle bar stays peeking. Plus the tactical run arrows toggle.
  const [railOpen, setRailOpen] = useState(false)
  const [benchHovered, setBenchHovered] = useState(false)
  // Hover intent for the bench dock. The trigger is a thin handle pinned to the
  // very bottom edge, so opening the large panel on a raw mouse enter makes it
  // pop open and shut as the cursor grazes the bottom of the screen. We only
  // open once the cursor rests on the handle for a beat, and close after a short
  // grace period, so passing movements never toggle the dock.
  const benchTimer = useRef<number | null>(null)
  const [showRuns, setShowRuns] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)
  // The collapsed bench shows only its handle bar. We measure it so the pitch
  // ends exactly above the handle and never covers the bottom row of cards.
  const handleRef = useRef<HTMLDivElement>(null)
  const [handleHeight, setHandleHeight] = useState(56)
  // The AI playbook drawer and the play currently animating on the board.
  const [playbookOpen, setPlaybookOpen] = useState(false)
  const [activePlay, setActivePlay] = useState<Play | null>(null)
  const feedback = usePlaybookFeedback()

  // Rebuild the best eleven whenever the squad or formation changes.
  useEffect(() => {
    setLineup(autoLineup(squad, formation))
    setSelected(null)
  }, [squad, formation])

  const clearSelection = useCallback(() => setSelected(null), [])

  const openBenchOnHover = useCallback(() => {
    if (benchTimer.current) window.clearTimeout(benchTimer.current)
    benchTimer.current = window.setTimeout(() => setBenchHovered(true), 150)
  }, [])

  const closeBenchOnLeave = useCallback(() => {
    if (benchTimer.current) window.clearTimeout(benchTimer.current)
    benchTimer.current = window.setTimeout(() => setBenchHovered(false), 220)
  }, [])

  useEffect(
    () => () => {
      if (benchTimer.current) window.clearTimeout(benchTimer.current)
    },
    [],
  )

  // Escape always cancels a pending swap from anywhere on the page.
  useEffect(() => {
    if (!selected) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  function flash(ids: string[]) {
    setFlashedIds(new Set(ids))
    window.setTimeout(() => setFlashedIds(new Set()), 700)
  }

  const playersById = useMemo(() => {
    const map = new Map<string, Player>()
    for (const p of squad) map.set(p.id, p)
    return map
  }, [squad])

  const starters = useMemo(
    () =>
      formation.slots
        .map((slot) => lineup[slot.id])
        .map((id) => (id ? playersById.get(id) : undefined))
        .filter((p): p is Player => Boolean(p)),
    [formation, lineup, playersById],
  )

  const starterIds = useMemo(() => new Set(starters.map((p) => p.id)), [starters])

  const bench = useMemo(
    () =>
      squad
        .filter((p) => !starterIds.has(p.id))
        .sort((a, b) => b.overall - a.overall)
        .slice(0, BENCH_SIZE),
    [squad, starterIds],
  )

  const benchIds = useMemo(() => new Set(bench.map((p) => p.id)), [bench])

  const reserves = useMemo(
    () =>
      squad
        .filter((p) => !starterIds.has(p.id) && !benchIds.has(p.id))
        .sort((a, b) => b.overall - a.overall),
    [squad, starterIds, benchIds],
  )

  const avgOverall = starters.length
    ? Math.round(starters.reduce((s, p) => s + p.overall, 0) / starters.length)
    : 0
  const agg = teamAggregate(universe, myTeamId)

  // The data driven movement arrows for the current eleven.
  const runs = useMemo(
    () => buildTacticalRuns(formation, lineup, playersById),
    [formation, lineup, playersById],
  )

  // The AI playbook for the current eleven: choreographed plays and drills bound
  // to the real starters, rebuilt whenever the lineup changes.
  const plays = useMemo(
    () => buildPlaybook(starters, squadAttributes(starters)),
    [starters],
  )

  // A change of eleven can drop the player a play was built around, so any open
  // play is closed when the squad shifts.
  useEffect(() => {
    setActivePlay(null)
  }, [starters])

  // Escape closes the play that is animating on the board.
  useEffect(() => {
    if (!activePlay) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setActivePlay(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePlay])

  function watchPlay(play: Play) {
    setSelected(null)
    setActivePlay(play)
  }

  function handleTeamChange(id: string) {
    setMyTeamId(id)
    setFormationName(normalizeFormation(getTeam(universe, id)?.defaultFormation))
  }

  function openQuickLook(player: Player) {
    setQuickLook(player)
  }

  function openFullProfile(player: Player) {
    navigate(`/player/${player.teamId}/${player.slug}`)
  }

  function dropOnSlot(slotId: string, playerId: string) {
    setLineup((prev) => placeInSlot(prev, slotId, playerId))
    setActiveSlot(null)
    setSelected(null)
  }

  // The shared two tap swap. The first tap picks a player up; the second tap on
  // any player trades their places. A starter carries its slotId, while a bench
  // or reserve player carries a null slotId.
  function selectOrSwap(target: SquadSelection) {
    if (!selected) {
      setSelected(target)
      return
    }
    if (selected.playerId === target.playerId) {
      setSelected(null)
      return
    }
    applySwap(selected, target)
    setSelected(null)
  }

  function applySwap(source: SquadSelection, target: SquadSelection) {
    if (target.slotId) {
      // The target is a starter, so the held player takes that slot. If the held
      // player also started, the two trade; otherwise the target is benched.
      setLineup((prev) => placeInSlot(prev, target.slotId!, source.playerId))
    } else if (source.slotId) {
      // The held player started and the target sits off the pitch, so the target
      // comes on into the held player's slot and the held player is benched.
      setLineup((prev) => placeInSlot(prev, source.slotId!, target.playerId))
    } else {
      // Both sit off the pitch, where bench and reserves are ranked, not slotted,
      // so there is nothing to trade.
      return
    }
    flash([source.playerId, target.playerId])
  }

  // Tapping an empty slot drops the held player in, or opens the picker.
  function handleEmptySlot(slot: FormationSlot) {
    if (selected) {
      setLineup((prev) => placeInSlot(prev, slot.id, selected.playerId))
      flash([selected.playerId])
      setSelected(null)
      return
    }
    setActiveSlot(slot)
  }

  // Dropping a starter back onto the rail benches them (clears their slot).
  function dropOnRail(e: React.DragEvent) {
    e.preventDefault()
    const playerId = e.dataTransfer.getData(DRAG_MIME)
    if (!playerId) return
    setLineup((prev) => {
      const slotId = Object.keys(prev).find((id) => prev[id] === playerId)
      if (!slotId) return prev
      const next = { ...prev }
      delete next[slotId]
      return next
    })
    setSelected(null)
  }

  const sortedTeams = useMemo(
    () => [...universe.teams].sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [universe.teams],
  )

  const railPlayers = railTab === 'bench' ? bench : reserves
  const benchExpanded = railOpen || benchHovered

  // Measure the card row so the collapsed dock slides down by exactly its height,
  // leaving only the handle bar peeking at the bottom of the board.
  useLayoutEffect(() => {
    if (panelRef.current) setPanelHeight(panelRef.current.offsetHeight)
    if (handleRef.current) setHandleHeight(handleRef.current.offsetHeight)
  }, [railTab, bench.length, reserves.length])

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#0c1322] via-[#0a0f1c] to-[#06090f] shadow-float">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{
            background: `radial-gradient(60% 100% at 50% 0%, ${
              team?.primaryColor ?? '#2563EB'
            }33, transparent 70%)`,
          }}
        />

        <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-4">
            {team ? <TeamCrest team={team} size="lg" /> : null}
            <div>
              <div className="section-label text-blue-300">Squad Builder</div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-white">
                {team?.name ?? 'Squad'}
              </h1>
              <div className="text-xs text-white/45">
                {team?.conference} · {universe.league.division} · {universe.league.season}
              </div>
            </div>

            <div className="ml-2 flex items-end gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Managed Club
                </span>
                <select
                  value={myTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white outline-none transition-colors focus:border-blue-400"
                >
                  {sortedTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1322] text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1" data-tour="squad-formation">
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Formation
                </span>
                <select
                  value={formationName}
                  onChange={(e) => setFormationName(e.target.value as FormationName)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white outline-none transition-colors focus:border-blue-400"
                >
                  {FORMATION_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label} className="bg-[#0c1322]">
                      {group.names.map((name) => (
                        <option key={name} value={name} className="bg-[#0c1322] text-white">
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5" data-tour="squad-toggles">
              <ToggleButton
                active={showRuns}
                icon={Spline}
                label="Runs"
                onClick={() => setShowRuns((v) => !v)}
              />
              <ToggleButton
                active={playbookOpen}
                icon={Sparkles}
                label="Plays"
                count={plays.length}
                onClick={() => setPlaybookOpen((v) => !v)}
              />
              <ToggleButton
                active={railOpen}
                icon={Users}
                label="Bench"
                count={bench.length + reserves.length}
                onClick={() => setRailOpen((v) => !v)}
              />
            </div>

            <StatChip
              accent={team?.primaryColor}
              label="Squad Rating"
              value={avgOverall ? String(avgOverall) : '0'}
            />
            <StatChip
              label="Avg FV"
              value={agg.avgFvRating ? agg.avgFvRating.toFixed(1) : '0.0'}
            />
            <StatChip label="Formation" value={formationName} />
            <StatChip label="Starters" value={`${starters.length}/11`} />
          </div>
        </header>

        <div className="relative z-10 min-h-0 flex-1 p-3" data-tour="squad-pitch">
          <motion.div
            className="relative h-full"
            animate={{ marginRight: playbookOpen ? 416 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
          >
          <div className="absolute left-0 right-0 top-0" style={{ bottom: handleHeight }}>
            <Pitch
              formation={formation}
              lineup={lineup}
              playersById={playersById}
              team={team}
              onOpenPlayer={openQuickLook}
              onDropOnSlot={dropOnSlot}
              selected={selected}
              flashedIds={flashedIds}
              onPlayerClick={(playerId, slotId) => selectOrSwap({ playerId, slotId })}
              onEmptySlotClick={handleEmptySlot}
              onClearSelection={clearSelection}
              fill
              orientation="landscape"
              runs={runs}
              showRuns={showRuns}
              activePlay={activePlay}
              onClosePlay={() => setActivePlay(null)}
              tokenScale={1}
            />
          </div>

          <motion.div
            data-tour="squad-bench"
            className="absolute inset-x-3 bottom-0 z-40"
            onMouseEnter={openBenchOnHover}
            onMouseLeave={closeBenchOnLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={dropOnRail}
            animate={{ y: benchExpanded ? 0 : panelHeight }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            <div
              ref={handleRef}
              onClick={() => setRailOpen((v) => !v)}
              title={railOpen ? 'Unpin bench' : 'Pin bench open'}
              className="flex w-full cursor-pointer items-center gap-3 rounded-t-2xl border border-b-0 border-white/10 bg-[#0a0f1c]/95 px-4 py-2.5 text-left backdrop-blur-xl"
            >
              <GripHorizontal size={16} className="shrink-0 text-white/35" />

              <div className="flex items-center gap-1.5">
                <RailButton
                  active={railTab === 'bench'}
                  label="Bench"
                  count={bench.length}
                  onClick={(e) => {
                    e.stopPropagation()
                    setRailTab('bench')
                  }}
                />
                <RailButton
                  active={railTab === 'reserves'}
                  label="Reserves"
                  count={reserves.length}
                  onClick={(e) => {
                    e.stopPropagation()
                    setRailTab('reserves')
                  }}
                />
              </div>

              <span className="ml-auto hidden truncate text-[11px] text-white/45 sm:block">
                {selected
                  ? 'Click a player to swap them in, or drag a card onto the pitch.'
                  : benchExpanded
                  ? 'Click a card to pick, then click another to swap. Drag works too.'
                  : 'Hover to open the bench.'}
              </span>

              <ChevronUp
                size={16}
                className={
                  'shrink-0 text-white/45 transition-transform duration-300 ' +
                  (benchExpanded ? 'rotate-180' : '')
                }
              />
            </div>

            <div
              ref={panelRef}
              className="rounded-b-2xl border border-t-0 border-white/10 bg-[#0a0f1c]/95 px-4 pb-4 pt-3 shadow-float backdrop-blur-xl"
            >
              {railPlayers.length ? (
                <div className="scrollbar-thin overflow-x-auto pb-1">
                  <div className="mx-auto flex w-max gap-3">
                    {railPlayers.map((player) => (
                      <RailCard
                        key={player.id}
                        player={player}
                        team={team}
                        selected={selected?.playerId === player.id}
                        dimmed={Boolean(selected) && selected?.playerId !== player.id}
                        flashed={flashedIds.has(player.id)}
                        onSelect={() => selectOrSwap({ playerId: player.id, slotId: null })}
                        onOpen={() => openQuickLook(player)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-white/45">
                  No players here.
                </div>
              )}
            </div>
          </motion.div>
          </motion.div>

          <AnimatePresence>
            {playbookOpen ? (
              <PlaybookPanel
                plays={plays}
                feedback={feedback}
                activePlayId={activePlay?.id ?? null}
                accent={team?.primaryColor ?? '#3D7DFF'}
                onWatch={watchPlay}
                onClose={() => setPlaybookOpen(false)}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {activeSlot ? (
        <SquadPicker
          slot={activeSlot}
          squad={squad}
          lineup={lineup}
          team={team}
          onSelect={(playerId) => dropOnSlot(activeSlot.id, playerId)}
          onClose={() => setActiveSlot(null)}
        />
      ) : null}

      {quickLook ? (
        <PlayerQuickLook
          player={quickLook}
          team={getTeam(universe, quickLook.teamId)}
          onClose={() => setQuickLook(null)}
          onViewProfile={() => {
            const player = quickLook
            setQuickLook(null)
            openFullProfile(player)
          }}
        />
      ) : null}
    </div>
  )
}

// A pill toggle in the header for showing the run arrows and opening the squad
// drawer. The active state lights up in blue so the current view is obvious.
function ToggleButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean
  icon: typeof Spline
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ' +
        (active
          ? 'border-blue-400/60 bg-blue-500/20 text-white'
          : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white')
      }
    >
      <Icon size={16} className={active ? 'text-blue-300' : 'text-white/50'} />
      {label}
      {typeof count === 'number' ? (
        <span
          className={
            'rounded-full px-1.5 text-[11px] font-bold ' +
            (active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80')
          }
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      className="min-w-[88px] rounded-xl border border-white/10 bg-white/5 px-3.5 py-2"
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      <div className="text-[10px] uppercase tracking-widest text-white/45">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold leading-none text-white">{value}</div>
    </div>
  )
}

function RailButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ' +
        (active
          ? 'bg-blue-500 text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.7)]'
          : 'text-white/55 hover:bg-white/10 hover:text-white')
      }
    >
      {label}
      <span
        className={
          'rounded-full px-1.5 text-[11px] font-bold ' +
          (active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80')
        }
      >
        {count}
      </span>
    </button>
  )
}

// A bench or reserve card that joins the two tap swap. Clicking picks the player
// up (the card lifts and gets a bright ring); clicking again, or another card,
// completes the trade. While someone else is held this card dims so the held
// player stays the focus. A small button opens the full profile. Dragging onto
// the pitch still works through the wrapper.
function RailCard({
  player,
  team,
  selected,
  dimmed,
  flashed,
  onSelect,
  onOpen,
}: {
  player: Player
  team?: Team
  selected: boolean
  dimmed: boolean
  flashed: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  return (
    <motion.div
      draggable
      onDragStart={(e) =>
        (e as unknown as React.DragEvent).dataTransfer.setData(DRAG_MIME, player.id)
      }
      onClick={onSelect}
      className="group/rail relative cursor-pointer active:cursor-grabbing"
      animate={{
        scale: selected ? 1.06 : 1,
        y: selected ? -6 : 0,
        opacity: dimmed ? 0.55 : 1,
      }}
      whileHover={selected ? undefined : { y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      {selected ? (
        <motion.span
          className="pointer-events-none absolute -inset-1.5 z-10 rounded-[22px] border-2 border-white"
          style={{ boxShadow: '0 0 24px rgba(255,255,255,0.55)' }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.03, 1] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}

      <AnimatePresence>
        {flashed ? (
          <motion.span
            key="rail-flash"
            className="pointer-events-none absolute -inset-1.5 z-10 rounded-[22px] border-2 border-blue-300"
            style={{ boxShadow: '0 0 24px rgba(147,197,253,0.8)' }}
            initial={{ opacity: 0.9, scale: 1.1 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        ) : null}
      </AnimatePresence>

      <PlayerCard player={player} team={team} size="medium" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        title="Open profile"
        className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 opacity-0 shadow-lg ring-1 ring-black/10 transition-opacity hover:bg-blue-500 hover:text-white group-hover/rail:opacity-100"
      >
        <Maximize2 size={11} />
      </button>
    </motion.div>
  )
}
