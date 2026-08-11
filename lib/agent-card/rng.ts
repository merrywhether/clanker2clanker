/**
 * Seeded pseudo-random source. Every value in a card comes from here rather than `Math.random`,
 * so replaying a seed replays the card exactly.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], inclusive at both ends. */
  int(min: number, max: number): number
  /** True with the given probability. */
  chance(probability: number): boolean
  pick<T>(items: readonly T[]): T
  /** `count` distinct items, or every item when `count` exceeds the list. */
  sample<T>(items: readonly T[], count: number): T[]
}

export function createRng(seed: string): Rng {
  const next = mulberry32(hashSeed(seed))

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  const pick = <T,>(items: readonly T[]): T => items[int(0, items.length - 1)]

  return {
    next,
    int,
    chance: (probability) => next() < probability,
    pick,
    sample: (items, count) => {
      const pool = [...items]
      const taken: (typeof pool)[number][] = []
      const total = Math.min(count, pool.length)
      for (let i = 0; i < total; i++) {
        taken.push(pool.splice(int(0, pool.length - 1), 1)[0])
      }
      return taken
    },
  }
}

/** A seed the caller can hand back to reproduce a card. */
export function randomSeed(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** xmur3 — spreads a string into the 32 bits mulberry32 wants. */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
