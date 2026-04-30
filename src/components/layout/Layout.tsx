import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { usePlayerData } from '../../context/PlayerDataContext'
import { Loader } from '../ui/Loader'

export function Layout() {
  const { loading, error } = usePlayerData()

  return (
    <div className="min-h-screen flex bg-navy-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto scrollbar-thin">
          {loading ? (
            <div className="h-full flex items-center justify-center py-32">
              <div className="text-center space-y-4">
                <Loader />
                <div className="text-xs uppercase tracking-widest text-ink-300">
                  Loading FieldVision data
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-fv-red font-mono">{error}</div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
