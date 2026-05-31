// League Center, FotMob style. A sticky tab bar switches between the standings
// table, fixtures and results, player stat leaderboards, and team stats for the
// whole NCAA Division III National Showcase.

import { useState } from 'react'
import { Globe2 } from 'lucide-react'
import { useUniverse } from '../../context/UniverseContext'
import { Tabs } from '../../components/ui/Tabs'
import type { TabItem } from '../../components/ui/Tabs'
import { PageHeader, PageShell } from '../../components/layout/PageHeader'
import { StandingsTable } from '../../components/league/StandingsTable'
import { FixturesPanel } from '../../components/league/FixturesPanel'
import { PlayerStatsPanel } from '../../components/league/PlayerStatsPanel'
import { TeamStatsPanel } from '../../components/league/TeamStatsPanel'

const TABS: TabItem[] = [
  { id: 'table', label: 'Table' },
  { id: 'fixtures', label: 'Fixtures and Results' },
  { id: 'players', label: 'Player Stats' },
  { id: 'teams', label: 'Team Stats' },
]

export function League() {
  const { universe, myTeamId } = useUniverse()
  const [tab, setTab] = useState('table')

  return (
    <PageShell className="space-y-0 pt-8">
      <PageHeader
        eyebrow="League Center"
        lead={
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-navy-600 bg-navy-800 text-team shadow-card">
            <Globe2 size={26} strokeWidth={1.75} />
          </div>
        }
        title={universe.league.name}
        subtitle={
          <>
            {universe.league.division} · {universe.league.season} ·{' '}
            {universe.teams.length} teams
          </>
        }
      />

      <div
        className="sticky top-16 z-20 mt-6 -mx-8 bg-navy-900/85 px-8 backdrop-blur-xl"
        data-tour="league-tabs"
      >
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="pt-7">
        {tab === 'table' ? (
          <StandingsTable universe={universe} myTeamId={myTeamId} />
        ) : null}
        {tab === 'fixtures' ? <FixturesPanel universe={universe} /> : null}
        {tab === 'players' ? <PlayerStatsPanel universe={universe} /> : null}
        {tab === 'teams' ? <TeamStatsPanel universe={universe} /> : null}
      </div>
    </PageShell>
  )
}
