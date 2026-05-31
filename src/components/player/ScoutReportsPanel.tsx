// The scouting reports tab. Human filed reports with a star rating sit next to
// the data, the way a real recruiting staff blends film notes with the numbers.
// Reports are deterministic per player so the demo is stable.

import { ClipboardList, Clock } from 'lucide-react'
import type { Player } from '../../data/types'
import { reportsFor } from '../../data/scoutReports'
import { dateLabel } from '../league/league'
import { Stars } from '../ui/Stars'

export function ScoutReportsPanel({ player }: { player: Player }) {
  const { reports, averageStars, count } = reportsFor(player)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-label mb-1 text-blue-500">Average Report Score</h2>
            <div className="text-xs text-ink-300">Based on {count} filed reports this season</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-4xl font-bold text-ink-100">
              {averageStars.toFixed(1)}
            </span>
            <Stars value={averageStars} size={20} />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-2xl border border-navy-600 bg-navy-800 p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-navy-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-300">
                  <ClipboardList size={12} />
                  {report.type} report
                </span>
                <Stars value={report.stars} />
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-300">
                <Clock size={12} />
                {dateLabel(report.date)}
              </div>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink-100">{report.headline}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-300">{report.body}</p>
            <div className="mt-3 text-[11px] uppercase tracking-widest text-ink-500">
              Filed by {report.author}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
