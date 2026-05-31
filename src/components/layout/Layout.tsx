import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { TourGuide } from '../tour/TourGuide'

export function Layout() {
  return (
    <div className="relative min-h-screen bg-navy-900">
      {/* Faint blueprint grid and a soft team-colored aura behind everything so
          the deep canvas reads as a designed surface rather than flat black. */}
      <div className="pointer-events-none fixed inset-0 bg-grid-faint [background-size:48px_48px] opacity-[0.6]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-team-fade opacity-70" />
      <TopNav />
      <main className="relative w-full">
        <Outlet />
      </main>
      <TourGuide />
    </div>
  )
}
