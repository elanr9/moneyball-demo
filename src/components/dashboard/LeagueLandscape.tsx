// League landscape quadrant. Plots all sixteen clubs by attack (goals scored per
// game) against defense (goals conceded per game), split into four quadrants by
// the league average. The top right is the complete team: scores a lot, concedes
// little. The managed club is highlighted and every dot links to its team page.

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
import type { LandscapeAverages, LandscapePoint } from '../../data/teamEval'

interface LeagueLandscapeProps {
  points: LandscapePoint[]
  averages: LandscapeAverages
  myTeamId: string
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: LandscapePoint
  myTeamId: string
}

function TeamDot({ cx, cy, payload, myTeamId }: DotProps) {
  if (cx == null || cy == null || !payload) return null
  const mine = payload.teamId === myTeamId
  return (
    <g style={{ cursor: 'pointer' }}>
      {mine ? <circle cx={cx} cy={cy} r={13} fill={payload.color} fillOpacity={0.18} /> : null}
      <circle
        cx={cx}
        cy={cy}
        r={mine ? 7 : 5}
        fill={payload.color}
        stroke="#FFFFFF"
        strokeWidth={mine ? 2 : 1}
      />
      <text
        x={cx}
        y={cy - (mine ? 12 : 10)}
        textAnchor="middle"
        fontSize={mine ? 11 : 9}
        fontWeight={mine ? 700 : 600}
        fill={mine ? '#16191E' : '#646B76'}
      >
        {payload.abbreviation}
      </text>
    </g>
  )
}

function LandscapeTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: LandscapePoint }>
}) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 shadow-float">
      <div className="text-sm font-semibold text-ink-100">{p.shortName}</div>
      <div className="font-mono text-[11px] text-ink-300">
        {p.attack} scored · {p.defense} conceded · {p.points} pts
      </div>
    </div>
  )
}

export function LeagueLandscape({ points, averages, myTeamId }: LeagueLandscapeProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 20, bottom: 24, left: -4 }}>
            <CartesianGrid stroke="#E7E9EC" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="attack"
              name="Attack"
              tick={{ fill: '#646B76', fontSize: 11 }}
              axisLine={{ stroke: '#D6D9DE' }}
              tickLine={false}
              label={{ value: 'Goals scored per game', position: 'insideBottom', offset: -12, fill: '#646B76', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="defense"
              name="Defense"
              reversed
              tick={{ fill: '#646B76', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
              label={{ value: 'Goals conceded per game', angle: -90, position: 'insideLeft', offset: 16, fill: '#646B76', fontSize: 11 }}
            />
            <ReferenceLine x={averages.attack} stroke="#D6D9DE" strokeDasharray="5 5" />
            <ReferenceLine y={averages.defense} stroke="#D6D9DE" strokeDasharray="5 5" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<LandscapeTooltip />} />
            <Scatter
              data={points}
              shape={(props: unknown) => <TeamDot {...(props as DotProps)} myTeamId={myTeamId} />}
              onClick={(p: { payload?: LandscapePoint }) =>
                p.payload && navigate(`/team/${p.payload.teamId}`)
              }
            />
          </ScatterChart>
        </ResponsiveContainer>

        <span className="pointer-events-none absolute right-6 top-4 rounded bg-fv-greenLight px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fv-green">
          Complete
        </span>
        <span className="pointer-events-none absolute left-12 bottom-12 rounded bg-navy-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-300">
          Rebuilding
        </span>
      </div>

      <div className="mt-3 text-xs leading-relaxed text-ink-300">
        Top right scores often and concedes little. Click any club to scout its squad and shape.
      </div>
    </div>
  )
}
