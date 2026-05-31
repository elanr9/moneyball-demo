// The AI playbook drawer. It lists the generated plays and drills for the
// current eleven, split into match plays and training, each as a card with a
// plain explanation, a squad fit score, the step by step breakdown, a watch
// button that animates it on the pitch, and a thumbs up or down that teaches the
// model what the coach likes. Cards are ranked by their tuned score so the plays
// the coach responds well to climb over time.

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Crosshair,
  Flame,
  MoveHorizontal,
  Play as PlayIcon,
  Repeat,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import type { Play, PlayFocus, PlayKind } from './playbook'
import { FOCUS_META } from './playbook'
import { rankPlays } from './playFeedback'
import type { PlaybookFeedback } from './playFeedback'

const FOCUS_ICON: Record<PlayFocus, typeof Zap> = {
  wide: MoveHorizontal,
  central: Crosshair,
  transition: Zap,
  pressing: Flame,
  finishing: Target,
  possession: Repeat,
}

interface PlaybookPanelProps {
  plays: Play[]
  feedback: PlaybookFeedback
  activePlayId: string | null
  onWatch: (play: Play) => void
  onClose: () => void
  accent: string
}

export function PlaybookPanel({
  plays,
  feedback,
  activePlayId,
  onWatch,
  onClose,
  accent,
}: PlaybookPanelProps) {
  const [tab, setTab] = useState<PlayKind>('attack')

  const ranked = useMemo(
    () => rankPlays(plays, feedback.adjustmentFor),
    [plays, feedback],
  )
  const visible = ranked.filter((p) => p.kind === tab)
  const attackCount = plays.filter((p) => p.kind === 'attack').length
  const drillCount = plays.filter((p) => p.kind === 'drill').length

  return (
    <motion.aside
      className="absolute right-3 top-3 bottom-3 z-40 flex w-[400px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1c]/95 shadow-float backdrop-blur-xl"
      initial={{ x: 424, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 424, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 36 }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white">AI Playbook</div>
          <div className="truncate text-[11px] text-white/45">
            Plays and drills tuned to your eleven
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <LearningBanner signalCount={feedback.signalCount} />

      <div className="flex items-center gap-1.5 px-3 pb-1 pt-3">
        <TabButton active={tab === 'attack'} label="Match Plays" count={attackCount} onClick={() => setTab('attack')} />
        <TabButton active={tab === 'drill'} label="Training" count={drillCount} onClick={() => setTab('drill')} />
      </div>

      <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto p-3">
        {visible.map((play) => (
          <PlayCard
            key={play.id}
            play={play}
            adjustment={feedback.adjustmentFor(play)}
            vote={feedback.voteFor(play.id)}
            isActive={activePlayId === play.id}
            accent={accent}
            onWatch={() => onWatch(play)}
            onVote={(dir) => feedback.vote(play, dir)}
          />
        ))}
      </div>
    </motion.aside>
  )
}

function LearningBanner({ signalCount }: { signalCount: number }) {
  return (
    <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-300 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
      </span>
      <p className="text-[11px] leading-snug text-blue-100/80">
        {signalCount === 0
          ? 'Rate plays up or down and the model learns what your team likes.'
          : `Learning from ${signalCount} of your ratings to rank what fits best.`}
      </p>
    </div>
  )
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-blue-500 text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.7)]'
          : 'text-white/55 hover:bg-white/10 hover:text-white',
      )}
    >
      {label}
      <span
        className={clsx(
          'rounded-full px-1.5 text-[11px] font-bold',
          active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80',
        )}
      >
        {count}
      </span>
    </button>
  )
}

function PlayCard({
  play,
  adjustment,
  vote,
  isActive,
  accent,
  onWatch,
  onVote,
}: {
  play: Play
  adjustment: number
  vote: 1 | -1 | null
  isActive: boolean
  accent: string
  onWatch: () => void
  onVote: (dir: 1 | -1) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = FOCUS_META[play.focus]
  const Icon = FOCUS_ICON[play.focus]
  const tuned = Math.max(5, Math.min(99, play.confidence + adjustment))

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white/[0.03] p-3 transition-colors',
        isActive ? 'border-blue-400/60 bg-blue-500/10' : 'border-white/10',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          <Icon size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-white">{play.title}</h3>
            <FitScore value={tuned} adjustment={adjustment} color={meta.color} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            <span style={{ color: meta.color }}>{meta.label}</span>
            <span>·</span>
            <span>{play.difficulty}</span>
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-[13px] leading-snug text-white/75">{play.summary}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {play.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/65"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
        <Sparkles size={12} className="shrink-0 text-blue-300" />
        <span className="text-[11px] leading-snug text-white/55">{play.why}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/45 transition-colors hover:text-white/80"
      >
        <span>{play.steps.length} step breakdown</span>
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.ol
            className="mt-1 space-y-2 overflow-hidden border-l border-white/10 pl-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {play.steps.map((step, i) => (
              <li key={step.label} className="relative">
                <span
                  className="absolute -left-[18px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-ink-900"
                  style={{ backgroundColor: meta.color }}
                >
                  {i + 1}
                </span>
                <div className="text-[12px] font-semibold text-white/90">{step.label}</div>
                <div className="text-[11px] leading-snug text-white/55">{step.caption}</div>
              </li>
            ))}
          </motion.ol>
        ) : null}
      </AnimatePresence>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onWatch}
          className={clsx(
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-colors',
            isActive
              ? 'bg-white/15 text-white'
              : 'text-white hover:brightness-110',
          )}
          style={isActive ? undefined : { backgroundColor: accent }}
        >
          <PlayIcon size={15} />
          {isActive ? 'Playing' : 'Watch on pitch'}
        </button>

        <VoteButton active={vote === 1} tone="up" onClick={() => onVote(1)} />
        <VoteButton active={vote === -1} tone="down" onClick={() => onVote(-1)} />
      </div>
    </div>
  )
}

function FitScore({
  value,
  adjustment,
  color,
}: {
  value: number
  adjustment: number
  color: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {adjustment !== 0 ? (
        <span
          className={clsx(
            'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
            adjustment > 0 ? 'bg-fv-green/15 text-fv-green' : 'bg-fv-red/15 text-fv-red',
          )}
          title="Adjusted from your feedback"
        >
          {adjustment > 0 ? `+${adjustment}` : adjustment}
        </span>
      ) : null}
      <div className="text-right leading-none">
        <span className="font-mono text-base font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
        <div className="text-[8px] font-semibold uppercase tracking-widest text-white/35">Fit</div>
      </div>
    </div>
  )
}

function VoteButton({
  active,
  tone,
  onClick,
}: {
  active: boolean
  tone: 'up' | 'down'
  onClick: () => void
}) {
  const up = tone === 'up'
  return (
    <button
      type="button"
      onClick={onClick}
      title={up ? 'This fits us' : 'Not for us'}
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
        active
          ? up
            ? 'border-fv-green/50 bg-fv-green/15 text-fv-green'
            : 'border-fv-red/50 bg-fv-red/15 text-fv-red'
          : 'border-white/10 bg-white/5 text-white/45 hover:bg-white/10 hover:text-white',
      )}
    >
      {up ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />}
    </button>
  )
}
