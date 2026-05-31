import type { DetailedPosition } from './types'

// Manual overrides for individual players, keyed by team id then jersey number.
export type PlayerOverride = {
  position?: DetailedPosition
  rating?: number
}

export const PLAYER_OVERRIDES: Record<string, Record<string, PlayerOverride>> = {
  brandeis: {
    '0': { position: 'GK', rating: 86 }, // Adam Henry
    '00': { position: 'GK', rating: 55 }, // Sotiri Tiglianidis
    '1': { position: 'GK', rating: 69 }, // Benny Shin
    '2': { position: 'RB', rating: 63 }, // Alex Karibian
    '3': { position: 'LB', rating: 68 }, // Jacob Morse
    '4': { position: 'CM', rating: 70 }, // Kaito Shinoda
    '5': { position: 'CB', rating: 89 }, // Dylan Marzouca
    '6': { position: 'CM', rating: 84 }, // Juan Vera
    '7': { position: 'RB', rating: 86 }, // Maddox Yu
    '8': { position: 'CAM', rating: 40 }, // Charlie Culbert
    '9': { position: 'ST', rating: 86 }, // Elan Romo
    '10': { position: 'CM', rating: 88 }, // Rainer Osselmann-Chai
    '11': { position: 'RW', rating: 81 }, // Aidan Chuang
    '13': { position: 'CDM', rating: 82 }, // Slater Loffredo
    '14': { position: 'CM', rating: 74 }, // Yoav Feingold
    '15': { position: 'ST', rating: 75 }, // Langston Byrd
    '16': { position: 'ST', rating: 67 }, // Jaiden Banton
    '17': { position: 'ST', rating: 63 }, // Reid Etzbach
    '18': { position: 'CAM', rating: 88 }, // Nico Beninda
    '20': { position: 'CAM', rating: 74 }, // Ben Vogelman
    '21': { position: 'CAM', rating: 78 }, // Josh Andrews
    '22': { position: 'CB', rating: 82 }, // Kenshin Murakawa
    '23': { position: 'RB', rating: 73 }, // Junyeop Lee
    '24': { position: 'RB', rating: 56 }, // Aiden Melesko
    '26': { position: 'LB', rating: 86 }, // Kaden Collins
    '30': { position: 'LB', rating: 71 }, // Edson Gomez-Manja
    '31': { position: 'CB', rating: 73 }, // Alessio Natoli
    '32': { position: 'ST', rating: 81 }, // Keller Chamovitz
    '99': { position: 'GK', rating: 83 }, // Tyler Correnti
  },
  emory: {
    '0': { position: 'GK', rating: 67 }, // Sharan Dodwani
    '00': { position: 'GK', rating: 64 }, // Barrett Eskenazi
    '1': { position: 'GK', rating: 81 }, // Keirnan Skelly
    '2': { position: 'CM', rating: 77 }, // Prescott Bayman
    '3': { position: 'CDM', rating: 73 }, // Jaden Emoghene
    '5': { position: 'CB', rating: 71 }, // Michael Constant
    '6': { position: 'LM', rating: 76 }, // Logan Steren
    '7': { position: 'CAM', rating: 69 }, // Julian Hee
    '8': { position: 'CM', rating: 79 }, // Jack Burgess
    '9': { position: 'LW', rating: 72 }, // Adeyemi Oni
    '10': { position: 'CM', rating: 72 }, // Josh Grand
    '11': { position: 'ST', rating: 77 }, // Lorenzo Avalos
    '12': { position: 'RB', rating: 67 }, // Landon Redding
    '13': { position: 'CB', rating: 76 }, // Georgios Kantaras
    '14': { position: 'CB', rating: 70 }, // Christopher Marchant
    '15': { position: 'RW', rating: 73 }, // Will O'Connor
    '16': { position: 'ST', rating: 65 }, // Finn Jacobson
    '17': { position: 'LM', rating: 80 }, // Paul Saah Jr.
    '18': { position: 'CAM', rating: 74 }, // Mateo Rouhbakhsh
    '19': { position: 'CM', rating: 76 }, // Nick Carrano
    '20': { position: 'CB', rating: 69 }, // Sebastian Salm
    '21': { position: 'CB', rating: 73 }, // Josh Ali
    '22': { position: 'CM', rating: 73 }, // Danny Moya
    '23': { position: 'CM', rating: 62 }, // Maximo Cisneros
    '24': { position: 'CB', rating: 75 }, // Owen Clark
    '26': { position: 'CM', rating: 71 }, // Drew Pintacuda
    '27': { position: 'CB', rating: 75 }, // Phillip Head
    '28': { position: 'CAM', rating: 67 }, // Terence Noh
    '29': { position: 'RW', rating: 60 }, // Parker Rubinacci
    '30': { position: 'RW', rating: 63 }, // Vincent Maraschiello
    '34': { position: 'RM', rating: 64 }, // Benny Hayward
    '35': { position: 'LW', rating: 64 }, // Jake Breitegan
    '37': { position: 'CM', rating: 63 }, // Ibrahim Karabay
    '39': { position: 'CAM', rating: 68 }, // Jacob Wahba
    '40': { position: 'RW', rating: 70 }, // Ignacio Cubeddu
    '99': { position: 'GK', rating: 76 }, // Geoffrey Halpern
  },
  uchicago: {
    '0': { position: 'GK', rating: 67 }, // Josh Nimeroff
    '00': { position: 'GK', rating: 65 }, // Ali Alamery
    '1': { position: 'GK', rating: 73 }, // Gabriel Diaz
    '2': { position: 'CB', rating: 76 }, // Eli Weene
    '3': { position: 'CB', rating: 68 }, // Sean Cooke
    '4': { position: 'CB', rating: 73 }, // William Raenden
    '5': { position: 'CM', rating: 72 }, // Alex Guo
    '6': { position: 'CM', rating: 74 }, // Ricky Kai
    '8': { position: 'CM', rating: 75 }, // Edward Wu
    '9': { position: 'ST', rating: 71 }, // Samuel Jimenez
    '10': { position: 'RW', rating: 71 }, // David Schuster
    '11': { position: 'LB', rating: 67 }, // Juan Carlos Bermudez
    '12': { position: 'CAM', rating: 68 }, // Kai Walsh
    '13': { position: 'CB', rating: 76 }, // Jedd Horowitz
    '14': { position: 'ST', rating: 72 }, // Giovanni Caselli
    '16': { position: 'CM', rating: 72 }, // George Lin
    '17': { position: 'ST', rating: 70 }, // Jadyn Hsieh-Bailey
    '18': { position: 'CB', rating: 76 }, // Max Weene
    '19': { position: 'RB', rating: 67 }, // Nick Lorr
    '20': { position: 'CM', rating: 68 }, // Rafe Westlund
    '21': { position: 'CM', rating: 74 }, // Charlie Wagner
    '22': { position: 'LB', rating: 75 }, // Evan Kanellos
    '24': { position: 'RB', rating: 63 }, // Vaughn DeRath
    '25': { position: 'LB', rating: 71 }, // Patrick Lin
    '26': { position: 'CB', rating: 77 }, // Alex Gomas
    '27': { position: 'RM', rating: 71 }, // William Stewart
    '28': { position: 'CB', rating: 68 }, // Kevin Valdez
    '30': { position: 'CDM', rating: 67 }, // Drake Wenger
    '31': { position: 'ST', rating: 74 }, // Chase Perry
    '32': { position: 'RB', rating: 75 }, // Ethan Peet
    '33': { position: 'CB', rating: 69 }, // Louis Bock
  },
  babson: {
    '0': { position: 'GK', rating: 82 }, // Derek Polanco
    '1': { position: 'GK', rating: 90 }, // Walker White
    '2': { position: 'CDM', rating: 81 }, // Ryan Grund
    '3': { position: 'CB', rating: 85 }, // Liam Goldstein
    '4': { position: 'RB', rating: 80 }, // Lyndon Way
    '5': { position: 'CDM', rating: 89 }, // Matthew Ziegler
    '6': { position: 'CB', rating: 76 }, // Patrick Demaso
    '7': { position: 'CAM', rating: 79 }, // Lorenzo Mancini
    '8': { position: 'CB', rating: 91 }, // Joao Araujo
    '9': { position: 'ST', rating: 73 }, // Joseph Cardaropoli
    '10': { position: 'CAM', rating: 79 }, // Robin Pestka
    '11': { position: 'RM', rating: 86 }, // Samuel Kalishman
    '12': { position: 'CDM', rating: 84 }, // Liam Rhatigan
    '13': { position: 'ST', rating: 84 }, // Matias Gutierrez
    '14': { position: 'ST', rating: 74 }, // Nate Rouette
    '15': { position: 'CAM', rating: 80 }, // Ted Rosenfeld
    '16': { position: 'RW', rating: 87 }, // Sam Morgan
    '17': { position: 'CB', rating: 90 }, // Louis Gazo
    '18': { position: 'CAM', rating: 86 }, // Justin Stone
    '19': { position: 'ST', rating: 89 }, // Alexander Yablonovskiy
    '20': { position: 'CM', rating: 87 }, // Will Lloyd
    '21': { position: 'LB', rating: 83 }, // Luca Tusche
    '22': { position: 'RB', rating: 92 }, // Ryan Kim
    '23': { position: 'LM', rating: 63 }, // James Modiano
    '24': { position: 'RM', rating: 72 }, // Will Anderson
    '26': { position: 'RM', rating: 62 }, // McKenzy Pierre
    '27': { position: 'RM', rating: 71 }, // Tyler Shin
    '28': { position: 'RW', rating: 87 }, // Peter Tcheleshev
    '29': { position: 'LW', rating: 93 }, // Mario Pinto
    '30': { position: 'RB', rating: 72 }, // Ben Cosentino
    '31': { position: 'ST', rating: 81 }, // Troy Stacey
    '32': { position: 'RW', rating: 83 }, // Huey Miller
    '34': { position: 'GK', rating: 80 }, // Mack Lemkau
    '36': { position: 'LW', rating: 79 }, // Owen Guglielmino
  },
  suffolk: {
    '0': { position: 'GK', rating: 82 }, // Ian Caldwell
    '1': { position: 'GK', rating: 83 }, // Nathan Harlow
    '2': { position: 'RB', rating: 78 }, // Faisal Bajunaid
    '3': { position: 'RB', rating: 80 }, // Logan Hawley
    '4': { position: 'RB', rating: 81 }, // Javen Ironside
    '5': { position: 'CDM', rating: 73 }, // Matthew Moreno
    '6': { position: 'CM', rating: 78 }, // Lucca Giammattei
    '7': { position: 'CAM', rating: 80 }, // Maxi Fadel
    '8': { position: 'CM', rating: 89 }, // Ford Lee
    '9': { position: 'ST', rating: 84 }, // Luke Blawn
    '10': { position: 'LW', rating: 89 }, // Diego Pierantozzi
    '11': { position: 'CAM', rating: 90 }, // Francisco Valck
    '12': { position: 'CB', rating: 87 }, // Ricardo Feliciani
    '13': { position: 'LB', rating: 88 }, // Oliver Heth
    '14': { position: 'LB', rating: 77 }, // Ryan Chamberlain
    '15': { position: 'RM', rating: 79 }, // Christian Gardner
    '16': { position: 'LB', rating: 70 }, // Sebastian Gonzalez Vazquez
    '17': { position: 'LW', rating: 84 }, // Dylan Trachtenberg
    '18': { position: 'LB', rating: 69 }, // Thiago Rubino
    '19': { position: 'CM', rating: 74 }, // Sebastian Paba
    '20': { position: 'LW', rating: 75 }, // Dylan Cadavid
    '21': { position: 'ST', rating: 88 }, // Mohamed Mehaya
    '23': { position: 'LB', rating: 83 }, // Emiliano Esquer
    '24': { position: 'ST', rating: 73 }, // Tyler Retchin
    '25': { position: 'CB', rating: 78 }, // Martin Avila
    '26': { position: 'CB', rating: 90 }, // Matthew Belluardo
    '27': { position: 'LW', rating: 72 }, // Yohan Chung
    '28': { position: 'CM', rating: 85 }, // Dylan Rowe
    '29': { position: 'RW', rating: 80 }, // Zach Vlachos
    '30': { position: 'GK', rating: 70 }, // Carter Sewell
    '31': { position: 'ST', rating: 75 }, // Jeremy Cooke
    '32': { position: 'ST', rating: 73 }, // Tommy Kurz
    '33': { position: 'CM', rating: 80 }, // Carter Van Buskirk
    '34': { position: 'CAM', rating: 73 }, // Yan Haiat
    '37': { position: 'RW', rating: 75 }, // Nicolás Zarur
    '38': { position: 'LB', rating: 68 }, // Will Manix
    '41': { position: 'CB', rating: 73 }, // Gavin Raitt
  },
}

export function getPlayerOverride(
  teamId: string,
  number: string,
): PlayerOverride | undefined {
  return PLAYER_OVERRIDES[teamId]?.[number]
}