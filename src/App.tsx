import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/coach/Dashboard'
import { Squad } from './pages/coach/Squad'
import { Player } from './pages/coach/Player'
import { Market } from './pages/scout/Market'
import { PlayerFinder } from './pages/scout/PlayerFinder'
import { Strategy } from './pages/coach/Strategy'
import { Development } from './pages/coach/Development'
import { League } from './pages/league/League'
import { Team } from './pages/league/Team'
import { PlayerEditor } from './pages/admin/PlayerEditor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="squad" element={<Squad />} />
        <Route path="strategy" element={<Strategy />} />
        <Route path="development" element={<Development />} />
        <Route path="player/:teamId/:slug" element={<Player />} />
        <Route path="league" element={<League />} />
        <Route path="team/:teamId" element={<Team />} />
        <Route path="market" element={<Market />} />
        <Route path="roles" element={<PlayerFinder />} />
        <Route path="admin" element={<PlayerEditor />} />
        <Route path="search" element={<Navigate to="/market" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
