import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Search as SearchIcon } from 'lucide-react'
import { usePlayerData } from '../../context/PlayerDataContext'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { RatingBadge } from '../../components/ui/RatingBadge'
import type { Player, Position } from '../../types/player'

const POSITION_FILTERS: Array<{ id: 'ALL' | Position; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'GK', label: 'Goalkeepers' },
  { id: 'B', label: 'Defenders' },
  { id: 'M', label: 'Midfielders' },
  { id: 'F', label: 'Forwards' },
]

export function Roster() {
  const { players } = usePlayerData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | Position>('ALL')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return players.filter((p) => {
      if (filter !== 'ALL') {
        if (filter === 'B' && p.position !== 'B' && p.position !== 'M/B')
          return false
        if (filter !== 'B' && p.position !== filter) return false
      }
      if (!q) return true
      return p.name.toLowerCase().includes(q)
    })
  }, [players, search, filter])

  const columns: Column<Player>[] = [
    {
      key: 'number',
      header: '#',
      width: '60px',
      sortable: true,
      sortValue: (p) => Number(p.number) || 0,
      render: (p) => (
        <span className="font-mono text-ink-300">{p.number}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          <PlayerAvatar name={p.name} size="md" />
          <div className="font-medium text-white">{p.name}</div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Pos',
      width: '70px',
      sortable: true,
      sortValue: (p) => p.position,
      render: (p) => (
        <span className="font-mono text-ink-300">{p.position}</span>
      ),
    },
    {
      key: 'year',
      header: 'Year',
      width: '110px',
      sortable: true,
      sortValue: (p) => p.year,
      render: (p) => <span className="text-ink-300">{p.year}</span>,
    },
    {
      key: 'gp',
      header: 'GP',
      width: '60px',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.gp,
      render: (p) => <span className="font-mono">{p.gp}</span>,
    },
    {
      key: 'goals',
      header: 'Goals',
      width: '70px',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.goals,
      render: (p) => <span className="font-mono">{p.goals}</span>,
    },
    {
      key: 'assists',
      header: 'Assists',
      width: '80px',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.assists,
      render: (p) => <span className="font-mono">{p.assists}</span>,
    },
    {
      key: 'xg',
      header: 'xG',
      width: '70px',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.xg,
      render: (p) => (
        <span className="font-mono">{p.xg.toFixed(2)}</span>
      ),
    },
    {
      key: 'fvRating',
      header: 'FV Rating',
      width: '120px',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.fvRating,
      render: (p) => (
        <div className="flex justify-end">
          <RatingBadge rating={p.fvRating} size="md" />
        </div>
      ),
    },
  ]

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <div className="section-label text-blue-500 mb-2">Roster</div>
        <h1 className="text-3xl font-bold text-white">
          {players.length} Players · 2025 Season
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            type="text"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-800 border border-navy-600 rounded-md pl-9 pr-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1.5">
          {POSITION_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={clsx(
                'text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-md border transition-colors',
                filter === f.id
                  ? 'bg-blue-500 border-blue-500 text-navy-900'
                  : 'bg-navy-800 border-navy-600 text-ink-300 hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(p) => p.slug}
        onRowClick={(p) => navigate(`/player/${p.slug}`)}
        highlightRow={(p) => p.slug === 'elan-romo'}
        initialSort={{ key: 'fvRating', dir: 'desc' }}
      />
    </div>
  )
}
