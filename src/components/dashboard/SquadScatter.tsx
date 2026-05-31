// Squad performance scatter. Every squad player is plotted by overall rating
// (their reputation) against FieldVision rating (what they actually produced
// this season). The diagonal is where production matches reputation. Players
// above it are outperforming their billing, the under the radar value the
// platform surfaces. Below it are names a coach should look at on film.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SquadScatterPoint } from '../../data/teamEval'

interface SquadScatterProps {
  points: SquadScatterPoint[]
}

const GROUP_COLOR: Record<string, string> = {
  GK: '#9AA0AA',
  DEF: '#3B82F6',
  MID: '#15803D',
  FWD: '#D9A400',
}

const GROUP_LABEL: Record<string, string> = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: SquadScatterPoint
}

function PlayerDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={GROUP_COLOR[payload.positionGroup] ?? '#646B76'}
      fillOpacity={0.85}
      stroke="#FFFFFF"
      strokeWidth={1}
      style={{ cursor: 'pointer' }}
    />
  )
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SquadScatterPoint }>
}) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  const edgeTone = p.edge > 0 ? 'text-fv-green' : p.edge < 0 ? 'text-fv-red' : 'text-ink-300'
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 shadow-float">
      <div className="text-sm font-semibold text-ink-100">{p.name}</div>
      <div className="font-mono text-[11px] text-ink-300">
        {p.position} · {p.overall} OVR · {p.fvRating.toFixed(2)} FV
      </div>
      <div className={`mt-0.5 font-mono text-[11px] font-semibold ${edgeTone}`}>
        {p.edge > 0 ? `+${p.edge}` : p.edge} vs expected
      </div>
    </div>
  )
}

export function SquadScatter({ points }: SquadScatterProps) {
  const navigate = useNavigate()

  const groups = useMemo(() => {
    const present = new Set(points.map((p) => p.positionGroup))
    return ['GK', 'DEF', 'MID', 'FWD'].filter((g) => present.has(g))
  }, [points])

  const overperformers = useMemo(
    () => [...points].sort((a, b) => b.edge - a.edge).slice(0, 3),
    [points],
  )

  if (!points.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-ink-300">
        Player reads appear once the squad logs enough minutes this season.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, bottom: 24, left: -4 }}>
              <CartesianGrid stroke="#E7E9EC" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="overall"
                name="Overall"
                domain={[54, 88]}
                tick={{ fill: '#646B76', fontSize: 11 }}
                axisLine={{ stroke: '#D6D9DE' }}
                tickLine={false}
                label={{ value: 'Overall rating', position: 'insideBottom', offset: -12, fill: '#646B76', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="fvRating"
                name="FV rating"
                domain={[5, 9]}
                tick={{ fill: '#646B76', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                label={{ value: 'FieldVision rating', angle: -90, position: 'insideLeft', offset: 16, fill: '#646B76', fontSize: 11 }}
              />
              <ReferenceLine
                segment={[
                  { x: 55, y: 5.5 },
                  { x: 86, y: 8.5 },
                ]}
                stroke="#9AA0AA"
                strokeDasharray="5 5"
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
              <Scatter
                data={points}
                shape={(props: unknown) => <PlayerDot {...(props as DotProps)} />}
                onClick={(p: { payload?: SquadScatterPoint }) =>
                  p.payload && navigate(`/player/${p.payload.teamId}/${p.payload.slug}`)
                }
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {groups.map((g) => (
            <span key={g} className="inline-flex items-center gap-1.5 text-xs text-ink-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GROUP_COLOR[g] }} />
              {GROUP_LABEL[g]}
            </span>
          ))}
        </div>
      </div>

      <aside className="flex flex-col">
        <div className="section-label mb-3 text-fv-green">Outperforming reputation</div>
        <div className="space-y-2">
          {overperformers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/player/${p.teamId}/${p.slug}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-navy-600 bg-navy-700 px-3 py-2.5 text-left transition-colors hover:border-fv-green/50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-100">{p.name}</div>
                <div className="font-mono text-[11px] text-ink-300">
                  {p.position} · {p.overall} OVR
                </div>
              </div>
              <span className="shrink-0 rounded bg-fv-green/15 px-2 py-0.5 font-mono text-xs font-bold text-fv-green">
                +{p.edge}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-auto pt-4 text-[11px] leading-relaxed text-ink-300">
          Names above the line produce more than their rating predicts. The cheapest way to find an
          edge is to find them first.
        </div>
      </aside>
    </div>
  )
}
