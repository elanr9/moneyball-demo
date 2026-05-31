// The cinematic play animator. It takes one play from the AI playbook and runs
// it as a step by step animation over the squad pitch: player markers and the
// ball glide to their next spots, the current movement is drawn as a flowing
// path, and a caption explains the step in one plain sentence. The coach can let
// it loop or scrub through with the controls.
//
// It renders inside the pitch container and borrows the same projection and
// pixel size as the pitch, so every coordinate lines up with the formation. The
// real player tokens fade out underneath while a play is on screen.

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play as PlayIcon, RotateCcw, SkipBack, SkipForward, X } from 'lucide-react'
import type { Play, PlayActor } from './playbook'
import { FOCUS_META, buildFrames } from './playbook'

interface Point {
  x: number
  y: number
}

interface PlayAnimatorProps {
  play: Play
  size: { width: number; height: number }
  project: (x: number, y: number) => Point
  accent: string
  onClose: () => void
}

// Pause between steps once the motion settles, so each beat reads clearly.
const HOLD_MS = 380
const PASS_COLOR = '#fde68a'

export function PlayAnimator({ play, size, project, accent, onClose }: PlayAnimatorProps) {
  const frames = useMemo(() => buildFrames(play), [play])
  const stepCount = play.steps.length

  // frameIndex 0 is the starting shape; frame k is the shape after step k.
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  // Used to snap back to the start with no visible motion before a loop.
  const [resetting, setResetting] = useState(false)

  // Start fresh whenever the coach opens a different play.
  useEffect(() => {
    setFrameIndex(0)
    setPlaying(true)
    setResetting(false)
  }, [play.id])

  useEffect(() => {
    if (!playing) return
    if (resetting) {
      const t = window.setTimeout(() => {
        setResetting(false)
        setFrameIndex(1)
      }, 40)
      return () => window.clearTimeout(t)
    }
    if (frameIndex >= stepCount) {
      const t = window.setTimeout(() => {
        setResetting(true)
        setFrameIndex(0)
      }, 1000)
      return () => window.clearTimeout(t)
    }
    const dur = frameIndex === 0 ? 260 : play.steps[frameIndex - 1].durationMs
    const t = window.setTimeout(() => setFrameIndex((i) => i + 1), dur + HOLD_MS)
    return () => window.clearTimeout(t)
  }, [playing, frameIndex, resetting, stepCount, play])

  const ready = size.width > 0 && size.height > 0
  const toPx = (p: Point) => {
    const proj = project(p.x, p.y)
    return { x: (proj.x / 100) * size.width, y: (proj.y / 100) * size.height }
  }

  const markerSize = Math.round(Math.max(28, Math.min(46, size.width * 0.034)))
  const ballSize = Math.round(markerSize * 0.46)

  const positions = frames[Math.min(frameIndex, frames.length - 1)]
  const activeStep = frameIndex > 0 ? play.steps[frameIndex - 1] : null
  const focusColor = FOCUS_META[play.focus].color

  // The arrows for the step we just animated into, drawn from the previous frame
  // to each movement target so the coach sees the action of this beat.
  const arrows = useMemo(() => {
    if (!ready || frameIndex === 0 || resetting) return []
    const prev = frames[frameIndex - 1]
    const step = play.steps[frameIndex - 1]
    return step.movements.map((move, i) => {
      const from = toPx(prev[move.actorId])
      const to = toPx(move.to)
      const color = move.kind === 'pass' ? PASS_COLOR : move.kind === 'run' ? accent : focusColor
      return { key: `${frameIndex}-${i}`, from, to, color, kind: move.kind }
    })
    // toPx is derived from size/project which are stable for a given render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, frameIndex, resetting, frames, play, accent, focusColor, size.width, size.height])

  if (!ready) return null

  const transitionFor = (): { duration: number; ease: [number, number, number, number] } => {
    if (resetting) return { duration: 0, ease: [0.4, 0, 0.2, 1] }
    const ms = frameIndex === 0 ? 260 : play.steps[frameIndex - 1].durationMs
    return { duration: ms / 1000, ease: [0.45, 0, 0.25, 1] }
  }
  const transition = transitionFor()

  return (
    <div className="absolute inset-0 z-[70]">
      {/* scrim so the choreography pops off the grass */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-black/45 via-black/35 to-black/55" />

      {/* drawn paths for the current step */}
      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" width={size.width} height={size.height}>
        <AnimatePresence>
          {arrows.map((arrow) => (
            <motion.line
              key={arrow.key}
              x1={arrow.from.x}
              y1={arrow.from.y}
              x2={arrow.to.x}
              y2={arrow.to.y}
              stroke={arrow.color}
              strokeWidth={arrow.kind === 'pass' ? 2.4 : 3}
              strokeLinecap="round"
              strokeDasharray={arrow.kind === 'pass' ? '2 8' : '9 7'}
              className={arrow.kind === 'pass' ? undefined : 'fv-run-dash'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* markers for every actor */}
      {play.actors.map((actor) => {
        const px = toPx(positions[actor.id])
        return (
          <motion.div
            key={actor.id}
            className="pointer-events-none absolute z-[10]"
            style={{ x: '-50%', y: '-50%' }}
            initial={false}
            animate={{ left: `${(px.x / size.width) * 100}%`, top: `${(px.y / size.height) * 100}%` }}
            transition={transition}
          >
            <Marker actor={actor} size={markerSize} ballSize={ballSize} accent={accent} />
          </motion.div>
        )
      })}

      {/* title and close */}
      <div className="absolute left-4 top-4 z-[20] flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 backdrop-blur">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: focusColor }} />
        <span className="text-xs font-bold uppercase tracking-wide text-white">{play.title}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        title="Close play"
        className="absolute right-4 top-4 z-[20] flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
      >
        <X size={16} />
      </button>

      {/* caption and controls */}
      <div className="absolute inset-x-0 bottom-4 z-[20] flex justify-center px-4">
        <div className="w-full max-w-[560px] rounded-2xl border border-white/12 bg-black/70 p-4 shadow-float backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-ink-900"
              style={{ backgroundColor: focusColor }}
            >
              {frameIndex === 0 ? 'AI' : frameIndex}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">
                {activeStep ? activeStep.label : 'Starting shape'}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={frameIndex}
                  className="mt-0.5 text-[13px] leading-snug text-white/75"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeStep ? activeStep.caption : play.summary}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {play.steps.map((step, i) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => {
                    setPlaying(false)
                    setResetting(false)
                    setFrameIndex(i + 1)
                  }}
                  title={step.label}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: frameIndex === i + 1 ? 22 : 10,
                    backgroundColor: frameIndex >= i + 1 ? focusColor : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <ControlButton
                title="Restart"
                onClick={() => {
                  setResetting(false)
                  setFrameIndex(0)
                  setPlaying(true)
                }}
              >
                <RotateCcw size={15} />
              </ControlButton>
              <ControlButton
                title="Previous step"
                disabled={frameIndex <= 0}
                onClick={() => {
                  setPlaying(false)
                  setResetting(false)
                  setFrameIndex((i) => Math.max(0, i - 1))
                }}
              >
                <SkipBack size={15} />
              </ControlButton>
              <ControlButton
                title={playing ? 'Pause' : 'Play'}
                primary
                onClick={() => {
                  if (frameIndex >= stepCount) setFrameIndex(0)
                  setResetting(false)
                  setPlaying((p) => !p)
                }}
              >
                {playing ? <Pause size={16} /> : <PlayIcon size={16} />}
              </ControlButton>
              <ControlButton
                title="Next step"
                disabled={frameIndex >= stepCount}
                onClick={() => {
                  setPlaying(false)
                  setResetting(false)
                  setFrameIndex((i) => Math.min(stepCount, i + 1))
                }}
              >
                <SkipForward size={15} />
              </ControlButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Marker({
  actor,
  size,
  ballSize,
  accent,
}: {
  actor: PlayActor
  size: number
  ballSize: number
  accent: string
}) {
  if (actor.category === 'ball') {
    return (
      <div
        className="rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)] ring-2 ring-black/20"
        style={{ width: ballSize, height: ballSize }}
      />
    )
  }

  if (actor.category === 'cone') {
    const s = Math.round(size * 0.5)
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${s / 2}px solid transparent`,
          borderRight: `${s / 2}px solid transparent`,
          borderBottom: `${s}px solid #f97316`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}
      />
    )
  }

  if (actor.category === 'defender') {
    const s = Math.round(size * 0.82)
    return (
      <div
        className="flex items-center justify-center rounded-full bg-slate-700 text-white/80 ring-2 ring-slate-400/40"
        style={{ width: s, height: s }}
      >
        <span className="text-[11px] font-black">x</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded-full font-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] ring-2 ring-white/70"
        style={{
          width: size,
          height: size,
          backgroundColor: accent,
          fontSize: Math.round(size * 0.34),
        }}
      >
        {actor.label}
      </div>
      {actor.name ? (
        <span className="mt-1 max-w-[84px] truncate rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90 ring-1 ring-white/10">
          {actor.name}
        </span>
      ) : null}
    </div>
  )
}

function ControlButton({
  children,
  title,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={
        'flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30 ' +
        (primary
          ? 'h-10 w-10 bg-blue-500 text-white hover:bg-blue-400'
          : 'h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white')
      }
    >
      {children}
    </button>
  )
}
