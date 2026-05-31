// Shows how a player scores against every role that fits their position. This
// is the data side of building custom AI driven profiles: a coach can see at a
// glance whether a player suits their box to box brief or their target forward
// brief, and jump to the Roles studio to tune the model.

import { Link } from 'react-router-dom'
import { Wand2 } from 'lucide-react'
import type { RoleFit } from '../../data/gameModel'
import { ScoreBar } from '../ui/ScoreBar'

export function RoleFitGrid({ fits }: { fits: RoleFit[] }) {
  return (
    <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-fv-green" />
          <h2 className="section-label text-fv-green">Role Fit</h2>
        </div>
        <Link
          to="/roles"
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 transition-colors hover:text-blue-400"
        >
          <Wand2 size={13} /> Build a role
        </Link>
      </div>
      {fits.length ? (
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {fits.map((fit) => (
            <div key={fit.role.id}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-100">{fit.role.name}</span>
                {fit.role.custom ? (
                  <span className="rounded bg-fv-greenLight px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-fv-green">
                    Custom
                  </span>
                ) : null}
              </div>
              <ScoreBar value={fit.score} accent />
              <div className="mt-1 text-[11px] text-ink-300">{fit.role.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-ink-300">No roles defined for this position yet.</div>
      )}
    </section>
  )
}
