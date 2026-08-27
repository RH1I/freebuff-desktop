import { render } from './render'
import type { Cells, Source } from './render'
import { RAMP } from './ramp'
import type { Settings } from './types'

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'txt'

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export async function exportImage(
  source: Source,
  settings: Settings,
  format: ExportFormat,
  scale: number,
  transparent: boolean,
): Promise<void> {
  const canvas = document.createElement('canvas')
  render(canvas, source, settings, { scale, transparent: transparent && format === 'png' })
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, mime, format === 'jpg' ? 0.92 : undefined),
  )
  if (blob) download(blob, `ascii0x.${format}`)
}

export function exportTxt(cells: Cells): void {
  const lines: string[] = []
  for (let y = 0; y < cells.rows; y++) {
    let line = ''
    for (let x = 0; x < cells.cols; x++) {
      const v = cells.v[y * cells.cols + x]
      line += RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))]
    }
    lines.push(line)
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  download(blob, 'ascii0x.txt')
}

export function exportSvg(
  cells: Cells,
  settings: Settings,
  colors: Uint8Array,
): void {
  const { cols, rows, g, W, H, v } = cells
  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#040406"/>`,
  )
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      const o = i * 3
      const fill = `rgb(${colors[o]},${colors[o + 1]},${colors[o + 2]})`
      const vv = v[i]
      if (settings.style === 'dots') {
        const rad = (vv * g) / 2
        if (rad > 0.3)
          parts.push(
            `<circle cx="${(x * g + g / 2).toFixed(1)}" cy="${(y * g + g / 2).toFixed(1)}" r="${rad.toFixed(1)}" fill="${fill}"/>`,
          )
      } else if (settings.style === 'characters') {
        const ch = RAMP[Math.min(RAMP.length - 1, Math.round(vv * (RAMP.length - 1)))]
        if (ch !== ' ')
          parts.push(
            `<text x="${(x * g + g / 2).toFixed(1)}" y="${(y * g + g / 2).toFixed(1)}" font-family="monospace" font-size="${g.toFixed(1)}" fill="${fill}" text-anchor="middle" dominant-baseline="central">${ch}</text>`,
          )
      } else {
        const s = vv * g
        if (s > 0.5)
          parts.push(
            `<rect x="${(x * g + (g - s) / 2).toFixed(1)}" y="${(y * g + (g - s) / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${fill}"/>`,
          )
      }
    }
  }
  parts.push('</svg>')
  const blob = new Blob([parts.join('')], { type: 'image/svg+xml' })
  download(blob, 'ascii0x.svg')
}

export async function copyToClipboard(source: Source, settings: Settings): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas')
    render(canvas, source, settings, { scale: 2 })
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) return false
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export function cellsColors(
  cells: Cells,
  ramp: string[],
  isOriginal: boolean,
  chroma: Settings['chroma'],
): Uint8Array {
  const n = cells.cols * cells.rows
  const out = new Uint8Array(n * 3)
  for (let i = 0; i < n; i++) {
    let r: number
    let g2: number
    let b: number
    const vv = cells.v[i]
    if (chroma === 'binary') {
      const on = vv > 0.5
      r = g2 = b = on ? 255 : 0
    } else if (isOriginal) {
      r = cells.cr[i]
      g2 = cells.cg[i]
      b = cells.cb[i]
    } else if (chroma === 'luminance') {
      const grey = Math.round(vv * 255)
      r = g2 = b = grey
    } else {
      const idx = Math.min(ramp.length - 1, Math.max(0, Math.round(vv * (ramp.length - 1))))
      const hex = ramp[idx]
      const val = parseInt(hex.slice(1), 16)
      r = (val >> 16) & 255
      g2 = (val >> 8) & 255
      b = val & 255
    }
    out[i * 3] = r
    out[i * 3 + 1] = g2
    out[i * 3 + 2] = b
  }
  return out
}
