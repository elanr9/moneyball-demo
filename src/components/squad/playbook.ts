// The AI playbook for the squad board. This turns the starting eleven into a set
// of choreographed attacking plays and training drills that the coach can watch
// animate on the pitch, read a plain explanation of, and rate up or down.
//
// Each play is a short sequence of steps. A step moves a handful of actors (your
// players, the ball, a cone or a shadow defender) to new spots on the pitch, and
// carries a one sentence explanation. Coordinates live in formation space
// (x 0 to 100 left to right, y 0 attack to 100 own goal) so the pitch projects
// them to the screen exactly like the tactical run arrows do.
//
// Plays are built from templates that bind to the real starting eleven: the
// template asks for a role (a right back, a winger) and we slot in the best
// fitting starter, so the names, numbers and the squad fit score are all real.
// Everything here is pure data keyed off attributes, which keeps it easy for any
// engineer to add a new play or tune a number in one place.

import type { OutfieldAttributes, Player } from '../../data/types'
import type { DetailedPosition } from '../../data/types'
import { fitScore } from './lineup'
import type { SquadAttributes } from './tactics'

export type PlayKind = 'attack' | 'drill'

export type PlayFocus =
  | 'wide'
  | 'central'
  | 'transition'
  | 'pressing'
  | 'finishing'
  | 'possession'

export type ActorCategory = 'team' | 'ball' | 'cone' | 'defender'

// How a movement reads on the board: a run is a player sprint, a carry is a
// player moving with the ball, and a pass is the ball traveling on its own.
export type MovementKind = 'run' | 'carry' | 'pass'

export interface PlayActor {
  id: string
  label: string
  name?: string
  category: ActorCategory
  start: Point
}

export interface PlayMovement {
  actorId: string
  to: Point
  kind: MovementKind
}

export interface PlayStep {
  label: string
  caption: string
  durationMs: number
  movements: PlayMovement[]
}

export interface Play {
  id: string
  kind: PlayKind
  focus: PlayFocus
  title: string
  summary: string
  why: string
  tags: string[]
  difficulty: 'Starter' | 'Intermediate' | 'Advanced'
  // 0 to 100 read of how well the current eleven suits this play.
  confidence: number
  actors: PlayActor[]
  steps: PlayStep[]
}

interface Point {
  x: number
  y: number
}

export interface FocusMeta {
  label: string
  color: string
}

// Each focus gets a readable label and a colour used across the panel and the
// animated paths so a play type is recognisable at a glance.
export const FOCUS_META: Record<PlayFocus, FocusMeta> = {
  wide: { label: 'Wide play', color: '#34d399' },
  central: { label: 'Central combination', color: '#fbbf24' },
  transition: { label: 'Transition', color: '#f472b6' },
  pressing: { label: 'Pressing', color: '#f87171' },
  finishing: { label: 'Finishing', color: '#38bdf8' },
  possession: { label: 'Possession', color: '#a78bfa' },
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Reads an outfield attribute, falling back to the overall for a keeper so the
// confidence math never breaks on a thin squad.
function attr(player: Player | undefined, key: keyof OutfieldAttributes): number {
  if (!player) return 70
  return player.attributes ? player.attributes[key] : player.overall
}

// Picks the best fitting unused starter for a position. Returns undefined when
// the squad has run out of players so plays still render with role labels.
function makePicker(starters: Player[]) {
  const used = new Set<string>()
  return (pos: DetailedPosition): Player | undefined => {
    let best: Player | undefined
    let bestScore = -Infinity
    for (const player of starters) {
      if (used.has(player.id)) continue
      const score = fitScore(player, pos)
      if (score > bestScore) {
        bestScore = score
        best = player
      }
    }
    if (best) used.add(best.id)
    return best
  }
}

function teamActor(id: string, player: Player | undefined, fallback: string, start: Point): PlayActor {
  return {
    id,
    label: player ? `#${player.number}` : fallback,
    name: player?.lastName,
    category: 'team',
    start,
  }
}

const ballActor = (start: Point): PlayActor => ({ id: 'ball', label: '', category: 'ball', start })
const defActor = (id: string, start: Point): PlayActor => ({ id, label: '', category: 'defender', start })
const coneActor = (id: string, start: Point): PlayActor => ({ id, label: '', category: 'cone', start })

// A short readable name for a bound player, used inside the AI sentences.
function who(player: Player | undefined, fallback: string): string {
  return player?.lastName ?? fallback
}

interface Ctx {
  pick: (pos: DetailedPosition) => Player | undefined
  squad: SquadAttributes
}

type Template = (ctx: Ctx) => Play

// Overlapping run down the right. A fullback flies past the winger who has
// fixed the defender inside, then a low cut back finds a late central runner.
const overlapRight: Template = ({ pick }) => {
  const cm = pick('CM')
  const rw = pick('RW')
  const rb = pick('RB')
  const st = pick('ST')
  const conf = clamp(Math.round((attr(rb, 'pace') + attr(rb, 'physical')) / 2 * 0.45 + attr(rw, 'dribbling') * 0.55), 55, 96)
  return {
    id: 'overlap-right',
    kind: 'attack',
    focus: 'wide',
    title: 'Overlap down the right',
    summary: `Pin the defender inside with ${who(rw, 'the winger')} so ${who(rb, 'the fullback')} can fly past on the outside and cut it back.`,
    why: `Fits a quick fullback with ${attr(rb, 'pace')} pace and a winger who can dribble inside.`,
    tags: ['Wide overload', 'Overlap', 'Cut back'],
    difficulty: 'Intermediate',
    confidence: conf,
    actors: [
      teamActor('cm', cm, 'CM', { x: 66, y: 52 }),
      teamActor('rw', rw, 'RW', { x: 84, y: 28 }),
      teamActor('rb', rb, 'RB', { x: 88, y: 60 }),
      teamActor('st', st, 'ST', { x: 50, y: 22 }),
      defActor('d1', { x: 78, y: 30 }),
      ballActor({ x: 66, y: 52 }),
    ],
    steps: [
      {
        label: 'Spring the wing',
        caption: `${who(cm, 'The midfielder')} clips it wide to start the move.`,
        durationMs: 1100,
        movements: [{ actorId: 'ball', to: { x: 84, y: 28 }, kind: 'pass' }],
      },
      {
        label: 'Fix and overlap',
        caption: `${who(rw, 'The winger')} carries inside to fix the defender as ${who(rb, 'the fullback')} overlaps outside.`,
        durationMs: 1500,
        movements: [
          { actorId: 'rw', to: { x: 78, y: 24 }, kind: 'carry' },
          { actorId: 'ball', to: { x: 78, y: 24 }, kind: 'carry' },
          { actorId: 'rb', to: { x: 92, y: 22 }, kind: 'run' },
          { actorId: 'd1', to: { x: 74, y: 26 }, kind: 'run' },
        ],
      },
      {
        label: 'Release the byline',
        caption: `${who(rw, 'The winger')} releases the overlap while runners attack the box.`,
        durationMs: 1300,
        movements: [
          { actorId: 'ball', to: { x: 92, y: 20 }, kind: 'pass' },
          { actorId: 'st', to: { x: 60, y: 15 }, kind: 'run' },
          { actorId: 'cm', to: { x: 58, y: 30 }, kind: 'run' },
        ],
      },
      {
        label: 'Cut it back',
        caption: `The low cut back finds ${who(cm, 'the runner')} arriving late to finish.`,
        durationMs: 1200,
        movements: [{ actorId: 'ball', to: { x: 60, y: 28 }, kind: 'pass' }],
      },
    ],
  }
}

// Third man combination through the middle. A pass into feet, a first time lay
// off, then a runner bursting beyond into the space the ball just left.
const thirdMan: Template = ({ pick }) => {
  const cm = pick('CM')
  const cam = pick('CAM') ?? pick('CM')
  const st = pick('ST')
  const conf = clamp(Math.round((attr(cm, 'passing') + attr(cam, 'passing')) / 2 * 0.6 + attr(cm, 'dribbling') * 0.4), 55, 96)
  return {
    id: 'third-man',
    kind: 'attack',
    focus: 'central',
    title: 'Third man through the middle',
    summary: `Play into ${who(cam, 'the ten')}, lay it off first time, then send ${who(cm, 'the runner')} bursting through the gap.`,
    why: `Suits sharp central passing with a midfield that reads the second pass.`,
    tags: ['Third man', 'One two', 'Through ball'],
    difficulty: 'Advanced',
    confidence: conf,
    actors: [
      teamActor('cm', cm, 'CM', { x: 50, y: 55 }),
      teamActor('cam', cam, 'CAM', { x: 50, y: 34 }),
      teamActor('st', st, 'ST', { x: 50, y: 20 }),
      defActor('d1', { x: 44, y: 40 }),
      ballActor({ x: 50, y: 55 }),
    ],
    steps: [
      {
        label: 'Into the ten',
        caption: `${who(cm, 'The deep midfielder')} feeds the line between the lines.`,
        durationMs: 1100,
        movements: [{ actorId: 'ball', to: { x: 50, y: 34 }, kind: 'pass' }],
      },
      {
        label: 'Lay it off',
        caption: `${who(cam, 'The ten')} sets it to ${who(st, 'the striker')} as the runner starts forward.`,
        durationMs: 1300,
        movements: [
          { actorId: 'ball', to: { x: 50, y: 20 }, kind: 'pass' },
          { actorId: 'cm', to: { x: 46, y: 36 }, kind: 'run' },
          { actorId: 'd1', to: { x: 48, y: 28 }, kind: 'run' },
        ],
      },
      {
        label: 'First time release',
        caption: `${who(st, 'The striker')} flicks first time into the run.`,
        durationMs: 1100,
        movements: [{ actorId: 'ball', to: { x: 46, y: 30 }, kind: 'pass' }],
      },
      {
        label: 'Drive and finish',
        caption: `${who(cm, 'The runner')} drives clear to finish.`,
        durationMs: 1300,
        movements: [
          { actorId: 'cm', to: { x: 50, y: 18 }, kind: 'carry' },
          { actorId: 'ball', to: { x: 50, y: 18 }, kind: 'carry' },
        ],
      },
    ],
  }
}

// Switch the play to isolate a winger one on one on the far side after dragging
// the block across with a right sided overload.
const switchAndIsolate: Template = ({ pick }) => {
  const cdm = pick('CDM') ?? pick('CM')
  const rb = pick('RB')
  const lw = pick('LW') ?? pick('LM')
  const st = pick('ST')
  const conf = clamp(Math.round(attr(lw, 'dribbling') * 0.5 + attr(lw, 'pace') * 0.3 + attr(cdm, 'passing') * 0.2), 55, 96)
  return {
    id: 'switch-isolate',
    kind: 'attack',
    focus: 'possession',
    title: 'Switch and isolate',
    summary: `Pull the block to one side, then switch it fast to leave ${who(lw, 'the winger')} one on one with space to attack.`,
    why: `Built for a winger who beats defenders and a midfield that can hit the switch.`,
    tags: ['Switch', 'Isolation', 'One on one'],
    difficulty: 'Intermediate',
    confidence: conf,
    actors: [
      teamActor('cdm', cdm, 'CDM', { x: 50, y: 56 }),
      teamActor('rb', rb, 'RB', { x: 86, y: 54 }),
      teamActor('lw', lw, 'LW', { x: 16, y: 26 }),
      teamActor('st', st, 'ST', { x: 50, y: 22 }),
      defActor('d1', { x: 24, y: 26 }),
      ballActor({ x: 50, y: 56 }),
    ],
    steps: [
      {
        label: 'Draw them over',
        caption: `Build to the right to pull the defence across.`,
        durationMs: 1200,
        movements: [
          { actorId: 'ball', to: { x: 86, y: 54 }, kind: 'pass' },
          { actorId: 'd1', to: { x: 30, y: 28 }, kind: 'run' },
        ],
      },
      {
        label: 'Switch the play',
        caption: `${who(rb, 'The fullback')} switches the angle to free ${who(lw, 'the winger')}.`,
        durationMs: 1400,
        movements: [{ actorId: 'ball', to: { x: 16, y: 26 }, kind: 'pass' }],
      },
      {
        label: 'Attack the space',
        caption: `${who(lw, 'The winger')} drives at the isolated defender.`,
        durationMs: 1300,
        movements: [
          { actorId: 'lw', to: { x: 12, y: 18 }, kind: 'carry' },
          { actorId: 'ball', to: { x: 12, y: 18 }, kind: 'carry' },
          { actorId: 'st', to: { x: 52, y: 16 }, kind: 'run' },
        ],
      },
      {
        label: 'Whip it in',
        caption: `${who(lw, 'The winger')} whips it to the back post for ${who(st, 'the striker')}.`,
        durationMs: 1100,
        movements: [{ actorId: 'ball', to: { x: 52, y: 16 }, kind: 'pass' }],
      },
    ],
  }
}

// Win the ball and strike at once: a vertical set, a spin in behind and a quick
// release to a runner racing clear for a two on one.
const counterStrike: Template = ({ pick }) => {
  const cdm = pick('CDM') ?? pick('CM')
  const st = pick('ST')
  const rw = pick('RW') ?? pick('RM')
  const cm = pick('CM')
  const conf = clamp(Math.round((attr(st, 'pace') + attr(rw, 'pace')) / 2 * 0.6 + attr(cm, 'passing') * 0.4), 55, 96)
  return {
    id: 'counter-strike',
    kind: 'attack',
    focus: 'transition',
    title: 'Counter strike',
    summary: `The second the ball is won, go vertical to ${who(st, 'the striker')} and break with runners flooding past.`,
    why: `Made for pace up front with ${attr(st, 'pace')} and ${attr(rw, 'pace')} on the break.`,
    tags: ['Counter', 'Vertical', 'Two on one'],
    difficulty: 'Starter',
    confidence: conf,
    actors: [
      teamActor('cdm', cdm, 'CDM', { x: 44, y: 50 }),
      teamActor('st', st, 'ST', { x: 52, y: 24 }),
      teamActor('rw', rw, 'RW', { x: 84, y: 30 }),
      teamActor('cm', cm, 'CM', { x: 60, y: 48 }),
      ballActor({ x: 44, y: 50 }),
    ],
    steps: [
      {
        label: 'Win it and go',
        caption: `Break at once and find ${who(st, 'the striker')} into feet.`,
        durationMs: 1100,
        movements: [
          { actorId: 'ball', to: { x: 52, y: 24 }, kind: 'pass' },
          { actorId: 'rw', to: { x: 80, y: 18 }, kind: 'run' },
          { actorId: 'cm', to: { x: 58, y: 32 }, kind: 'run' },
        ],
      },
      {
        label: 'Set and spin',
        caption: `${who(st, 'The striker')} sets and spins in behind.`,
        durationMs: 1200,
        movements: [
          { actorId: 'ball', to: { x: 58, y: 32 }, kind: 'pass' },
          { actorId: 'st', to: { x: 54, y: 16 }, kind: 'run' },
        ],
      },
      {
        label: 'Slip the runner',
        caption: `${who(cm, 'The midfielder')} slips ${who(rw, 'the winger')} racing clear.`,
        durationMs: 1200,
        movements: [
          { actorId: 'ball', to: { x: 72, y: 16 }, kind: 'pass' },
          { actorId: 'rw', to: { x: 72, y: 16 }, kind: 'run' },
        ],
      },
      {
        label: 'Square to finish',
        caption: `${who(rw, 'The winger')} squares for the simple finish.`,
        durationMs: 1100,
        movements: [{ actorId: 'ball', to: { x: 56, y: 15 }, kind: 'pass' }],
      },
    ],
  }
}

// Rondo 4v2 possession drill. Four players keep the ball around a square while
// two work to win it in the middle.
const rondo: Template = ({ pick, squad }) => {
  const a = pick('CM')
  const b = pick('CDM') ?? pick('CM')
  const c = pick('CAM') ?? pick('CM')
  const d = pick('LM') ?? pick('RM')
  const conf = clamp(Math.round(squad.passing * 0.7 + squad.dribbling * 0.3), 55, 96)
  return {
    id: 'rondo-4v2',
    kind: 'drill',
    focus: 'possession',
    title: 'Rondo 4 v 2',
    summary: `Four keep the ball in a tight square while two press, training fast feet and sharp angles under pressure.`,
    why: `Sharpens the passing and composure that hold up your possession game.`,
    tags: ['Two touch', 'Press resistance', 'Tempo'],
    difficulty: 'Starter',
    confidence: conf,
    actors: [
      coneActor('c1', { x: 30, y: 30 }),
      coneActor('c2', { x: 70, y: 30 }),
      coneActor('c3', { x: 70, y: 70 }),
      coneActor('c4', { x: 30, y: 70 }),
      teamActor('a', a, 'P1', { x: 34, y: 34 }),
      teamActor('b', b, 'P2', { x: 66, y: 34 }),
      teamActor('c', c, 'P3', { x: 66, y: 66 }),
      teamActor('d', d, 'P4', { x: 34, y: 66 }),
      defActor('d1', { x: 47, y: 47 }),
      defActor('d2', { x: 53, y: 53 }),
      ballActor({ x: 34, y: 34 }),
    ],
    steps: [
      {
        label: 'Keep it moving',
        caption: `Two touch passing around the press.`,
        durationMs: 950,
        movements: [
          { actorId: 'ball', to: { x: 66, y: 34 }, kind: 'pass' },
          { actorId: 'd1', to: { x: 55, y: 42 }, kind: 'run' },
        ],
      },
      {
        label: 'Split the angle',
        caption: `Split the two with a sharp diagonal.`,
        durationMs: 950,
        movements: [
          { actorId: 'ball', to: { x: 34, y: 66 }, kind: 'pass' },
          { actorId: 'd2', to: { x: 48, y: 56 }, kind: 'run' },
        ],
      },
      {
        label: 'Switch and breathe',
        caption: `Switch away from pressure to reset.`,
        durationMs: 950,
        movements: [
          { actorId: 'ball', to: { x: 66, y: 66 }, kind: 'pass' },
          { actorId: 'd1', to: { x: 52, y: 52 }, kind: 'run' },
        ],
      },
      {
        label: 'Through the gate',
        caption: `Find the gate between the two defenders.`,
        durationMs: 950,
        movements: [
          { actorId: 'ball', to: { x: 34, y: 34 }, kind: 'pass' },
          { actorId: 'd2', to: { x: 50, y: 50 }, kind: 'run' },
        ],
      },
    ],
  }
}

// Finishing waves drill. Runners attack onto a served ball at game speed and
// strike first time, alternating near and far side.
const finishingWaves: Template = ({ pick }) => {
  const server = pick('CM')
  const s1 = pick('ST')
  const s2 = pick('RW') ?? pick('LW') ?? pick('ST')
  const conf = clamp(Math.round(attr(s1, 'shooting') * 0.6 + attr(s2, 'shooting') * 0.25 + attr(s1, 'pace') * 0.15), 55, 96)
  return {
    id: 'finishing-waves',
    kind: 'drill',
    focus: 'finishing',
    title: 'Finishing waves',
    summary: `Runners sprint onto a served pass and strike first time, alternating sides to train cool finishing under fatigue.`,
    why: `Builds the first time finishing that turns ${who(s1, 'your striker')} into chances scored.`,
    tags: ['First time', 'Game speed', 'Both sides'],
    difficulty: 'Intermediate',
    confidence: conf,
    actors: [
      coneActor('c1', { x: 42, y: 40 }),
      coneActor('c2', { x: 42, y: 60 }),
      teamActor('server', server, 'Serve', { x: 40, y: 55 }),
      teamActor('s1', s1, 'ST', { x: 45, y: 35 }),
      teamActor('s2', s2, 'F2', { x: 45, y: 68 }),
      ballActor({ x: 40, y: 55 }),
    ],
    steps: [
      {
        label: 'Drive and serve',
        caption: `Sprint onto the pass at full speed.`,
        durationMs: 1100,
        movements: [
          { actorId: 's1', to: { x: 60, y: 28 }, kind: 'run' },
          { actorId: 'ball', to: { x: 60, y: 28 }, kind: 'pass' },
        ],
      },
      {
        label: 'First time strike',
        caption: `Strike first time across the keeper.`,
        durationMs: 900,
        movements: [{ actorId: 'ball', to: { x: 90, y: 16 }, kind: 'pass' }],
      },
      {
        label: 'Next wave',
        caption: `The next runner attacks the far side.`,
        durationMs: 1100,
        movements: [
          { actorId: 'ball', to: { x: 40, y: 55 }, kind: 'pass' },
          { actorId: 's2', to: { x: 60, y: 72 }, kind: 'run' },
        ],
      },
      {
        label: 'Far post finish',
        caption: `Bury the far post finish.`,
        durationMs: 1000,
        movements: [{ actorId: 'ball', to: { x: 90, y: 26 }, kind: 'pass' }],
      },
    ],
  }
}

// Pressing trap drill. The front line shows the opponent down the line, then the
// unit springs and collapses to win the ball back high.
const pressTrap: Template = ({ pick, squad }) => {
  const st = pick('ST')
  const rw = pick('RW') ?? pick('RM')
  const cm = pick('CM')
  const rb = pick('RB')
  const conf = clamp(Math.round(squad.defending * 0.5 + squad.pace * 0.35 + attr(st, 'physical') * 0.15), 55, 96)
  return {
    id: 'press-trap',
    kind: 'drill',
    focus: 'pressing',
    title: 'Pressing trap',
    summary: `Show the opponent down the line, then spring the press together and collapse the space to win it back high.`,
    why: `Drills the coordinated pressing that suits an aggressive high line.`,
    tags: ['High press', 'Trigger', 'Win it back'],
    difficulty: 'Advanced',
    confidence: conf,
    actors: [
      teamActor('st', st, 'ST', { x: 50, y: 30 }),
      teamActor('rw', rw, 'RW', { x: 78, y: 34 }),
      teamActor('cm', cm, 'CM', { x: 60, y: 46 }),
      teamActor('rb', rb, 'RB', { x: 84, y: 55 }),
      defActor('opp', { x: 88, y: 40 }),
      ballActor({ x: 88, y: 40 }),
    ],
    steps: [
      {
        label: 'Set the trap',
        caption: `Curve the first run to show them down the line.`,
        durationMs: 1100,
        movements: [{ actorId: 'st', to: { x: 70, y: 32 }, kind: 'run' }],
      },
      {
        label: 'Spring the press',
        caption: `Jump the press the moment the ball goes wide.`,
        durationMs: 1100,
        movements: [
          { actorId: 'rw', to: { x: 86, y: 38 }, kind: 'run' },
          { actorId: 'rb', to: { x: 86, y: 46 }, kind: 'run' },
        ],
      },
      {
        label: 'Collapse the space',
        caption: `Collapse the unit around the trapped ball.`,
        durationMs: 1100,
        movements: [
          { actorId: 'cm', to: { x: 74, y: 40 }, kind: 'run' },
          { actorId: 'st', to: { x: 66, y: 36 }, kind: 'run' },
        ],
      },
      {
        label: 'Win and exit',
        caption: `Win it back and break out clean.`,
        durationMs: 1100,
        movements: [{ actorId: 'ball', to: { x: 74, y: 40 }, kind: 'pass' }],
      },
    ],
  }
}

const TEMPLATES: Template[] = [
  overlapRight,
  thirdMan,
  switchAndIsolate,
  counterStrike,
  rondo,
  finishingWaves,
  pressTrap,
]

// Builds the full playbook for the current starting eleven. Each template gets a
// fresh picker so a player is only bound once per play.
export function buildPlaybook(starters: Player[], squad: SquadAttributes): Play[] {
  return TEMPLATES.map((template) => template({ pick: makePicker(starters), squad }))
}

// Folds the step movements over the play to get the position of every actor at
// each frame. frame 0 is the starting shape and frame i is the shape after step
// i minus one has played, so the animator can tween from frame i to frame i+1.
export function buildFrames(play: Play): Array<Record<string, Point>> {
  const frames: Array<Record<string, Point>> = []
  let current: Record<string, Point> = {}
  for (const actor of play.actors) current[actor.id] = actor.start
  frames.push(current)
  for (const step of play.steps) {
    const next = { ...current }
    for (const move of step.movements) next[move.actorId] = move.to
    frames.push(next)
    current = next
  }
  return frames
}
