declare module 'gifenc' {
  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: number[][]; delay?: number; transparent?: boolean; first?: boolean },
    ) => void
    finish: () => void
    bytes: () => Uint8Array
    bytesView: () => Uint8Array
    reset: () => void
  }
  export function quantize(
    data: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: string },
  ): number[][]
  export function applyPalette(
    data: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string,
  ): Uint8Array
}
