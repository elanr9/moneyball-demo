import clsx from 'clsx'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  sortValue?: (row: T) => number | string
  render: (row: T) => ReactNode
  sticky?: boolean
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  highlightRow?: (row: T) => boolean
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  emptyState?: ReactNode
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  highlightRow,
  initialSort,
  emptyState,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  )

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const getValue = col.sortValue ?? (() => 0)
    const out = [...rows].sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av
      }
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      if (as < bs) return sort.dir === 'asc' ? -1 : 1
      if (as > bs) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return out
  }, [rows, columns, sort])

  function handleHeaderClick(col: Column<T>) {
    if (!col.sortable) return
    setSort((current) => {
      if (current?.key === col.key) {
        return { key: col.key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key: col.key, dir: 'desc' }
    })
  }

  if (rows.length === 0 && emptyState) {
    return <div>{emptyState}</div>
  }

  return (
    <div className="overflow-auto scrollbar-thin border border-navy-600 rounded-lg bg-navy-800">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-navy-700">
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleHeaderClick(col)}
                  className={clsx(
                    'px-3 py-2.5 text-[11px] uppercase tracking-widest font-semibold text-ink-300 border-b border-navy-600',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.align !== 'right' &&
                      col.align !== 'center' &&
                      'text-left',
                    col.sortable && 'cursor-pointer select-none hover:text-white',
                    col.sticky && 'sticky left-0 bg-navy-700 z-20',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {isSorted ? (
                      sort.dir === 'asc' ? (
                        <ArrowUp size={11} className="text-blue-400" />
                      ) : (
                        <ArrowDown size={11} className="text-blue-400" />
                      )
                    ) : null}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const highlighted = highlightRow?.(row) ?? false
            return (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-navy-700 last:border-b-0',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-navy-700 transition-colors',
                  highlighted && 'border-l-2 border-l-blue-500',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-3 py-2.5 text-ink-100',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.sticky && 'sticky left-0 bg-navy-800 z-10',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
