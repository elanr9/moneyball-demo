// Structured filter rail for the transfer market. Mirrors the FIFA market panel:
// position, club, country, class year, foot, height range, overall range, and a
// set of stat minimum sliders driven by STAT_CATALOG.

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import type { Player, PositionGroup, Team } from '../../data/types'
import { STAT_CATALOG, getStatDef } from '../../data/selectors'
import type { StatGroup } from '../../data/selectors'
import {
  DETAILED_POSITIONS,
  DETAILED_POSITION_LABEL,
  HEIGHT_CEIL,
  HEIGHT_FLOOR,
  OVERALL_CEIL,
  OVERALL_FLOOR,
  inchesToLabel,
} from './filters'
import type { MarketFilters } from './filters'

interface FilterRailProps {
  filters: MarketFilters
  players: Player[]
  teams: Team[]
  countries: string[]
  classYears: string[]
  onChange: (next: MarketFilters) => void
  onReset: () => void
}

const POSITION_BUTTONS: Array<{ id: PositionGroup | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'GK', label: 'GK' },
  { id: 'DEF', label: 'DEF' },
  { id: 'MID', label: 'MID' },
  { id: 'FWD', label: 'FWD' },
]

const DETAILED_GROUP_ORDER: PositionGroup[] = ['GK', 'DEF', 'MID', 'FWD']

const STAT_GROUP_ORDER: StatGroup[] = [
  'Attacking',
  'Passing',
  'Defending',
  'Physical',
  'Advanced',
  'Goalkeeping',
]

export function FilterRail({
  filters,
  players,
  teams,
  countries,
  classYears,
  onChange,
  onReset,
}: FilterRailProps) {
  const statMax = useMemo(() => {
    const map: Record<string, number> = {}
    for (const def of STAT_CATALOG) {
      let max = 0
      for (const p of players) {
        const v = def.get(p)
        if (v > max) max = v
      }
      map[def.key] = max
    }
    return map
  }, [players])

  function set<K extends keyof MarketFilters>(key: K, value: MarketFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  function stepFor(key: string): number {
    return statMax[key]! <= 40 ? 0.5 : 1
  }

  function addStat(key: string) {
    if (!key || filters.statMins[key] !== undefined) return
    const step = stepFor(key)
    const seed = Math.round(((statMax[key] ?? 0) * 0.5) / step) * step
    onChange({ ...filters, statMins: { ...filters.statMins, [key]: seed } })
  }

  function setStat(key: string, value: number) {
    onChange({ ...filters, statMins: { ...filters.statMins, [key]: value } })
  }

  function removeStat(key: string) {
    const next = { ...filters.statMins }
    delete next[key]
    onChange({ ...filters, statMins: next })
  }

  const availableStats = STAT_CATALOG.filter((d) => filters.statMins[d.key] === undefined)

  return (
    <aside className="space-y-5 rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="section-label text-blue-500">Filters</div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] uppercase tracking-widest text-ink-300 transition-colors hover:text-ink-100"
        >
          Reset
        </button>
      </div>

      <Section label="Position">
        <div className="flex flex-wrap gap-1.5">
          {POSITION_BUTTONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() =>
                onChange({ ...filters, positionGroup: b.id, detailedPosition: 'ALL' })
              }
              className={clsx(
                'rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                filters.positionGroup === b.id
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-navy-600 bg-navy-900 text-ink-300 hover:text-ink-100',
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <select
          value={filters.detailedPosition}
          onChange={(e) =>
            onChange({
              ...filters,
              detailedPosition: e.target.value as MarketFilters['detailedPosition'],
              positionGroup: 'ALL',
            })
          }
          className="mt-2 w-full rounded-md border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">Any specific position</option>
          {DETAILED_GROUP_ORDER.map((group) => (
            <optgroup key={group} label={group}>
              {DETAILED_POSITIONS[group].map((pos) => (
                <option key={pos} value={pos}>
                  {pos} · {DETAILED_POSITION_LABEL[pos]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Section>

      <Section label="Club">
        <SelectInput
          value={filters.teamId}
          onChange={(v) => set('teamId', v)}
          options={[
            { value: 'ALL', label: 'All clubs' },
            ...teams.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
      </Section>

      <Section label="Country">
        <SelectInput
          value={filters.country}
          onChange={(v) => set('country', v)}
          options={[
            { value: 'ALL', label: 'All countries' },
            ...countries.map((c) => ({ value: c, label: c })),
          ]}
        />
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section label="Class Year">
          <SelectInput
            value={filters.classYear}
            onChange={(v) => set('classYear', v as MarketFilters['classYear'])}
            options={[
              { value: 'ALL', label: 'Any' },
              ...classYears.map((c) => ({ value: c, label: c })),
            ]}
          />
        </Section>
        <Section label="Foot">
          <SelectInput
            value={filters.foot}
            onChange={(v) => set('foot', v as MarketFilters['foot'])}
            options={[
              { value: 'ALL', label: 'Any' },
              { value: 'L', label: 'Left' },
              { value: 'R', label: 'Right' },
            ]}
          />
        </Section>
      </div>

      <Section label={`Overall ${filters.overallMin} to ${filters.overallMax}`}>
        <SliderRow
          min={OVERALL_FLOOR}
          max={OVERALL_CEIL}
          step={1}
          value={filters.overallMin}
          onChange={(v) => set('overallMin', Math.min(v, filters.overallMax))}
        />
        <SliderRow
          min={OVERALL_FLOOR}
          max={OVERALL_CEIL}
          step={1}
          value={filters.overallMax}
          onChange={(v) => set('overallMax', Math.max(v, filters.overallMin))}
        />
      </Section>

      <Section
        label={`Height ${inchesToLabel(filters.heightMin)} to ${
          filters.heightMax ? inchesToLabel(filters.heightMax) : 'Any'
        }`}
      >
        <SliderRow
          min={HEIGHT_FLOOR}
          max={HEIGHT_CEIL}
          step={1}
          value={filters.heightMin || HEIGHT_FLOOR}
          onChange={(v) => set('heightMin', v === HEIGHT_FLOOR ? 0 : v)}
        />
        <SliderRow
          min={HEIGHT_FLOOR}
          max={HEIGHT_CEIL}
          step={1}
          value={filters.heightMax || HEIGHT_CEIL}
          onChange={(v) => set('heightMax', v === HEIGHT_CEIL ? 0 : v)}
        />
      </Section>

      <Section label="Stat Minimums">
        <select
          value=""
          onChange={(e) => addStat(e.target.value)}
          className="w-full rounded-md border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Add a stat filter</option>
          {STAT_GROUP_ORDER.map((group) => {
            const inGroup = availableStats.filter((d) => d.group === group)
            if (inGroup.length === 0) return null
            return (
              <optgroup key={group} label={group}>
                {inGroup.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </optgroup>
            )
          })}
        </select>

        <div className="mt-3 space-y-3">
          {Object.entries(filters.statMins).map(([key, value]) => {
            const def = getStatDef(key)
            if (!def) return null
            return (
              <div key={key} className="rounded-md border border-navy-600 bg-navy-900 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-100">
                    {def.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-100">
                      {def.format(value)}+
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStat(key)}
                      className="text-ink-300 transition-colors hover:text-ink-100"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
                <SliderRow
                  min={0}
                  max={statMax[key] ?? 100}
                  step={stepFor(key)}
                  value={value}
                  onChange={(v) => setStat(key, v)}
                />
              </div>
            )
          })}
        </div>
      </Section>
    </aside>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-widest text-ink-300">{label}</div>
      {children}
    </div>
  )
}

interface Option {
  value: string
  label: string
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100 focus:border-blue-500 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function SliderRow({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full cursor-pointer accent-blue-500"
    />
  )
}
