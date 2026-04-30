import * as XLSX from 'xlsx'
import type { Player, Position } from '../types/player'
import type { PerGameStats } from '../types/game'
import { getSlug } from './statHelpers'

const DATA_URL = '/data/Brandeis-Soccer-FieldVision-Data.xlsx'

interface RosterRow {
  number: string
  name: string
  position: Position
  height: string
  year: string
  major: string
  hometown: string
}

function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function str(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function parseRoster(sheet: XLSX.WorkSheet): RosterRow[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  })
  return rows
    .slice(1)
    .filter((r) => r && r[1])
    .map((r) => ({
      number: str(r[0]),
      name: str(r[1]),
      position: (str(r[2]) || 'M') as Position,
      height: str(r[3]),
      year: str(r[4]),
      major: str(r[5]),
      hometown: str(r[6]),
    }))
}

function parseSeasonStats(
  sheet: XLSX.WorkSheet,
  roster: Map<string, RosterRow>,
): Player[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  })

  const players: Player[] = []
  for (const r of rows.slice(2)) {
    if (!r || !r[1] || str(r[1]).toUpperCase().includes('TEAM TOTAL')) continue
    const name = str(r[1])
    const slug = getSlug(name)
    const rosterEntry = roster.get(name)
    players.push({
      number: str(r[0]) || rosterEntry?.number || '',
      name,
      slug,
      position: (str(r[2]) || rosterEntry?.position || 'M') as Position,
      height: rosterEntry?.height ?? '',
      year: str(r[3]) || rosterEntry?.year || '',
      major: rosterEntry?.major ?? '',
      hometown: rosterEntry?.hometown ?? '',

      gp: num(r[4]),
      gs: num(r[5]),
      minutes: num(r[6]),

      goals: num(r[7]),
      assists: num(r[8]),
      xg: num(r[9]),
      xgOt: num(r[10]),
      xa: num(r[11]),
      shots: num(r[12]),
      shotsOnTarget: num(r[13]),
      shotsOffTarget: num(r[14]),
      blockedShots: num(r[15]),
      shotAccuracy: str(r[16]),
      accuratePasses: str(r[17]),
      chancesCreated: num(r[18]),
      bigChancesCreated: num(r[19]),
      defensiveContributions: num(r[20]),

      touches: num(r[21]),
      touchesOppBox: num(r[22]),
      successfulDribbles: str(r[23]),
      passesFinalThird: num(r[24]),
      accurateCrosses: str(r[25]),
      corners: num(r[26]),
      dispossessed: num(r[27]),

      groundDuelsWon: str(r[28]),
      aerialDuelsWon: str(r[29]),
      wasFouled: num(r[30]),
      foulsCommitted: num(r[31]),

      tackles: num(r[32]),
      interceptions: num(r[33]),
      recoveries: num(r[34]),
      dribbledPast: num(r[35]),

      offBallDistanceKm: num(r[36]),
      sprintDistanceM: num(r[37]),
      topSpeedKmh: num(r[38]),
      pressureEvents: num(r[39]),
      runsCreatingChances: num(r[40]),
      spaceCreatedPer90: num(r[41]),
      progressiveRuns: num(r[42]),
      defensiveActionsPer90: num(r[43]),

      fvRating: num(r[44]),
    })
  }
  return players
}

function parsePerGame(sheet: XLSX.WorkSheet): PerGameStats[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  })
  const games: PerGameStats[] = []
  for (const r of rows.slice(1)) {
    if (!r || r[0] === null || r[0] === undefined || r[0] === '') continue
    const gameNum = num(r[0])
    if (gameNum === 0) continue
    games.push({
      game: gameNum,
      date: str(r[1]),
      opponent: str(r[2]),
      result: str(r[3]),
      min: num(r[4]),
      goals: num(r[5]),
      assists: num(r[6]),
      shots: num(r[7]),
      sot: num(r[8]),
      xg: num(r[9]),
      xa: num(r[10]),
      passes: num(r[11]),
      passPct: num(r[12]),
      touches: num(r[13]),
      touchesBox: num(r[14]),
      offBallKm: num(r[15]),
      sprintM: num(r[16]),
      topSpeed: num(r[17]),
      pressure: num(r[18]),
      runsCC: num(r[19]),
      progRuns: num(r[20]),
      fvRating: num(r[21]),
    })
  }
  return games
}

export interface ParsedData {
  players: Player[]
  perGameByPlayerSlug: Record<string, PerGameStats[]>
}

export async function loadFieldVisionData(): Promise<ParsedData> {
  const response = await fetch(DATA_URL)
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const rosterRows = parseRoster(workbook.Sheets['Roster'])
  const rosterMap = new Map<string, RosterRow>()
  rosterRows.forEach((r) => rosterMap.set(r.name, r))

  const players = parseSeasonStats(
    workbook.Sheets['Season Stats'],
    rosterMap,
  )

  const elanGames = parsePerGame(workbook.Sheets['Per Game · Elan Romo'])

  return {
    players,
    perGameByPlayerSlug: {
      [getSlug('Elan Romo')]: elanGames,
    },
  }
}
