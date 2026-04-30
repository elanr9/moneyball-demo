import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/coach/Dashboard'
import { Roster } from './pages/coach/Roster'
import { Player } from './pages/coach/Player'
import { Games } from './pages/coach/Games'
import { Game } from './pages/coach/Game'
import { Search } from './pages/scout/Search'
import { Database } from './pages/scout/Database'
import { Leaderboard } from './pages/scout/Leaderboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="roster" element={<Roster />} />
        <Route path="player/:slug" element={<Player />} />
        <Route path="games" element={<Games />} />
        <Route path="game/:id" element={<Game />} />
        <Route path="search" element={<Search />} />
        <Route path="database" element={<Database />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
