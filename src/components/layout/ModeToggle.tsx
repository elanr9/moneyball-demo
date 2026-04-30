import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { useMode } from '../../context/ModeContext'

export function ModeToggle() {
  const { mode, setMode } = useMode()
  const navigate = useNavigate()

  function selectCoach() {
    setMode('coach')
    navigate('/dashboard')
  }
  function selectScout() {
    setMode('scout')
    navigate('/search')
  }

  return (
    <div className="grid grid-cols-2 gap-1 p-1 bg-navy-900 rounded-md border border-navy-600">
      <button
        type="button"
        onClick={selectCoach}
        className={clsx(
          'text-xs font-semibold tracking-widest uppercase py-2 rounded transition-colors',
          mode === 'coach'
            ? 'bg-navy-700 text-blue-400'
            : 'text-ink-300 hover:text-white',
        )}
      >
        Coach
      </button>
      <button
        type="button"
        onClick={selectScout}
        className={clsx(
          'text-xs font-semibold tracking-widest uppercase py-2 rounded transition-colors',
          mode === 'scout'
            ? 'bg-navy-700 text-blue-400'
            : 'text-ink-300 hover:text-white',
        )}
      >
        Scout
      </button>
    </div>
  )
}
