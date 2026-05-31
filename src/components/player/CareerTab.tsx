// The career tab projects a player forward across their remaining eligibility.
// In the college game a player's value is their development curve, so we chart
// the projected overall season by season toward their FieldVision ceiling and
// lay out the eligibility timeline beside it.

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GraduationCap } from 'lucide-react'
import type { ClassYear, Player } from '../../data/types'
import {
  CLASS_ORDER,
  SEASON_START_YEAR,
  developmentOf,
  eligibilityOf,
  projectedOverall,
} from '../../data/eligibility'

const STAGE_TONE: Record<string, string> = {
  Breakout: 'text-fv-green',
  Rising: 'text-blue-500',
  Prime: 'text-ink-100',
  Veteran: 'text-fv-yellow',
}

function classForSeason(start: ClassYear, offset: number): string {
  const idx = CLASS_ORDER.indexOf(start) + offset
  if (idx >= CLASS_ORDER.length) return 'Graduate'
  return CLASS_ORDER[idx]
}

export function CareerTab({ player }: { player: Player }) {
  const elig = eligibilityOf(player)
  const dev = developmentOf(player)

  const trajectory = Array.from({ length: elig.yearsRemaining }, (_, n) => {
    const year = SEASON_START_YEAR + n
    return {
      label: `${year}`,
      season: `${year}-${String((year + 1) % 100).padStart(2, '0')}`,
      overall: projectedOverall(player, year),
      class: classForSeason(player.classYear, n),
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CareerStat label="Class" value={player.classYear} />
        <CareerStat label="Eligibility left" value={`${elig.yearsRemaining} yr${elig.yearsRemaining === 1 ? '' : 's'}`} />
        <CareerStat label="Through" value={String(elig.throughYear)} />
        <CareerStat label="Stage" value={dev.stage} tone={STAGE_TONE[dev.stage]} />
      </div>

      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="section-label text-fv-green">Projected Development</h2>
          <span className="font-mono text-xs text-ink-300">
            {player.overall} now · ceiling {player.potential}
          </span>
        </div>
        <div className="mb-4 text-xs text-ink-300">
          Overall projected forward each season toward the FieldVision ceiling.
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectory} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#E7E9EC" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#646B76', fontSize: 12 }} axisLine={{ stroke: '#D6D9DE' }} />
              <YAxis
                domain={[Math.max(40, player.overall - 6), Math.min(99, player.potential + 4)]}
                tick={{ fill: '#9AA0AA', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E7E9EC',
                  borderRadius: 8,
                  color: '#16191E',
                  fontSize: 12,
                  boxShadow: '0 12px 32px -10px rgba(16, 24, 40, 0.16)',
                }}
                formatter={(value: number) => [value, 'Projected overall']}
              />
              <ReferenceLine
                y={player.potential}
                stroke="#15803D"
                strokeDasharray="4 4"
                label={{ value: 'Ceiling', position: 'right', fill: '#15803D', fontSize: 10 }}
              />
              <Line type="monotone" dataKey="overall" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-card">
        <div className="border-b border-navy-600 px-5 py-3">
          <h2 className="section-label flex items-center gap-2 text-blue-500">
            <GraduationCap size={14} /> Eligibility Timeline
          </h2>
        </div>
        <div className="divide-y divide-navy-700">
          {trajectory.map((row, i) => (
            <div key={row.label} className="flex items-center gap-4 px-5 py-3">
              <span className="w-16 shrink-0 font-mono text-sm font-bold text-ink-100">
                {row.season}
              </span>
              <span className="w-24 shrink-0 text-sm text-ink-300">{row.class}</span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(row.overall / 99) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-sm font-bold text-ink-100">
                {row.overall}
              </span>
              {i === trajectory.length - 1 ? (
                <span className="shrink-0 rounded bg-fv-yellow/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-fv-yellow">
                  Final
                </span>
              ) : (
                <span className="w-12 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function CareerStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-navy-600 bg-navy-700 p-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-300">{label}</div>
      <div className={`mt-1 text-base font-bold ${tone ?? 'text-ink-100'}`}>{value}</div>
    </div>
  )
}
