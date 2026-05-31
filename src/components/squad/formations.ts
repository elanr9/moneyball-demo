// Formation layouts for the squad pitch. Each slot has a target position and a
// coordinate on the pitch. Coordinates are percentages: x runs 0 (left) to 100
// (right), y runs 0 (attack, top of the pitch) to 100 (own goal, bottom where
// the keeper stands). Each formation also carries a short tactical profile so
// the coach can read how the shape plays.
//
// The full FIFA style menu lives here, including the numbered variants of a
// shape (for example 4-3-3, 4-3-3 (2), 4-3-3 (4)) that swap a midfield or a
// forward role while keeping the same defensive line. Back lines and front
// lines are built from small shared helpers so every shape lines up on the same
// lanes and any engineer can add a new one in a few lines.

import type { DetailedPosition } from '../../data/types'

export interface FormationSlot {
  id: string
  pos: DetailedPosition
  x: number
  y: number
}

export interface Formation {
  name: FormationName
  // Short headline for how the shape plays.
  style: string
  // One sentence on the playing idea behind the shape.
  description: string
  // A few strengths surfaced as chips in the tactical panel.
  strengths: string[]
  slots: FormationSlot[]
}

export const FORMATION_NAMES = [
  // Back four
  '4-1-2-1-2',
  '4-1-2-1-2 (2)',
  '4-1-4-1',
  '4-2-2-2',
  '4-2-3-1',
  '4-2-3-1 (2)',
  '4-3-1-2',
  '4-3-3',
  '4-3-3 (2)',
  '4-3-3 (3)',
  '4-3-3 (4)',
  '4-3-3 (5)',
  '4-4-1-1',
  '4-4-2',
  '4-4-2 (2)',
  '4-5-1',
  '4-5-1 (2)',
  // Back three
  '3-1-4-2',
  '3-4-1-2',
  '3-4-2-1',
  '3-4-3',
  '3-5-2',
  // Back five
  '5-2-1-2',
  '5-2-3',
  '5-3-2',
  '5-4-1',
] as const

export type FormationName = (typeof FORMATION_NAMES)[number]

// Shared building blocks. Every back line and front line sits on the same lanes
// so all the shapes read consistently on the pitch.

function gk(): FormationSlot {
  return { id: 'gk', pos: 'GK', x: 50, y: 92 }
}

function back4(): FormationSlot[] {
  return [
    { id: 'lb', pos: 'LB', x: 14, y: 70 },
    { id: 'lcb', pos: 'CB', x: 38, y: 73 },
    { id: 'rcb', pos: 'CB', x: 62, y: 73 },
    { id: 'rb', pos: 'RB', x: 86, y: 70 },
  ]
}

function back3(): FormationSlot[] {
  return [
    { id: 'lcb', pos: 'CB', x: 28, y: 74 },
    { id: 'ccb', pos: 'CB', x: 50, y: 76 },
    { id: 'rcb', pos: 'CB', x: 72, y: 74 },
  ]
}

function back5(): FormationSlot[] {
  return [
    { id: 'lwb', pos: 'LWB', x: 10, y: 64 },
    { id: 'lcb', pos: 'CB', x: 32, y: 76 },
    { id: 'ccb', pos: 'CB', x: 50, y: 78 },
    { id: 'rcb', pos: 'CB', x: 68, y: 76 },
    { id: 'rwb', pos: 'RWB', x: 90, y: 64 },
  ]
}

// Front three with the central forward set to either a striker or a center
// forward depending on the shape.
function frontThree(center: DetailedPosition): FormationSlot[] {
  return [
    { id: 'lw', pos: 'LW', x: 18, y: 22 },
    { id: 'st', pos: center, x: 50, y: 18 },
    { id: 'rw', pos: 'RW', x: 82, y: 22 },
  ]
}

function frontTwo(): FormationSlot[] {
  return [
    { id: 'lst', pos: 'ST', x: 39, y: 19 },
    { id: 'rst', pos: 'ST', x: 61, y: 19 },
  ]
}

function loneStriker(): FormationSlot[] {
  return [{ id: 'st', pos: 'ST', x: 50, y: 18 }]
}

export const FORMATIONS: Record<FormationName, Formation> = {
  '4-1-2-1-2': {
    name: '4-1-2-1-2',
    style: 'Narrow midfield diamond',
    description:
      'A midfield diamond floods the center and feeds two strikers with little natural width.',
    strengths: ['Central dominance', 'Striker support', 'Press resistance'],
    slots: [
      gk(),
      ...back4(),
      { id: 'cdm', pos: 'CDM', x: 50, y: 58 },
      { id: 'lcm', pos: 'CM', x: 30, y: 46 },
      { id: 'rcm', pos: 'CM', x: 70, y: 46 },
      { id: 'cam', pos: 'CAM', x: 50, y: 33 },
      ...frontTwo(),
    ],
  },
  '4-1-2-1-2 (2)': {
    name: '4-1-2-1-2 (2)',
    style: 'Wide diamond',
    description:
      'The same diamond with the two central mids pushed wider to stretch the pitch a touch.',
    strengths: ['Central numbers', 'Wider angles', 'Striker pair'],
    slots: [
      gk(),
      ...back4(),
      { id: 'cdm', pos: 'CDM', x: 50, y: 58 },
      { id: 'lcm', pos: 'CM', x: 22, y: 47 },
      { id: 'rcm', pos: 'CM', x: 78, y: 47 },
      { id: 'cam', pos: 'CAM', x: 50, y: 33 },
      ...frontTwo(),
    ],
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    style: 'Patient and protected',
    description:
      'A holding midfielder anchors a flat four ahead of the defense for a controlled low risk shape.',
    strengths: ['Defensive screen', 'Possession base', 'Hard to break down'],
    slots: [
      gk(),
      ...back4(),
      { id: 'cdm', pos: 'CDM', x: 50, y: 57 },
      { id: 'lm', pos: 'LM', x: 14, y: 44 },
      { id: 'lcm', pos: 'CM', x: 38, y: 46 },
      { id: 'rcm', pos: 'CM', x: 62, y: 46 },
      { id: 'rm', pos: 'RM', x: 86, y: 44 },
      ...loneStriker(),
    ],
  },
  '4-2-2-2': {
    name: '4-2-2-2',
    style: 'Vertical and aggressive',
    description:
      'Two strikers and two inside forwards attack centrally while a double pivot covers behind.',
    strengths: ['Central overloads', 'Quick transitions', 'Front pressure'],
    slots: [
      gk(),
      ...back4(),
      { id: 'ldm', pos: 'CDM', x: 36, y: 57 },
      { id: 'rdm', pos: 'CDM', x: 64, y: 57 },
      { id: 'lam', pos: 'CAM', x: 30, y: 37 },
      { id: 'ram', pos: 'CAM', x: 70, y: 37 },
      ...frontTwo(),
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    style: 'Balanced control',
    description:
      'A double pivot shields the back four while a number ten links play to a lone striker.',
    strengths: ['Defensive balance', 'Creative hub', 'Counter ready'],
    slots: [
      gk(),
      ...back4(),
      { id: 'ldm', pos: 'CDM', x: 36, y: 56 },
      { id: 'rdm', pos: 'CDM', x: 64, y: 56 },
      { id: 'lam', pos: 'LM', x: 18, y: 38 },
      { id: 'cam', pos: 'CAM', x: 50, y: 38 },
      { id: 'ram', pos: 'RM', x: 82, y: 38 },
      ...loneStriker(),
    ],
  },
  '4-2-3-1 (2)': {
    name: '4-2-3-1 (2)',
    style: 'High wide attack',
    description:
      'The same pivot base with the wide attackers pushed up as wingers around a central ten.',
    strengths: ['Wing threat', 'High press', 'Creative ten'],
    slots: [
      gk(),
      ...back4(),
      { id: 'ldm', pos: 'CDM', x: 36, y: 56 },
      { id: 'rdm', pos: 'CDM', x: 64, y: 56 },
      { id: 'lw', pos: 'LW', x: 16, y: 31 },
      { id: 'cam', pos: 'CAM', x: 50, y: 40 },
      { id: 'rw', pos: 'RW', x: 84, y: 31 },
      ...loneStriker(),
    ],
  },
  '4-3-1-2': {
    name: '4-3-1-2',
    style: 'Compact and central',
    description:
      'A flat midfield three feeds a ten behind two strikers for a tight central attack.',
    strengths: ['Central control', 'Striker link', 'Solid base'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lcm', pos: 'CM', x: 28, y: 50 },
      { id: 'ccm', pos: 'CM', x: 50, y: 52 },
      { id: 'rcm', pos: 'CM', x: 72, y: 50 },
      { id: 'cam', pos: 'CAM', x: 50, y: 34 },
      ...frontTwo(),
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    style: 'Possession and wide attacks',
    description:
      'Build through a midfield three and stretch the field with two wingers high and wide.',
    strengths: ['Wide overloads', 'Midfield control', 'High press'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lcm', pos: 'CM', x: 30, y: 50 },
      { id: 'ccm', pos: 'CM', x: 50, y: 52 },
      { id: 'rcm', pos: 'CM', x: 70, y: 50 },
      ...frontThree('ST'),
    ],
  },
  '4-3-3 (2)': {
    name: '4-3-3 (2)',
    style: 'Holding midfield base',
    description:
      'One holder sits behind two box to box mids so the front three can press without risk.',
    strengths: ['Screen and recycle', 'Front three threat', 'Balance'],
    slots: [
      gk(),
      ...back4(),
      { id: 'cdm', pos: 'CDM', x: 50, y: 57 },
      { id: 'lcm', pos: 'CM', x: 32, y: 47 },
      { id: 'rcm', pos: 'CM', x: 68, y: 47 },
      ...frontThree('ST'),
    ],
  },
  '4-3-3 (3)': {
    name: '4-3-3 (3)',
    style: 'Double pivot defend',
    description:
      'Two holders sit deep ahead of the back four with one mid linking to the front three.',
    strengths: ['Defensive solidity', 'Counter cover', 'Compact center'],
    slots: [
      gk(),
      ...back4(),
      { id: 'ldm', pos: 'CDM', x: 36, y: 56 },
      { id: 'rdm', pos: 'CDM', x: 64, y: 56 },
      { id: 'ccm', pos: 'CM', x: 50, y: 44 },
      ...frontThree('ST'),
    ],
  },
  '4-3-3 (4)': {
    name: '4-3-3 (4)',
    style: 'Attacking midfield',
    description:
      'Two mids support a free ten behind the front three for a bold attacking shape.',
    strengths: ['Creative ten', 'Attacking numbers', 'High line'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lcm', pos: 'CM', x: 32, y: 50 },
      { id: 'rcm', pos: 'CM', x: 68, y: 50 },
      { id: 'cam', pos: 'CAM', x: 50, y: 36 },
      ...frontThree('ST'),
    ],
  },
  '4-3-3 (5)': {
    name: '4-3-3 (5)',
    style: 'False nine',
    description:
      'A center forward drops to link play while two wingers attack the space in behind.',
    strengths: ['Dropping forward', 'Wing runs', 'Midfield overload'],
    slots: [
      gk(),
      ...back4(),
      { id: 'cdm', pos: 'CDM', x: 50, y: 57 },
      { id: 'lcm', pos: 'CM', x: 32, y: 47 },
      { id: 'rcm', pos: 'CM', x: 68, y: 47 },
      ...frontThree('CF'),
    ],
  },
  '4-4-1-1': {
    name: '4-4-1-1',
    style: 'Two banks and a link',
    description:
      'Two banks of four stay compact while a center forward links up to a lone striker.',
    strengths: ['Compact shape', 'Link forward', 'Counter ready'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lm', pos: 'LM', x: 14, y: 48 },
      { id: 'lcm', pos: 'CM', x: 38, y: 50 },
      { id: 'rcm', pos: 'CM', x: 62, y: 50 },
      { id: 'rm', pos: 'RM', x: 86, y: 48 },
      { id: 'cf', pos: 'CF', x: 50, y: 34 },
      ...loneStriker(),
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    style: 'Direct and compact',
    description:
      'Two banks of four stay compact and service a striker pair with quick wide deliveries.',
    strengths: ['Compact shape', 'Aerial threat', 'Simple structure'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lm', pos: 'LM', x: 14, y: 48 },
      { id: 'lcm', pos: 'CM', x: 38, y: 50 },
      { id: 'rcm', pos: 'CM', x: 62, y: 50 },
      { id: 'rm', pos: 'RM', x: 86, y: 48 },
      ...frontTwo(),
    ],
  },
  '4-4-2 (2)': {
    name: '4-4-2 (2)',
    style: 'Holding two',
    description:
      'The flat 4-4-2 with both central mids as holders for a more defensive midfield.',
    strengths: ['Screen the back four', 'Counter base', 'Compact center'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lm', pos: 'LM', x: 14, y: 48 },
      { id: 'ldm', pos: 'CDM', x: 38, y: 53 },
      { id: 'rdm', pos: 'CDM', x: 62, y: 53 },
      { id: 'rm', pos: 'RM', x: 86, y: 48 },
      ...frontTwo(),
    ],
  },
  '4-5-1': {
    name: '4-5-1',
    style: 'Midfield five',
    description:
      'Five across the middle controls the game and supports a lone striker in patient spells.',
    strengths: ['Midfield numbers', 'Possession base', 'Hard to bypass'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lm', pos: 'LM', x: 14, y: 44 },
      { id: 'lcm', pos: 'CM', x: 33, y: 48 },
      { id: 'ccm', pos: 'CM', x: 50, y: 50 },
      { id: 'rcm', pos: 'CM', x: 67, y: 48 },
      { id: 'rm', pos: 'RM', x: 86, y: 44 },
      ...loneStriker(),
    ],
  },
  '4-5-1 (2)': {
    name: '4-5-1 (2)',
    style: 'Two tens',
    description:
      'A holder anchors the middle behind two tens who push up to support the striker.',
    strengths: ['Creative tens', 'Central support', 'Press triggers'],
    slots: [
      gk(),
      ...back4(),
      { id: 'lm', pos: 'LM', x: 14, y: 46 },
      { id: 'cdm', pos: 'CDM', x: 50, y: 54 },
      { id: 'lam', pos: 'CAM', x: 33, y: 38 },
      { id: 'ram', pos: 'CAM', x: 67, y: 38 },
      { id: 'rm', pos: 'RM', x: 86, y: 46 },
      ...loneStriker(),
    ],
  },
  '3-1-4-2': {
    name: '3-1-4-2',
    style: 'Anchored back three',
    description:
      'A lone holder protects a back three while a midfield four feeds two strikers.',
    strengths: ['Defensive anchor', 'Midfield width', 'Striker pair'],
    slots: [
      gk(),
      ...back3(),
      { id: 'cdm', pos: 'CDM', x: 50, y: 60 },
      { id: 'lm', pos: 'LM', x: 14, y: 46 },
      { id: 'lcm', pos: 'CM', x: 38, y: 48 },
      { id: 'rcm', pos: 'CM', x: 62, y: 48 },
      { id: 'rm', pos: 'RM', x: 86, y: 46 },
      ...frontTwo(),
    ],
  },
  '3-4-1-2': {
    name: '3-4-1-2',
    style: 'Back three with a ten',
    description:
      'A back three frees a midfield four and a ten who links straight to two strikers.',
    strengths: ['Central creativity', 'Wing energy', 'Striker support'],
    slots: [
      gk(),
      ...back3(),
      { id: 'lm', pos: 'LM', x: 12, y: 50 },
      { id: 'lcm', pos: 'CM', x: 38, y: 52 },
      { id: 'rcm', pos: 'CM', x: 62, y: 52 },
      { id: 'rm', pos: 'RM', x: 88, y: 50 },
      { id: 'cam', pos: 'CAM', x: 50, y: 34 },
      ...frontTwo(),
    ],
  },
  '3-4-2-1': {
    name: '3-4-2-1',
    style: 'Back three with two tens',
    description:
      'Two tens float behind a lone striker while wide mids provide the width up the flanks.',
    strengths: ['Half space threat', 'Wing width', 'Press numbers'],
    slots: [
      gk(),
      ...back3(),
      { id: 'lm', pos: 'LM', x: 12, y: 50 },
      { id: 'lcm', pos: 'CM', x: 38, y: 52 },
      { id: 'rcm', pos: 'CM', x: 62, y: 52 },
      { id: 'rm', pos: 'RM', x: 88, y: 50 },
      { id: 'lam', pos: 'CAM', x: 34, y: 34 },
      { id: 'ram', pos: 'CAM', x: 66, y: 34 },
      ...loneStriker(),
    ],
  },
  '3-4-3': {
    name: '3-4-3',
    style: 'High and expansive',
    description:
      'Three at the back commit numbers forward for a bold front three and constant width.',
    strengths: ['Attacking width', 'Front three threat', 'High line press'],
    slots: [
      gk(),
      ...back3(),
      { id: 'lm', pos: 'LM', x: 12, y: 50 },
      { id: 'lcm', pos: 'CM', x: 38, y: 52 },
      { id: 'rcm', pos: 'CM', x: 62, y: 52 },
      { id: 'rm', pos: 'RM', x: 88, y: 50 },
      ...frontThree('ST'),
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    style: 'Wingback driven',
    description:
      'Three center backs free two wingbacks to fly forward and support a strike pair.',
    strengths: ['Wide energy', 'Midfield numbers', 'Back three cover'],
    slots: [
      gk(),
      ...back3(),
      { id: 'lwb', pos: 'LWB', x: 10, y: 50 },
      { id: 'lcm', pos: 'CM', x: 33, y: 52 },
      { id: 'cdm', pos: 'CDM', x: 50, y: 58 },
      { id: 'rcm', pos: 'CM', x: 67, y: 52 },
      { id: 'rwb', pos: 'RWB', x: 90, y: 50 },
      ...frontTwo(),
    ],
  },
  '5-2-1-2': {
    name: '5-2-1-2',
    style: 'Five back with a ten',
    description:
      'A back five sits deep while a ten links the two holders to a front pair on the break.',
    strengths: ['Defensive block', 'Counter ten', 'Striker pair'],
    slots: [
      gk(),
      ...back5(),
      { id: 'lcm', pos: 'CM', x: 36, y: 50 },
      { id: 'rcm', pos: 'CM', x: 64, y: 50 },
      { id: 'cam', pos: 'CAM', x: 50, y: 34 },
      ...frontTwo(),
    ],
  },
  '5-2-3': {
    name: '5-2-3',
    style: 'Five back front three',
    description:
      'A deep back five springs a quick front three through two central midfielders.',
    strengths: ['Defensive solidity', 'Fast break', 'Front three'],
    slots: [
      gk(),
      ...back5(),
      { id: 'lcm', pos: 'CM', x: 36, y: 52 },
      { id: 'rcm', pos: 'CM', x: 64, y: 52 },
      ...frontThree('ST'),
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    style: 'Counter and contain',
    description:
      'Five across the back sit deep and spring forward fast through three midfielders to two strikers.',
    strengths: ['Defensive solidity', 'Counter attacks', 'Block and absorb'],
    slots: [
      gk(),
      ...back5(),
      { id: 'lcm', pos: 'CM', x: 32, y: 50 },
      { id: 'cdm', pos: 'CDM', x: 50, y: 52 },
      { id: 'rcm', pos: 'CM', x: 68, y: 50 },
      ...frontTwo(),
    ],
  },
  '5-4-1': {
    name: '5-4-1',
    style: 'Deep and disciplined',
    description:
      'A back five and a midfield four sit deep behind a lone striker to soak up pressure.',
    strengths: ['Very compact', 'Hard to break down', 'Counter outlet'],
    slots: [
      gk(),
      ...back5(),
      { id: 'lm', pos: 'LM', x: 16, y: 48 },
      { id: 'lcm', pos: 'CM', x: 38, y: 50 },
      { id: 'rcm', pos: 'CM', x: 62, y: 50 },
      { id: 'rm', pos: 'RM', x: 84, y: 48 },
      ...loneStriker(),
    ],
  },
}

// The formations grouped by their defensive line, used to organise the dropdown
// menus so the long FIFA style list stays easy to scan.
export interface FormationGroup {
  label: string
  names: FormationName[]
}

export const FORMATION_GROUPS: FormationGroup[] = [
  { label: 'Back four', names: FORMATION_NAMES.filter((n) => n.startsWith('4')) },
  { label: 'Back three', names: FORMATION_NAMES.filter((n) => n.startsWith('3')) },
  { label: 'Back five', names: FORMATION_NAMES.filter((n) => n.startsWith('5')) },
]

// Resolves any incoming formation string (e.g. a team default) to a supported
// formation, falling back to 4-3-3 when the value is unknown.
export function normalizeFormation(value: string | undefined): FormationName {
  const match = (FORMATION_NAMES as readonly string[]).find((n) => n === value)
  return (match as FormationName) ?? '4-3-3'
}
