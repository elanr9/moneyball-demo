// Deterministic, seedable pseudo random number generator.
// We seed every player and match from a stable string (id) so the entire
// universe is identical on every reload. This matters for a demo: numbers,
// standings, and ratings must never shift between page loads.

export function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// mulberry32: tiny, fast, good-enough distribution for generating demo data.
export function createRng(seed: number | string) {
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return function next(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = () => number

// Random float in [min, max).
export function range(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

// Random integer in [min, max] inclusive.
export function intRange(rng: Rng, min: number, max: number): number {
  return Math.floor(range(rng, min, max + 1))
}

// Pick a single element from an array.
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

// Approximate a normal distribution via the average of two uniforms, then
// clamp into a sensible range. Good for ratings that should cluster.
export function gaussian(rng: Rng, mean: number, spread: number): number {
  const u = (rng() + rng() + rng()) / 3
  return mean + (u - 0.5) * 2 * spread
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}
