// Builds the AI style one line scouting blurb shown on a player profile header.
// It is deterministic and derived entirely from the player's own data so it
// reads like a generated summary without needing a live model call. Any engineer
// can trace every phrase back to an attribute, a season stat, or a role fit.

import type { DetailedPosition, Player } from './types'
import type { RoleFit } from './gameModel'

// Readable names for the FIFA style positions, kept in the data layer so the
// blurb has no dependency on any UI module.
const POSITION_LABEL: Record<DetailedPosition, string> = {
  GK: 'goalkeeper',
  CB: 'center back',
  LB: 'left back',
  RB: 'right back',
  LWB: 'left wing back',
  RWB: 'right wing back',
  CDM: 'defensive midfielder',
  CM: 'central midfielder',
  CAM: 'attacking midfielder',
  LM: 'left midfielder',
  RM: 'right midfielder',
  LW: 'left winger',
  RW: 'right winger',
  CF: 'center forward',
  ST: 'striker',
}

// Maps each outfield attribute to a natural strength phrase. We surface the two
// highest attributes so the blurb leads with what the player is genuinely good at.
const OUTFIELD_TRAIT: Record<keyof NonNullable<Player['attributes']>, string> = {
  pace: 'explosive pace',
  shooting: 'clinical finishing',
  passing: 'incisive passing',
  dribbling: 'tight close control',
  defending: 'reliable defending',
  physical: 'a strong physical presence',
}

const GK_TRAIT: Record<keyof NonNullable<Player['gkAttributes']>, string> = {
  diving: 'athletic shot stopping',
  handling: 'secure handling',
  kicking: 'sharp distribution',
  reflexes: 'quick reflexes',
  speed: 'fast off his line',
  positioning: 'smart positioning',
}

function topTraits(player: Player): string[] {
  if (player.gkAttributes) {
    const entries = Object.entries(player.gkAttributes) as Array<
      [keyof NonNullable<Player['gkAttributes']>, number]
    >
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => GK_TRAIT[key])
  }
  if (player.attributes) {
    const entries = Object.entries(player.attributes) as Array<
      [keyof NonNullable<Player['attributes']>, number]
    >
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => OUTFIELD_TRAIT[key])
  }
  return []
}

// Picks the headline output line for the player based on their position group so
// a striker leads with goals while a keeper leads with clean sheets.
function outputClause(player: Player): string {
  const s = player.season
  switch (player.positionGroup) {
    case 'GK':
      return `He has kept ${s.cleanSheets} clean sheets with a ${s.savePercent}% save rate`
    case 'DEF':
      return `He has logged ${s.tackles} tackles and ${s.interceptions} interceptions`
    case 'MID':
      return `He has created ${s.chancesCreated} chances and registered ${s.goals} goals with ${s.assists} assists`
    case 'FWD':
    default:
      return `He has scored ${s.goals} goals with ${s.assists} assists`
  }
}

export function playerSummary(
  player: Player,
  teamShortName: string | undefined,
  topFit: RoleFit | undefined,
): string {
  const position = POSITION_LABEL[player.primaryPosition]
  const team = teamShortName ?? 'his side'
  const classYear = player.classYear.toLowerCase()

  const opener = topFit
    ? `${player.firstName} is a ${classYear} ${position} for ${team} who profiles best as a ${topFit.role.name}.`
    : `${player.firstName} is a ${classYear} ${position} for ${team}.`

  const output = `${outputClause(player)} across ${player.season.appearances} appearances and holds an FV rating of ${player.season.fvRating.toFixed(1)}.`

  const traits = topTraits(player)
  const traitSentence = traits.length
    ? ` His game is built on ${traits.join(' and ')}.`
    : ''

  return `${opener} ${output}${traitSentence}`
}
