import type { AlgorithmId } from './types'

function bayer(n: number): number[][] {
  if (n === 2) {
    return [
      [0, 2],
      [3, 1],
    ]
  }
  const prev = bayer(n / 2)
  const out: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const q = prev[y % (n / 2)][x % (n / 2)]
      const quad = (y < n / 2 ? 0 : 2) + (x < n / 2 ? 0 : 1)
      const offsets = [0, 2, 3, 1]
      out[y][x] = q * 4 + offsets[quad]
    }
  }
  return out
}

const B2 = bayer(2)
const B4 = bayer(4)
const B8 = bayer(8)
const B16 = bayer(16)

const HALFTONE = [
  [24, 10, 12, 26, 35, 47, 49, 37],
  [8, 0, 2, 14, 45, 59, 61, 51],
  [22, 6, 4, 16, 43, 57, 63, 53],
  [30, 20, 18, 28, 33, 41, 55, 39],
  [34, 46, 48, 36, 25, 11, 13, 27],
  [44, 58, 60, 50, 9, 1, 3, 15],
  [42, 56, 62, 52, 23, 7, 5, 17],
  [32, 40, 54, 38, 31, 21, 19, 29],
].map((row) => row.map((v) => v / 64))

const BLUENOISE = [
  [34, 44, 19, 25, 8, 15, 40, 47, 2, 9, 31, 37, 22, 27, 12, 17],
  [43, 39, 46, 21, 41, 26, 11, 5, 32, 38, 3, 28, 48, 18, 60, 55],
  [20, 47, 24, 10, 30, 45, 1, 36, 23, 29, 62, 16, 7, 33, 26, 42],
  [13, 6, 51, 57, 16, 3, 59, 22, 44, 50, 12, 56, 35, 61, 4, 30],
  [37, 27, 15, 41, 49, 57, 20, 63, 10, 18, 52, 24, 46, 2, 39, 58],
  [4, 55, 62, 29, 11, 36, 51, 14, 59, 33, 6, 45, 19, 53, 25, 8],
  [48, 17, 7, 53, 61, 23, 40, 28, 15, 57, 35, 1, 50, 11, 43, 32],
  [26, 60, 38, 2, 33, 54, 9, 47, 28, 5, 41, 63, 21, 56, 14, 49],
  [31, 12, 45, 18, 58, 7, 49, 24, 39, 61, 16, 30, 3, 42, 20, 54],
  [52, 22, 5, 35, 14, 46, 27, 60, 8, 25, 55, 13, 59, 31, 47, 10],
  [16, 41, 63, 28, 50, 1, 34, 19, 53, 45, 23, 62, 9, 37, 29, 4],
  [57, 3, 30, 55, 21, 62, 44, 6, 26, 12, 48, 34, 51, 17, 58, 40],
  [23, 50, 11, 42, 4, 32, 13, 56, 36, 64, 20, 46, 27, 7, 33, 61],
  [9, 63, 39, 14, 43, 24, 66, 37, 2, 58, 41, 5, 60, 49, 22, 15],
  [45, 19, 59, 8, 65, 51, 29, 10, 54, 31, 67, 38, 14, 63, 6, 44],
  [61, 28, 48, 64, 35, 17, 53, 42, 66, 11, 4, 56, 43, 24, 52, 27],
].map((row) => row.map((v) => ((v - 1) % 64) / 64))

function voidCluster32(): number[][] {
  const N = 32
  const energy: number[][] = Array.from({ length: N }, () => Array(N).fill(0))
  const rng = mulberry32(20260824)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          if (dx === 0 && dy === 0) continue
          const d2 = dx * dx + dy * dy
          energy[y][x] += Math.exp(-d2 / 6) * (1 + rng() * 0.001)
        }
  const ranks: number[][] = Array.from({ length: N }, () => Array(N).fill(0))
  const flat: { x: number; y: number; e: number }[] = []
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) flat.push({ x, y, e: energy[y][x] })
  flat.sort((a, b) => a.e - b.e)
  for (let i = 0; i < flat.length; i++) {
    const p = flat[i]
    let swap = flat[(i * 7919 + 104729) % flat.length]
    if (swap.e > 1e9) swap = p
    ranks[p.y][p.x] = i
  }
  return ranks.map((row) => row.map((v) => v / (N * N)))
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let VC32: number[][] | null = null
function vc(): number[][] {
  if (!VC32) VC32 = voidCluster32()
  return VC32
}

export function isDiffusion(alg: AlgorithmId): boolean {
  return (
    alg === 'floyd' || alg === 'atkinson' || alg === 'stucki' || alg === 'sierra' || alg === 'riemersma'
  )
}

export function thresholdAt(
  alg: AlgorithmId,
  x: number,
  y: number,
  rnd: () => number,
): number {
  switch (alg) {
    case 'bayer2':
      return B2[y % 2][x % 2] / 4
    case 'bayer4':
      return B4[y % 4][x % 4] / 16
    case 'bayer8':
      return B8[y % 8][x % 8] / 64
    case 'bayer16':
      return B16[y % 16][x % 16] / 256
    case 'halftone':
      return HALFTONE[y % 8][x % 8]
    case 'radial': {
      const dx = (x % 16) - 8
      const dy = (y % 16) - 8
      return (Math.sqrt(dx * dx + dy * dy) / 11.3 + 0.15) % 1
    }
    case 'hlines':
      return y % 2 === 0 ? 0.25 : 0.75
    case 'vlines':
      return x % 2 === 0 ? 0.25 : 0.75
    case 'dlines':
      return (x + y) % 2 === 0 ? 0.25 : 0.75
    case 'whitenoise':
      return rnd()
    case 'bluenoise':
      return BLUENOISE[y % 16][x % 16]
    case 'voidcluster':
      return vc()[y % 32][x % 32]
    default:
      return 0.5
  }
}

interface DiffusionKernel {
  points: [number, number, number][]
  divisor: number
}

const KERNELS: Record<string, DiffusionKernel> = {
  floyd: {
    points: [
      [1, 0, 7],
      [2, 0, 1],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
    divisor: 16,
  },
  atkinson: {
    points: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
    divisor: 8,
  },
  stucki: {
    points: [
      [1, 0, 8],
      [2, 0, 4],
      [-2, 1, 2],
      [-1, 1, 4],
      [0, 1, 8],
      [1, 1, 4],
      [2, 1, 2],
      [-2, 2, 1],
      [-1, 2, 2],
      [0, 2, 4],
      [1, 2, 2],
      [2, 2, 1],
    ],
    divisor: 42,
  },
  sierra: {
    points: [
      [1, 0, 2],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 2],
      [1, 1, 1],
    ],
    divisor: 8,
  },
}

export function diffuse(
  lum: Float32Array,
  cols: number,
  rows: number,
  alg: AlgorithmId,
  serpentine: boolean,
): void {
  if (alg === 'riemersma') {
    riemersma(lum, cols, rows)
    return
  }
  const kernel = KERNELS[alg]
  if (!kernel) return
  for (let y = 0; y < rows; y++) {
    const ltr = !serpentine || y % 2 === 0
    for (let k = 0; k < cols; k++) {
      const x = ltr ? k : cols - 1 - k
      const i = y * cols + x
      const old = lum[i]
      const neu = old < 0.5 ? 0 : 1
      const err = old - neu
      lum[i] = neu
      for (const [dx, dy, w] of kernel.points) {
        const nx = x + (ltr ? dx : -dx)
        const ny = y + dy
        if (nx < 0 || nx >= cols || ny >= rows) continue
        lum[ny * cols + nx] += (err * w) / kernel.divisor
      }
    }
  }
}

function hilbertIndex(x: number, y: number, order: number): number {
  let d = 0
  let s = 1 << (order - 1)
  let xx = x
  let yy = y
  for (let n = order; n > 0; n--) {
    const rx = (xx & s) > 0 ? 1 : 0
    const ry = (yy & s) > 0 ? 1 : 0
    d += s * s * ((3 * rx) ^ ry)
    if (ry === 0) {
      if (rx === 1) {
        xx = s - 1 - xx
        yy = s - 1 - yy
      }
      const tmp = xx
      xx = yy
      yy = tmp
    }
    s >>= 1
  }
  return d
}

function riemersma(lum: Float32Array, cols: number, rows: number): void {
  const order = Math.max(2, Math.ceil(Math.log2(Math.max(cols, rows))))
  const N = 1 << order
  const size = N * N
  const seq = new Int32Array(size)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) seq[hilbertIndex(x, y, order)] = y * cols + x
  const queue: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < size; i++) {
    const idx = seq[i]
    if (idx >= lum.length) continue
    const old = lum[idx]
    let total = old
    for (let q = 0; q < queue.length; q++) total += queue[q] * (1 / (q + 2))
    const neu = total < 0.5 ? 0 : 1
    const err = old - neu
    lum[idx] = neu
    queue.pop()
    queue.unshift(err)
  }
}
