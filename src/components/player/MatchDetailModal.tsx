// Full match breakdown for a single appearance. Opens from the per match log.
// Shows a pitch with three switchable overlays (heat map, shot map, touch map)
// generated deterministically from the player's stat line, plus every metric
// FieldVision logged that game. This is the "see how they played" moment.

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { Player, PlayerMatchStat, Team } from '../../data/types'
import { buildMatchViz, heatColor } from '../../data/matchViz'
import type { VizShot } from '../../data/matchViz'
import { dateLabel } from '../league/league'
import { TeamCrest } from '../league/TeamCrest'
import { RatingBadge } from '../ui/RatingBadge'
import { StatTile } from '../ui/StatTile'

interface MatchDetailModalProps {
  player: Player
  match: PlayerMatchStat
  opponent?: Team
  onClose: () => void
}

type ViewId = 'heat' | 'shots' | 'touches'

const VIEWS: Array<{ id: ViewId; label: string }> = [
  { id: 'heat', label: 'Heat Map' },
  { id: 'shots', label: 'Shot Map' },
  { id: 'touches', label: 'Touch Map' },
]

export function MatchDetailModal({ player, match, opponent, onClose }: MatchDetailModalProps) {
  const [view, setView] = useState<ViewId>('heat')
  const viz = useMemo(() => buildMatchViz(player, match), [player, match])

  const role = match.started ? 'Started' : 'Substitute'
  const involvement: string[] = []
  if (match.goals > 0) involvement.push(`${match.goals} ${match.goals === 1 ? 'goal' : 'goals'}`)
  if (match.assists > 0)
    involvement.push(`${match.assists} ${match.assists === 1 ? 'assist' : 'assists'}`)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-navy-600 px-6 py-4">
          <div className="min-w-0">
            <div className="section-label text-blue-500">Match Breakdown</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-100">
              <span className="text-ink-300">{dateLabel(match.date)}</span>
              <span className="text-ink-300">vs</span>
              {opponent ? (
                <span className="inline-flex items-center gap-2 font-semibold">
                  <TeamCrest team={opponent} size="sm" />
                  {opponent.shortName}
                </span>
              ) : (
                <span className="font-semibold">{match.opponentTeamId}</span>
              )}
              <span className="rounded bg-navy-700 px-2 py-0.5 text-[11px] uppercase tracking-widest text-ink-300">
                {role} · {match.minutes}'
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RatingBadge rating={match.rating} size="lg" />
            <button
              type="button"
              onClick={onClose}
              className="text-ink-300 transition-colors hover:text-ink-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-auto p-6">
          {involvement.length ? (
            <div className="mb-4 rounded-r border-l-2 border-fv-green bg-fv-greenLight p-3 text-sm font-semibold text-fv-green">
              {involvement.join(' and ')} this match
            </div>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={clsx(
                    'rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors',
                    view === v.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-navy-700 text-ink-300 hover:text-ink-100',
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-ink-300">
              Attacking right
            </div>
          </div>

          <MatchPitch viz={viz} view={view} />

          {view === 'shots' ? <ShotLegend /> : null}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile label="Goals" value={match.goals} variant={match.goals > 0 ? 'good' : 'default'} />
            <StatTile label="Assists" value={match.assists} variant={match.assists > 0 ? 'good' : 'default'} />
            <StatTile label="Shots" value={match.shots} sublabel={`${match.shotsOnTarget} on target`} />
            <StatTile label="xG" value={match.xg.toFixed(2)} />
            <StatTile label="xA" value={match.xa.toFixed(2)} />
            <StatTile label="Passes" value={match.passes} sublabel={`${Math.round(match.passAccuracy)}% complete`} />
            <StatTile label="Tackles" value={match.tackles} />
            <StatTile label="Interceptions" value={match.interceptions} />
            <StatTile label="Off Ball Dist" value={`${match.offBallDistanceKm.toFixed(1)} km`} />
            <StatTile label="Top Speed" value={`${match.topSpeedKmh.toFixed(1)} km/h`} />
            <StatTile label="Prog Runs" value={match.progressiveRuns} />
            <StatTile label="Runs Creating Chances" value={match.runsCreatingChances} />
          </div>

          <div className="mt-4 rounded-r border-l-2 border-fv-green bg-fv-greenLight p-3 text-xs leading-relaxed text-fv-green">
            Positions are reconstructed by FieldVision computer vision from match
            film. Every touch, run, and shot is tracked automatically.
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchPitch({ viz, view }: { viz: ReturnType<typeof buildMatchViz>; view: ViewId }) {
  const W = 105
  const H = 68
  const cellW = W / viz.cols
  const cellH = H / viz.rows

  return (
    <div className="overflow-hidden rounded-xl border border-navy-600">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img">
        <defs>
          <filter id="heatBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <pattern id="grass" width={W / 9} height={H} patternUnits="userSpaceOnUse">
            <rect width={W / 18} height={H} fill="#1b7d3e" />
            <rect x={W / 18} width={W / 18} height={H} fill="#188039" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill="url(#grass)" />

        {view === 'heat' ? (
          <g filter="url(#heatBlur)">
            {viz.heatGrid.map((row, r) =>
              row.map((value, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellW}
                  y={r * cellH}
                  width={cellW}
                  height={cellH}
                  fill={heatColor(value)}
                />
              )),
            )}
          </g>
        ) : null}

        <PitchMarkings w={W} h={H} />

        {view === 'touches'
          ? viz.touches.map((t, i) => (
              <circle
                key={i}
                cx={(t.x / 100) * W}
                cy={(t.y / 100) * H}
                r={0.9}
                fill="#6BB0EC"
                fillOpacity={0.85}
              />
            ))
          : null}

        {view === 'shots' ? <ShotMarkers shots={viz.shots} w={W} h={H} /> : null}
      </svg>
    </div>
  )
}

function ShotMarkers({ shots, w, h }: { shots: VizShot[]; w: number; h: number }) {
  if (!shots.length) {
    return (
      <text x={w / 2} y={h / 2} textAnchor="middle" fill="#E1E8F0" fontSize="3" opacity="0.8">
        No shots this match
      </text>
    )
  }
  return (
    <g>
      {shots.map((s, i) => {
        const cx = (s.x / 100) * w
        const cy = (s.y / 100) * h
        if (s.goal) {
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={2.1} fill="#2E7D32" stroke="#ffffff" strokeWidth={0.4} />
              <circle cx={cx} cy={cy} r={3.1} fill="none" stroke="#2E7D32" strokeWidth={0.3} opacity={0.6} />
            </g>
          )
        }
        if (s.onTarget) {
          return <circle key={i} cx={cx} cy={cy} r={1.5} fill="#6BB0EC" stroke="#ffffff" strokeWidth={0.25} />
        }
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={1.5}
            fill="none"
            stroke="#9AA0AA"
            strokeWidth={0.4}
          />
        )
      })}
    </g>
  )
}

function ShotLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-100">
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border border-white bg-fv-green" />
        Goal
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border border-white bg-blue-400" />
        On target
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border border-ink-300" />
        Off target
      </span>
    </div>
  )
}

function PitchMarkings({ w, h }: { w: number; h: number }) {
  const stroke = '#ffffff'
  const opacity = 0.35
  const sw = 0.3
  const line = { stroke, strokeWidth: sw, strokeOpacity: opacity, fill: 'none' }
  const boxTop = (h - 40.3) / 2
  const sixTop = (h - 18.3) / 2
  return (
    <g>
      <rect x={0.4} y={0.4} width={w - 0.8} height={h - 0.8} {...line} />
      <line x1={w / 2} y1={0.4} x2={w / 2} y2={h - 0.4} {...line} />
      <circle cx={w / 2} cy={h / 2} r={9.15} {...line} />
      <circle cx={w / 2} cy={h / 2} r={0.5} fill={stroke} fillOpacity={opacity} />
      <rect x={0.4} y={boxTop} width={16.5} height={40.3} {...line} />
      <rect x={w - 0.4 - 16.5} y={boxTop} width={16.5} height={40.3} {...line} />
      <rect x={0.4} y={sixTop} width={5.5} height={18.3} {...line} />
      <rect x={w - 0.4 - 5.5} y={sixTop} width={5.5} height={18.3} {...line} />
      <circle cx={11} cy={h / 2} r={0.5} fill={stroke} fillOpacity={opacity} />
      <circle cx={w - 11} cy={h / 2} r={0.5} fill={stroke} fillOpacity={opacity} />
    </g>
  )
}
