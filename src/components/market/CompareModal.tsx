// Side by side comparison for 2 to 4 selected players. Shows an attribute radar
// (when the players share an attribute type) and a key stats table with the best
// value in each row highlighted.

import { X } from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type {
  GoalkeeperAttributes,
  OutfieldAttributes,
  Player,
} from '../../data/types'
import { getStatDef } from '../../data/selectors'

interface CompareModalProps {
  players: Player[]
  onRemove: (playerId: string) => void
  onClose: () => void
}

const SERIES_COLORS = ['#2563EB', '#EAB308', '#15803D', '#DC2626']

const OUTFIELD_ATTRS: Array<[keyof OutfieldAttributes, string]> = [
  ['pace', 'PAC'],
  ['shooting', 'SHO'],
  ['passing', 'PAS'],
  ['dribbling', 'DRI'],
  ['defending', 'DEF'],
  ['physical', 'PHY'],
]

const GK_ATTRS: Array<[keyof GoalkeeperAttributes, string]> = [
  ['diving', 'DIV'],
  ['handling', 'HAN'],
  ['kicking', 'KIC'],
  ['reflexes', 'REF'],
  ['speed', 'SPD'],
  ['positioning', 'POS'],
]

interface StatRow {
  key: string
  label: string
  get: (p: Player) => number
  format: (v: number) => string
}

const OVERALL_ROW: StatRow = {
  key: 'overall',
  label: 'Overall',
  get: (p) => p.overall,
  format: (v) => String(Math.round(v)),
}

function attributeValue(player: Player, key: string): number {
  const source = (player.attributes ?? player.gkAttributes) as
    | Record<string, number>
    | null
  return source ? source[key] ?? 0 : 0
}

function statRow(key: string): StatRow | null {
  const def = getStatDef(key)
  if (!def) return null
  return {
    key,
    label: def.label,
    get: def.get,
    format: def.format,
  }
}

const OUTFIELD_ROW_KEYS = [
  'fvRating',
  'goals',
  'assists',
  'xg',
  'chancesCreated',
  'progressiveRuns',
  'runsCreatingChances',
  'tackles',
  'interceptions',
  'offBallDistanceKm',
  'topSpeedKmh',
]

const GK_ROW_KEYS = [
  'fvRating',
  'cleanSheets',
  'saves',
  'savePercent',
  'goalsPrevented',
  'passAccuracy',
  'offBallDistanceKm',
  'topSpeedKmh',
]

export function CompareModal({ players, onRemove, onClose }: CompareModalProps) {
  const allGk = players.every((p) => p.gkAttributes)
  const allOutfield = players.every((p) => p.attributes)
  const showRadar = allGk || allOutfield

  const attrDefs: Array<[string, string]> = allGk ? GK_ATTRS : OUTFIELD_ATTRS
  const radarData = attrDefs.map(([key, label]) => {
    const row: Record<string, number | string> = { attr: label }
    for (const p of players) {
      row[p.id] = attributeValue(p, key)
    }
    return row
  })

  const rowKeys = allGk ? GK_ROW_KEYS : OUTFIELD_ROW_KEYS
  const rows: StatRow[] = [
    OVERALL_ROW,
    ...rowKeys.map(statRow).filter((r): r is StatRow => Boolean(r)),
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-navy-600 px-6 py-4">
          <div>
            <div className="section-label text-blue-500">Compare Players</div>
            <div className="mt-1 text-sm text-ink-300">
              {players.length} players side by side
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-300 transition-colors hover:text-ink-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-auto p-6">
          <div className="mb-5 flex flex-wrap gap-3">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-navy-600 bg-navy-900 px-3 py-2"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[i] }}
                />
                <span className="text-sm font-semibold text-ink-100">{p.name}</span>
                <span className="font-mono text-xs text-ink-300">{p.overall}</span>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="text-ink-300 transition-colors hover:text-ink-100"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {showRadar ? (
            <div className="mb-6 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#E7E9EC" />
                  <PolarAngleAxis
                    dataKey="attr"
                    tick={{ fill: '#646B76', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 99]}
                    tick={{ fill: '#646B76', fontSize: 10 }}
                    axisLine={false}
                  />
                  {players.map((p, i) => (
                    <Radar
                      key={p.id}
                      name={p.name}
                      dataKey={p.id}
                      stroke={SERIES_COLORS[i]}
                      fill={SERIES_COLORS[i]}
                      fillOpacity={0.18}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mb-6 rounded-md border border-navy-600 bg-navy-900 p-4 text-sm text-ink-300">
              Radar needs players of the same type. Compare outfielders together or
              goalkeepers together to see the shape.
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600 text-[11px] uppercase tracking-widest text-ink-300">
                <th className="py-2 text-left font-semibold">Stat</th>
                {players.map((p) => (
                  <th key={p.id} className="py-2 text-right font-semibold">
                    {p.lastName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((row) => {
                const values = players.map((p) => row.get(p))
                const best = Math.max(...values)
                return (
                  <tr key={row.key} className="border-b border-navy-700">
                    <td className="py-2 font-sans text-ink-100">{row.label}</td>
                    {players.map((p, i) => {
                      const v = values[i]!
                      const isBest = v === best && players.length > 1
                      return (
                        <td
                          key={p.id}
                          className={
                            isBest
                              ? 'py-2 text-right font-bold text-fv-green'
                              : 'py-2 text-right text-ink-100'
                          }
                        >
                          {row.format(v)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
