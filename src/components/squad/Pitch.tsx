// The pitch: a deep, floodlit stadium surface with the starting eleven floating
// in their formation. Glowing chemistry links connect nearby players the way a
// FUT squad screen does and each token is a full player card.
//
// The pitch renders in two orientations. Portrait keeps the classic vertical
// shape (used by opponent scouting). Landscape spreads the eleven across a wide
// board so the squad fills the whole screen, which is where the tactical run
// arrows live: data driven overlaps, runs in behind, cut insides and more,
// derived from each player's attributes (see tacticalRuns.ts).
//
// Building the lineup is a two tap swap that spans the whole squad: tap any
// player to pick them up, then tap another to trade their spots. While a player
// is held, every other starter shows a colored ring rating how good that swap
// would be. Selection lives in the parent so the bench and reserve rail can join
// the same swap. This component is controlled.

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Plus, X } from 'lucide-react'
import clsx from 'clsx'
import type { DetailedPosition, Player, Team } from '../../data/types'
import type { Formation, FormationSlot } from './formations'
import type { Lineup, SquadSelection } from './lineup'
import { DRAG_MIME, fitTier } from './lineup'
import { PlayerCard } from './PlayerCard'
import type { TacticalRun, RunCategory } from './tacticalRuns'
import { RUN_CATEGORY_COLOR, RUN_CATEGORY_LABEL } from './tacticalRuns'
import type { Play } from './playbook'
import { PlayAnimator } from './PlayAnimator'

export type PitchOrientation = 'portrait' | 'landscape'

interface PitchProps {
  formation: Formation
  lineup: Lineup
  playersById: Map<string, Player>
  team?: Team
  onOpenPlayer: (player: Player) => void
  // When true the pitch fills its parent (used by the squad dashboard). When
  // false it keeps an aspect ratio at a capped width (used elsewhere).
  fill?: boolean
  // Portrait is the classic vertical board; landscape spreads wide.
  orientation?: PitchOrientation
  // Tactical run arrows to overlay, plus a flag to show or hide them.
  runs?: TacticalRun[]
  showRuns?: boolean
  // When set, the board hands over to the animated play and fades its tokens.
  activePlay?: Play | null
  onClosePlay?: () => void
  // Enlarges the player tokens on a roomy board.
  tokenScale?: number
  // Read only mode (opponent scouting) hides swap controls and drag handles.
  readOnly?: boolean
  // Swap interaction, all driven by the parent so the rail can take part.
  selected?: SquadSelection | null
  flashedIds?: Set<string>
  // A player token was tapped. slotId is the slot for starters, null otherwise.
  onPlayerClick?: (playerId: string, slotId: string | null) => void
  // An empty slot was tapped: drop the held player in, or open the picker.
  onEmptySlotClick?: (slot: FormationSlot) => void
  // Tapping the grass clears the current selection.
  onClearSelection?: () => void
  // A player was dropped onto a slot by dragging from another slot or the bench.
  onDropOnSlot?: (slotId: string, playerId: string) => void
}

interface Link {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Point {
  x: number
  y: number
}

// Maps a formation coordinate (x left to right, y attack to own goal) onto the
// screen. Portrait keeps it as is; landscape rotates so the team attacks left to
// right, which lets the eleven spread across a wide board.
function projectPoint(x: number, y: number, orientation: PitchOrientation): Point {
  if (orientation === 'landscape') return { x: 100 - y, y: x }
  return { x, y }
}

// Draws the chemistry links as a clean formation lattice instead of a tangle of
// crossing diagonals. Slots are first grouped into horizontal lines (the back
// line, the midfield, the front line and so on). We then link players along each
// line left to right, and link each player only to the closest player in the
// line directly ahead and directly behind. Keeping the links local to
// neighbouring lines is what makes the shape easy to read.
function buildLinks(slots: FormationSlot[]): Link[] {
  if (slots.length < 2) return []

  // Walking from the attack toward goal, start a new line whenever the gap to
  // the previous slot is large enough to read as a separate band.
  const BAND_GAP = 8
  const sorted = [...slots].sort((a, b) => a.y - b.y)
  const bands: FormationSlot[][] = []
  let current: FormationSlot[] = []
  let prevY = Number.NEGATIVE_INFINITY
  for (const slot of sorted) {
    if (current.length && slot.y - prevY > BAND_GAP) {
      bands.push(current)
      current = []
    }
    current.push(slot)
    prevY = slot.y
  }
  if (current.length) bands.push(current)

  const seen = new Set<string>()
  const links: Link[] = []
  const add = (a: FormationSlot, b: FormationSlot) => {
    if (a.id === b.id) return
    const key = [a.id, b.id].sort().join('-')
    if (seen.has(key)) return
    seen.add(key)
    links.push({ key, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  // Links along each line, left to right.
  for (const band of bands) {
    const row = [...band].sort((a, b) => a.x - b.x)
    for (let i = 0; i < row.length - 1; i += 1) add(row[i], row[i + 1])
  }

  // Links between neighbouring lines: each player reaches the closest player in
  // the line ahead and the closest behind, so the mesh stays short and tidy.
  const nearestIn = (slot: FormationSlot, group: FormationSlot[]) =>
    group.reduce((best, s) =>
      Math.hypot(slot.x - s.x, slot.y - s.y) <
      Math.hypot(slot.x - best.x, slot.y - best.y)
        ? s
        : best,
    )
  for (let b = 0; b < bands.length - 1; b += 1) {
    for (const slot of bands[b]) add(slot, nearestIn(slot, bands[b + 1]))
    for (const slot of bands[b + 1]) add(slot, nearestIn(slot, bands[b]))
  }

  return links
}

type Verdict = 'good' | 'ok' | 'bad'

const VERDICTS: Record<Verdict, { ring: string; glow: string; label: string }> = {
  good: { ring: '#34d399', glow: 'rgba(52,211,153,0.55)', label: 'Strong fit' },
  ok: { ring: '#fbbf24', glow: 'rgba(251,191,36,0.5)', label: 'Out of position' },
  bad: { ring: '#ef4444', glow: 'rgba(239,68,68,0.55)', label: "Doesn't fit there" },
}

// Rates a potential swap by the worse of the two resulting fits: the held player
// moving into the target's position, and the target moving into the held spot.
function verdictOf(
  source: Player,
  sourcePos: DetailedPosition,
  target: Player,
  targetPos: DetailedPosition,
): Verdict {
  const tiers = [fitTier(source, targetPos), fitTier(target, sourcePos)]
  if (tiers.includes('out')) return 'bad'
  if (tiers.includes('group')) return 'ok'
  return 'good'
}

const SWAP_SPRING = { type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.7 }

// Tracks an element's pixel size so the run arrows can be drawn crisply in real
// coordinates rather than a stretched percentage viewbox.
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

export function Pitch({
  formation,
  lineup,
  playersById,
  team,
  onOpenPlayer,
  fill = false,
  orientation = 'portrait',
  runs = [],
  showRuns = false,
  activePlay = null,
  onClosePlay,
  tokenScale = 1,
  readOnly = false,
  selected = null,
  flashedIds,
  onPlayerClick,
  onEmptySlotClick,
  onClearSelection,
  onDropOnSlot,
}: PitchProps) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>()

  const swappable = !readOnly && Boolean(onDropOnSlot)
  const accent = team?.primaryColor ?? '#34d399'
  const links = useMemo(() => buildLinks(formation.slots), [formation.slots])
  const project = (x: number, y: number) => projectPoint(x, y, orientation)

  const selectedPlayer = selected ? playersById.get(selected.playerId) ?? null : null
  // The position the held player is leaving from: their slot if they start, else
  // their natural position when they are coming off the bench or reserves.
  const selectedPos: DetailedPosition | null = selected
    ? selected.slotId
      ? formation.slots.find((s) => s.id === selected.slotId)?.pos ?? null
      : selectedPlayer?.primaryPosition ?? null
    : null

  const visibleRuns = showRuns && !selectedPlayer && !activePlay ? runs : []
  const activeCategories = useMemo(() => {
    const set = new Set<RunCategory>()
    for (const run of visibleRuns) set.add(run.category)
    return [...set]
  }, [visibleRuns])

  function handleDrop(slotId: string, e: React.DragEvent) {
    e.preventDefault()
    setDragOverSlot(null)
    const playerId = e.dataTransfer.getData(DRAG_MIME)
    if (playerId && onDropOnSlot) onDropOnSlot(slotId, playerId)
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative overflow-hidden rounded-[28px] ring-1 ring-white/10 shadow-float',
        fill
          ? 'h-full w-full'
          : orientation === 'landscape'
            ? 'mx-auto aspect-[16/10] w-full'
            : 'mx-auto aspect-[3/4] w-full max-w-[560px]',
      )}
      onClick={() => onClearSelection?.()}
    >
      <PitchSurface orientation={orientation} />

      {/* glowing chemistry links behind the tokens, hidden while a play runs */}
      <svg
        className={clsx(
          'pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300',
          activePlay && 'opacity-0',
        )}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {links.map((link) => {
          const a = project(link.x1, link.y1)
          const b = project(link.x2, link.y2)
          return (
            <g key={link.key}>
              {/* soft team coloured glow grounds the link to the club */}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={accent} strokeWidth={6} strokeLinecap="round" opacity={0.22} vectorEffect="non-scaling-stroke" />
              {/* crisp near white core stays legible on the grass for any club */}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
      </svg>

      {/* data driven tactical run arrows, drawn in real pixels for crisp heads */}
      <TacticalArrows
        runs={visibleRuns}
        size={containerSize}
        project={project}
      />

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-7xl font-black tracking-tighter text-white/[0.06]">
        {formation.name}
      </div>

      {!activePlay && formation.slots.map((slot) => {
        const playerId = lineup[slot.id]
        const player = playerId ? playersById.get(playerId) : undefined
        const isOver = dragOverSlot === slot.id
        const pos = project(slot.x, slot.y)

        if (!player) {
          return (
            <div
              key={slot.id}
              className="absolute flex h-0 w-0 items-center justify-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: 5 }}
              onDragOver={
                swappable
                  ? (e) => {
                      e.preventDefault()
                      setDragOverSlot(slot.id)
                    }
                  : undefined
              }
              onDragLeave={swappable ? () => setDragOverSlot(null) : undefined}
              onDrop={swappable ? (e) => handleDrop(slot.id, e) : undefined}
            >
              <div className="flex flex-col items-center">
                {readOnly ? (
                  <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 text-white/50">
                    <span className="text-[10px] font-semibold uppercase">{slot.pos}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEmptySlotClick?.(slot)
                    }}
                    className={clsx(
                      'flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-black/20 text-white/70 backdrop-blur-sm transition-colors',
                      isOver || selectedPlayer
                        ? 'border-blue-400 text-white'
                        : 'border-white/30 hover:border-white hover:text-white',
                    )}
                  >
                    <Plus size={18} />
                    <span className="mt-1 text-[10px] font-semibold uppercase">
                      {slot.pos}
                    </span>
                  </button>
                )}
                <span className="mt-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/90 ring-1 ring-white/10 backdrop-blur-sm">
                  {slot.pos}
                </span>
              </div>
            </div>
          )
        }

        const isSelected = selected?.slotId === slot.id
        const isHovered = hoveredId === player.id
        const flashed = flashedIds?.has(player.id) ?? false
        const verdict =
          selectedPlayer && selectedPos && !isSelected
            ? verdictOf(selectedPlayer, selectedPos, player, slot.pos)
            : null
        const zIndex = isSelected ? 50 : isHovered ? 40 : flashed ? 30 : 10

        return (
          <motion.div
            key={player.id}
            layout
            transition={SWAP_SPRING}
            className="absolute flex h-0 w-0 items-center justify-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex }}
            onDragOver={
              swappable
                ? (e) => {
                    e.preventDefault()
                    setDragOverSlot(slot.id)
                  }
                : undefined
            }
            onDragLeave={swappable ? () => setDragOverSlot(null) : undefined}
            onDrop={swappable ? (e) => handleDrop(slot.id, e) : undefined}
          >
            <div className="flex flex-col items-center">
              <motion.div
                className="group/slot relative cursor-pointer"
                onHoverStart={() => setHoveredId(player.id)}
                onHoverEnd={() => setHoveredId((id) => (id === player.id ? null : id))}
                onClick={(e) => {
                  e.stopPropagation()
                  if (readOnly) {
                    onOpenPlayer(player)
                    return
                  }
                  onPlayerClick?.(player.id, slot.id)
                }}
                animate={isSelected ? { scale: 1.12, y: -10 } : { scale: 1, y: 0 }}
                whileHover={isSelected ? undefined : { scale: 1.09, y: -6 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              >
                {/* soft glow grounding the token on the grass */}
                <span
                  className="pointer-events-none absolute -inset-2 -z-10 rounded-full blur-lg"
                  style={{
                    background: `radial-gradient(circle, ${accent}66, transparent 70%)`,
                    opacity: isSelected || isHovered ? 0.85 : 0.4,
                  }}
                />

                {/* fit ring shown while another player is held for a swap */}
                <AnimatePresence>
                  {verdict ? (
                    <motion.span
                      key="verdict-ring"
                      className="pointer-events-none absolute -inset-1.5 rounded-2xl border-2"
                      style={{
                        borderColor: VERDICTS[verdict].ring,
                        boxShadow: `0 0 18px ${VERDICTS[verdict].glow}`,
                      }}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{
                        opacity: { duration: 0.16 },
                        scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                      }}
                    />
                  ) : null}
                </AnimatePresence>

                {/* the held player gets a bright pulsing ring */}
                {isSelected ? (
                  <motion.span
                    className="pointer-events-none absolute -inset-2 rounded-2xl border-2 border-white"
                    style={{ boxShadow: '0 0 26px rgba(255,255,255,0.6)' }}
                    animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : null}

                {/* quick flash right after a swap lands */}
                <AnimatePresence>
                  {flashed ? (
                    <motion.span
                      key="flash"
                      className="pointer-events-none absolute -inset-1.5 rounded-2xl border-2 border-blue-300"
                      style={{ boxShadow: '0 0 24px rgba(147,197,253,0.8)' }}
                      initial={{ opacity: 0.9, scale: 1.12 }}
                      animate={{ opacity: 0, scale: 1 }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                    />
                  ) : null}
                </AnimatePresence>

                <div style={tokenScale === 1 ? undefined : { transform: `scale(${tokenScale})` }}>
                  <PlayerCard player={player} team={team} size="pitch" />
                </div>

                {readOnly ? null : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenPlayer(player)
                    }}
                    title="Open profile"
                    className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 opacity-0 shadow-lg ring-1 ring-black/10 transition-opacity hover:bg-blue-500 hover:text-white group-hover/slot:opacity-100"
                  >
                    <Maximize2 size={11} />
                  </button>
                )}
              </motion.div>

              <span className="mt-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/90 ring-1 ring-white/10 backdrop-blur-sm">
                {slot.pos}
              </span>

              {/* verdict label floats up while you hover a swap target */}
              <AnimatePresence>
                {verdict && isHovered ? (
                  <motion.span
                    key="verdict-label"
                    className="pointer-events-none absolute -bottom-7 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg"
                    style={{ backgroundColor: VERDICTS[verdict].ring }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14 }}
                  >
                    {VERDICTS[verdict].label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}

      {/* legend for the run colours, shown only when arrows are on */}
      <AnimatePresence>
        {activeCategories.length ? (
          <motion.div
            className="pointer-events-none absolute left-4 top-4 z-[55] flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/55 px-3 py-2.5 backdrop-blur"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/45">
              Player runs
            </span>
            {activeCategories.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <span
                  className="h-1 w-5 rounded-full"
                  style={{ backgroundColor: RUN_CATEGORY_COLOR[category] }}
                />
                <span className="text-[11px] font-semibold text-white/80">
                  {RUN_CATEGORY_LABEL[category]}
                </span>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* swap mode banner */}
      <AnimatePresence>
        {selectedPlayer ? (
          <motion.div
            className="absolute left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-black/70 py-2 pl-4 pr-2 shadow-float backdrop-blur"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
            </span>
            <span className="text-xs font-medium text-white">
              <span className="font-bold">{selectedPlayer.lastName}</span> is selected. Click
              another player to swap.
            </span>
            <button
              type="button"
              onClick={() => onClearSelection?.()}
              title="Cancel"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X size={13} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* the animated AI play takes over the board when one is selected */}
      <AnimatePresence>
        {activePlay ? (
          <motion.div
            key="play-animator"
            className="absolute inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PlayAnimator
              play={activePlay}
              size={containerSize}
              project={project}
              accent={accent}
              onClose={() => onClosePlay?.()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

// Draws the tactical run arrows in real pixels. Each run is a gently bowed arc
// with a flowing dashed shaft and a solid arrowhead at the destination, plus a
// small stat pill near the middle so the trigger numbers stay visible.
function TacticalArrows({
  runs,
  size,
  project,
}: {
  runs: TacticalRun[]
  size: { width: number; height: number }
  project: (x: number, y: number) => Point
}) {
  if (!runs.length || size.width === 0 || size.height === 0) return null

  const toPx = (x: number, y: number) => {
    const p = project(x, y)
    return { x: (p.x / 100) * size.width, y: (p.y / 100) * size.height }
  }
  const bowScale = Math.min(size.width, size.height) * 0.16
  const headLen = 13
  const headWidth = 8

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
      width={size.width}
      height={size.height}
    >
      {runs.map((run, index) => {
        const start = toPx(run.from.x, run.from.y)
        const end = toPx(run.to.x, run.to.y)
        const dx = end.x - start.x
        const dy = end.y - start.y
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        // Perpendicular to bow the arc to one side.
        const nx = -uy
        const ny = ux
        const bow = run.curve * bowScale
        const cx = (start.x + end.x) / 2 + nx * bow
        const cy = (start.y + end.y) / 2 + ny * bow

        // Tangent at the end of the quadratic curve sets the arrowhead angle.
        const tx = end.x - cx
        const ty = end.y - cy
        const tlen = Math.hypot(tx, ty) || 1
        const hx = tx / tlen
        const hy = ty / tlen
        const back = { x: end.x - hx * headLen, y: end.y - hy * headLen }
        const phx = -hy
        const phy = hx
        const headPoints = [
          `${end.x},${end.y}`,
          `${back.x + phx * headWidth},${back.y + phy * headWidth}`,
          `${back.x - phx * headWidth},${back.y - phy * headWidth}`,
        ].join(' ')

        const color = RUN_CATEGORY_COLOR[run.category]
        const pill = { x: (start.x + cx) / 2, y: (start.y + cy) / 2 }

        return (
          <motion.g
            key={run.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {/* soft underglow */}
            <path
              d={`M ${start.x} ${start.y} Q ${cx} ${cy} ${back.x} ${back.y}`}
              fill="none"
              stroke={color}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.18}
            />
            {/* flowing dashed shaft */}
            <path
              className="fv-run-dash"
              d={`M ${start.x} ${start.y} Q ${cx} ${cy} ${back.x} ${back.y}`}
              fill="none"
              stroke={color}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeDasharray="7 6"
            />
            <polygon points={headPoints} fill={color} />
            {/* origin dot */}
            <circle cx={start.x} cy={start.y} r={3} fill={color} />
            {/* stat pill */}
            <g transform={`translate(${pill.x}, ${pill.y})`}>
              <rect x={-runPillWidth(run) / 2} y={-9} width={runPillWidth(run)} height={18} rx={9} fill="rgba(5,8,15,0.82)" stroke={color} strokeOpacity={0.5} />
              <text x={0} y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
                {run.label}
              </text>
            </g>
          </motion.g>
        )
      })}
    </svg>
  )
}

// Rough pill width from the label length so the rounded background fits the text.
function runPillWidth(run: TacticalRun): number {
  return Math.max(54, run.label.length * 6.6 + 16)
}

// Floodlit grass: mowed stripes, a soft top spotlight, white field lines and a
// vignette that darkens the edges so the players pop off the surface. The field
// markings rotate with the orientation so landscape reads as a side on pitch.
function PitchSurface({ orientation }: { orientation: PitchOrientation }) {
  const landscape = orientation === 'landscape'
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: landscape
            ? 'repeating-linear-gradient(90deg, #1a8a47 0%, #1a8a47 7%, #16793d 7%, #16793d 14%)'
            : 'repeating-linear-gradient(180deg, #1a8a47 0%, #1a8a47 7%, #16793d 7%, #16793d 14%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 70% at 50% -10%, rgba(120,255,170,0.22), transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(150% 120% at 50% 45%, transparent 50%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <div className="absolute inset-5 rounded-2xl border-2 border-white/25" />

      {landscape ? (
        <>
          {/* halfway line, centre circle and spot */}
          <div className="absolute left-1/2 top-5 bottom-5 w-0 border-l-2 border-white/25" />
          <div className="absolute left-1/2 top-1/2 h-[34%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
          {/* penalty boxes on the two goal lines */}
          <div className="absolute left-5 top-1/2 h-[58%] w-[18%] -translate-y-1/2 border-2 border-l-0 border-white/25" />
          <div className="absolute right-5 top-1/2 h-[58%] w-[18%] -translate-y-1/2 border-2 border-r-0 border-white/25" />
          {/* six yard boxes */}
          <div className="absolute left-5 top-1/2 h-[28%] w-[7%] -translate-y-1/2 border-2 border-l-0 border-white/25" />
          <div className="absolute right-5 top-1/2 h-[28%] w-[7%] -translate-y-1/2 border-2 border-r-0 border-white/25" />
        </>
      ) : (
        <>
          <div className="absolute left-5 right-5 top-1/2 h-0 border-t-2 border-white/25" />
          <div className="absolute left-1/2 top-1/2 h-[18%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
          <div className="absolute left-1/2 top-5 h-[20%] w-[58%] -translate-x-1/2 border-2 border-t-0 border-white/25" />
          <div className="absolute bottom-5 left-1/2 h-[20%] w-[58%] -translate-x-1/2 border-2 border-b-0 border-white/25" />
          <div className="absolute left-1/2 top-5 h-[8%] w-[30%] -translate-x-1/2 border-2 border-t-0 border-white/25" />
          <div className="absolute bottom-5 left-1/2 h-[8%] w-[30%] -translate-x-1/2 border-2 border-b-0 border-white/25" />
        </>
      )}
    </div>
  )
}
