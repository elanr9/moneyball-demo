import type { Player } from '../types/player'
import { mockScoutSearch } from './mockScoutSearch'
import type { ScoutResult } from './mockScoutSearch'

export async function parseScoutQuery(
  query: string,
  players: Player[],
): Promise<ScoutResult> {
  return mockScoutSearch(query, players)
}
