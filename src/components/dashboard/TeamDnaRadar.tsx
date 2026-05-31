// Team DNA radar. Plots the managed club against the league average across six
// FieldVision playing style traits, so a coach sees the identity of their team
// at a glance instead of reading a column of numbers. The signature gap between
// the two shapes is what the platform turns into a plain language read below.

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { StylePoint } from '../../data/teamEval'

interface TeamDnaRadarProps {
  data: StylePoint[]
  teamName: string
  accent: string
}

export function TeamDnaRadar({ data, teamName, accent }: TeamDnaRadarProps) {
  const top = [...data].sort((a, b) => b.team - a.team)[0]
  const low = [...data].sort((a, b) => a.team - b.team)[0]

  return (
    <div className="flex h-full flex-col">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
            <PolarGrid stroke="#E7E9EC" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#646B76', fontSize: 11 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="League average"
              dataKey="league"
              stroke="#9AA0AA"
              strokeDasharray="4 4"
              fill="#9AA0AA"
              fillOpacity={0.12}
            />
            <Radar
              name={teamName}
              dataKey="team"
              stroke={accent}
              strokeWidth={2}
              fill={accent}
              fillOpacity={0.28}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-2 text-ink-100">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: accent }} />
          {teamName}
        </span>
        <span className="inline-flex items-center gap-2 text-ink-300">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-500" />
          League average
        </span>
      </div>

      {top && low ? (
        <div className="mt-4 rounded-r border-l-2 border-fv-green bg-fv-greenLight p-3 text-xs leading-relaxed text-fv-green">
          This squad defines itself through <strong>{top.axis.toLowerCase()}</strong> and leans on
          the league for <strong>{low.axis.toLowerCase()}</strong>. Measured by FieldVision computer
          vision.
        </div>
      ) : null}
    </div>
  )
}
