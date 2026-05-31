// FIFA Ultimate Team style formation selector. Left and right arrows cycle
// through every supported shape, with a live mini pitch preview and the
// tactical headline updating instantly as the coach steps through them.

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FORMATION_NAMES, FORMATIONS } from './formations'
import type { FormationName } from './formations'

interface FormationSwitcherProps {
  formationName: FormationName
  accent?: string
  onChange: (name: FormationName) => void
}

export function FormationSwitcher({
  formationName,
  accent = '#3B82F6',
  onChange,
}: FormationSwitcherProps) {
  const index = FORMATION_NAMES.indexOf(formationName)
  const formation = FORMATIONS[formationName]

  function step(delta: number) {
    const len = FORMATION_NAMES.length
    const next = (index + delta + len) % len
    onChange(FORMATION_NAMES[next])
  }

  return (
    <div className="rounded-2xl border border-navy-600 bg-navy-800 p-5">
      <div className="section-label mb-3 text-blue-500">Formation</div>

      <div className="flex items-center justify-between gap-2">
        <ArrowButton direction="prev" onClick={() => step(-1)} />
        <div className="text-center">
          <div className="font-mono text-2xl font-bold leading-none text-ink-100">
            {formation.name}
          </div>
          <div className="mt-1 text-xs text-ink-300">{formation.style}</div>
        </div>
        <ArrowButton direction="next" onClick={() => step(1)} />
      </div>

      <MiniPitch slots={formation.slots} accent={accent} />

      <div className="mt-2 text-center font-mono text-[11px] text-ink-300">
        {index + 1} of {FORMATION_NAMES.length} shapes
      </div>
    </div>
  )
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={direction === 'prev' ? 'Previous formation' : 'Next formation'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy-600 bg-navy-900 text-blue-500 transition-colors hover:border-blue-500 hover:text-blue-400"
    >
      {direction === 'prev' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )
}

function MiniPitch({
  slots,
  accent,
}: {
  slots: { id: string; x: number; y: number }[]
  accent: string
}) {
  return (
    <div
      className="relative mx-auto mt-4 aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-lg border border-white/10"
      style={{
        background:
          'repeating-linear-gradient(180deg, #1f7a3d 0px, #1f7a3d 22px, #1c6f37 22px, #1c6f37 44px)',
      }}
    >
      <div className="absolute inset-1.5 rounded border border-white/20" />
      <div className="absolute left-1.5 right-1.5 top-1/2 h-0 border-t border-white/20" />
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      {slots.map((slot) => (
        <span
          key={slot.id}
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/80"
          style={{ left: `${slot.x}%`, top: `${slot.y}%`, backgroundColor: accent }}
        />
      ))}
    </div>
  )
}
