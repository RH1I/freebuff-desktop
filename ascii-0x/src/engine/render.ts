import type { ChromaId, CropSettings, Settings, StyleId } from './types'
import { ASPECTS } from './types'
import { paletteById, rgbOf } from './palettes'
import { diffuse, isDiffusion, mulberry32, thresholdAt } from './matrices'
import { blurCss, colorCss, applyTint } from './color'
import { applyPostFx } from './postfx'

const RAMP = ' .`-\':;!i|+*?%#@$@'.split('')
const GLYPH_FONTS = 'ui-monospace, "SF Mono", Menlo, monospace'
const MAX_DIM = 1400

export type Source = ImageBitmap | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement

function srcSize(s: Source): { sw: number; sh: number } {
  if (s instanceof HTMLVideoElement) return { sw: s.videoWidth || 2, sh: s.videoHeight || 2 }
  return { sw: s.width, sh: s.height }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function lumOf(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function rampColor(ramp: string[], v: number): [number, number, number] {
  const idx = Math.min(ramp.length - 1, Math.max(0, Math.round(v * (ramp.length - 1))))
  return rgbOf(ramp[idx])
}

export function computeCrop(
  sw: number,
  sh: number,
  crop: CropSettings,
): { sx: number; sy: number; cw: number; ch: number } {
  let cw = sw
  let ch = sh
  const asp = ASPECTS.find((a) => a.id === crop.aspect)
  if (asp && asp.w > 0) {
    const target = asp.w / asp.h
    if (sw / sh > target) {
      ch = sh
      cw = sh * target
    } else {
      cw = sw
      ch = sw / target
    }
  }
  const z = Math.max(10, crop.zoom) / 100
  cw = sw / z < cw ? sw / z : cw
  ch = sh / z < ch ? sh / z : ch
  const sx = (sw - cw) / 2 + (crop.offsetX / 100) * ((sw - cw) / 2)
  const sy = (sh - ch) / 2 + (crop.offsetY / 100) * ((sh - ch) / 2)
  return { sx: Math.max(0, sx), sy: Math.max(0, sy), cw: Math.min(cw, sw), ch: Math.min(ch, sh) }
}

function specialBlur(
  work: HTMLCanvasElement,
  b: { type: Settings['blur']['type']; amount: number },
): void {
  if (b.type === 'off' || b.type === 'gaussian') return
  const w = work.width
  const h = work.height
  const ctx = work.getContext('2d')
  if (!ctx) return
  const blurred = document.createElement('canvas')
  blurred.width = w
  blurred.height = h
  const bctx = blurred.getContext('2d')
  if (!bctx) return
  const px = (b.amount / 100) * 14
  bctx.filter = `blur(${px}px)`
  bctx.drawImage(work, 0, 0)
  bctx.filter = 'none'

  const mask = document.createElement('canvas')
  mask.width = w
  mask.height = h
  const mctx = mask.getContext('2d')
  if (!mctx) return

  if (b.type === 'lens' || b.type === 'radial') {
    const g = mctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.62)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    mctx.fillStyle = g
    mctx.fillRect(0, 0, w, h)
  } else if (b.type === 'tiltshift') {
    const g = mctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.35, 'rgba(0,0,0,1)')
    g.addColorStop(0.65, 'rgba(0,0,0,1)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    mctx.fillStyle = g
    mctx.fillRect(0, 0, w, h)
  } else if (b.type === 'progressive') {
    const g = mctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,1)')
    mctx.fillStyle = g
    mctx.fillRect(0, 0, w, h)
  }

  if (b.type === 'directional') {
    ctx.save()
    ctx.globalAlpha = 0.22
    const d = Math.max(2, px)
    for (let i = 1; i <= 5; i++) {
      ctx.drawImage(work, (i / 5) * d, (i / 5) * d * 0.4)
      ctx.drawImage(work, (-i / 5) * d, (-i / 5) * d * 0.4)
    }
    ctx.restore()
    return
  }

  bctx.globalCompositeOperation = 'destination-in'
  bctx.drawImage(mask, 0, 0)
  bctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(blurred, 0, 0)
}

export interface Cells {
  cols: number
  rows: number
  g: number
  W: number
  H: number
  v: Float32Array
  cr: Float32Array
  cg: Float32Array
  cb: Float32Array
}

export function computeCells(
  source: Source,
  settings: Settings,
  scale = 1,
  preview = false,
): Cells | null {
  const { sw, sh } = srcSize(source)
  if (!sw || !sh) return null
  const { sx, sy, cw, ch } = computeCrop(sw, sh, settings.crop)
  const rot = settings.crop.rotation
  const baseW = rot % 180 === 0 ? cw : ch
  const baseH = rot % 180 === 0 ? ch : cw
  const fit = Math.min(1, MAX_DIM / Math.max(baseW, baseH))
  const q = preview ? 0.5 : 1
  const W = Math.max(2, Math.round(baseW * fit * scale * q))
  const H = Math.max(2, Math.round(baseH * fit * scale * q))

  const stage = document.createElement('canvas')
  stage.width = W
  stage.height = H
  const sctx = stage.getContext('2d', { willReadFrequently: true })
  if (!sctx) return null

  const midW = rot % 180 === 0 ? W : H
  const midH = rot % 180 === 0 ? H : W
  const mid = document.createElement('canvas')
  mid.width = midW
  mid.height = midH
  const mctx = mid.getContext('2d')
  if (!mctx) return null
  mctx.imageSmoothingEnabled = true
  mctx.drawImage(source, sx, sy, cw, ch, 0, 0, midW, midH)

  sctx.save()
  if (rot !== 0) {
    sctx.translate(W / 2, H / 2)
    sctx.rotate((rot * Math.PI) / 180)
    sctx.drawImage(mid, -midW / 2, -midH / 2)
  } else {
    sctx.drawImage(mid, 0, 0)
  }
  sctx.restore()

  const css = [colorCss(settings.color), blurCss(settings.blur)].filter(Boolean).join(' ')
  if (css) {
    const filtered = document.createElement('canvas')
    filtered.width = W
    filtered.height = H
    const fctx = filtered.getContext('2d')
    if (!fctx) return null
    fctx.filter = css
    fctx.drawImage(stage, 0, 0)
    sctx.clearRect(0, 0, W, H)
    sctx.drawImage(filtered, 0, 0)
  }
  specialBlur(stage, settings.blur)

  const wctx = stage.getContext('2d', { willReadFrequently: true })
  if (!wctx) return null

  const g = Math.max(3, settings.cellSize) * scale * q
  const cols = Math.max(1, Math.ceil(W / g))
  const rows = Math.max(1, Math.ceil(H / g))
  const ps = Math.max(1, Math.round(settings.pixelSize))

  const off = document.createElement('canvas')
  off.width = cols * ps
  off.height = rows * ps
  const octx = off.getContext('2d', { willReadFrequently: true })
  if (!octx) return null
  octx.imageSmoothingEnabled = true
  octx.drawImage(stage, 0, 0, cols * ps, rows * ps)
  const img = octx.getImageData(0, 0, cols * ps, rows * ps)
  const pxData = img.data

  const n = cols * rows
  const lum = new Float32Array(n)
  const cr = new Float32Array(n)
  const cg = new Float32Array(n)
  const cb = new Float32Array(n)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      let r = 0
      let gg = 0
      let b = 0
      let count = 0
      for (let dy = 0; dy < ps; dy++) {
        for (let dx = 0; dx < ps; dx++) {
          const o2 = ((y * ps + dy) * cols * ps + (x * ps + dx)) * 4
          r += pxData[o2]
          gg += pxData[o2 + 1]
          b += pxData[o2 + 2]
          count++
        }
      }
      r /= count
      gg /= count
      b /= count
      cr[i] = r
      cg[i] = gg
      cb[i] = b
      const c = settings.contrast / 100
      const thrBias = (settings.threshold - 50) / 100
      lum[i] = clamp01((lumOf(r, gg, b) - 0.5) * c + 0.5 + thrBias * 0.5)
    }
  }

  const useOrdered =
    (settings.style === 'dither' || settings.style === 'braille') && !isDiffusion(settings.algorithm)
  const useDiffusion =
    isDiffusion(settings.algorithm) && (settings.style === 'dither' || settings.style === 'braille')

  let binary: Float32Array | null = null
  if (useDiffusion) {
    const copy = new Float32Array(lum)
    diffuse(copy, cols, rows, settings.algorithm, settings.serpentine)
    binary = copy
  }

  const palette = paletteById(settings.palette)
  const ramp = settings.palette === 'custom' ? settings.customRamp : palette.ramp
  const effRamp = ramp.length >= 2 ? ramp : ['#000000', '#ffffff']
  const isOriginal = settings.palette === 'original'
  const strength = settings.strength / 100
  const rnd = mulberry32(settings.seed)

  const v = new Float32Array(n)
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx
      let val = lum[i]
      if (useOrdered) {
        const t = thresholdAt(settings.algorithm, cx, cy, rnd)
        const levels =
          settings.chroma === 'binary' ? 2 : isOriginal ? 12 : Math.max(2, effRamp.length)
        const cont = clamp01(lum[i]) * (levels - 1)
        let idx = Math.floor(cont + t * strength)
        idx = Math.max(0, Math.min(levels - 1, idx))
        val = (clamp01(lum[i]) * (levels - 1) * (1 - strength) + idx) / (levels - 1)
      } else if (binary) {
        val = lum[i] * (1 - strength) + binary[i] * strength
      }
      v[i] = clamp01(val)
    }
  }

  return { cols, rows, g, W, H, v, cr, cg, cb }
}

function cellColor(
  settings: Settings,
  effRamp: string[],
  isOriginal: boolean,
  i: number,
  cells: Cells,
): [number, number, number] {
  const v = cells.v[i]
  const monoChroma = settings.chroma === 'luminance' || settings.chroma === 'binary'
  if (settings.chroma === 'binary') {
    const on = v > 0.5
    return on ? [255, 255, 255] : [0, 0, 0]
  }
  if (isOriginal && settings.chroma !== 'luminance') {
    return [cells.cr[i], cells.cg[i], cells.cb[i]]
  }
  if (monoChroma) {
    const grey = Math.round(v * 255)
    return [grey, grey, grey]
  }
  return rampColor(effRamp, v)
}

export function render(
  canvas: HTMLCanvasElement,
  source: Source,
  settings: Settings,
  opts: { scale?: number; transparent?: boolean; preview?: boolean } = {},
): Cells | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const cells = computeCells(source, settings, opts.scale ?? 1, opts.preview ?? false)
  if (!cells) return null
  const { cols, rows, g, W, H, v } = cells

  canvas.width = W
  canvas.height = H
  ctx.clearRect(0, 0, W, H)
  if (!opts.transparent) {
    const palette = paletteById(settings.palette)
    const ramp =
      settings.palette === 'custom' ? settings.customRamp : palette.ramp.length ? palette.ramp : ['#000000']
    ctx.fillStyle = ramp[0]
    ctx.fillRect(0, 0, W, H)
  }

  const palette = paletteById(settings.palette)
  const rampRaw = settings.palette === 'custom' ? settings.customRamp : palette.ramp
  const effRamp = rampRaw.length >= 2 ? rampRaw : ['#000000', '#ffffff']
  const isOriginal = settings.palette === 'original'
  const rnd = mulberry32(settings.seed)
  const mask = settings.mask

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx
      const lumHere = (cells.cr[i] * 0.2126 + cells.cg[i] * 0.7152 + cells.cb[i] * 0.0722) / 255
      let color: [number, number, number]
      let vv = v[i]
      if (mask.enabled && (lumHere * 100 < mask.shadows || lumHere * 100 > 100 - mask.highlights)) {
        color = [cells.cr[i], cells.cg[i], cells.cb[i]]
        vv = lumHere
      } else {
        color = cellColor(settings, effRamp, isOriginal, i, cells)
      }
      drawCell(ctx, settings.style, cx, cy, g, vv, color, i, rnd)
    }
  }

  applyTint(ctx, W, H, settings.color)
  applyPostFx(ctx, W, H, settings.fx, settings.seed)
  return cells
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  style: StyleId,
  cx: number,
  cy: number,
  g: number,
  v: number,
  color: [number, number, number],
  seedIndex: number,
  rnd: () => number,
): void {
  const x = cx * g
  const y = cy * g
  ctx.fillStyle = `rgb(${color[0] | 0},${color[1] | 0},${color[2] | 0})`
  ctx.strokeStyle = ctx.fillStyle
  const jit = rnd()
  void seedIndex

  switch (style) {
    case 'characters': {
      const idx = Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))
      const ch = RAMP[idx]
      if (ch === ' ') return
      ctx.font = `${Math.round(g * 1.05)}px ${GLYPH_FONTS}`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(ch, x + g / 2, y + g / 2)
      break
    }
    case 'dither':
    case 'pixelart':
      ctx.fillRect(x, y, g, g)
      break
    case 'block': {
      const s = Math.max(0.5, v * g)
      ctx.fillRect(x + (g - s) / 2, y + (g - s) / 2, s, s)
      break
    }
    case 'dots': {
      const rad = Math.max(0.3, (v * g) / 2)
      ctx.beginPath()
      ctx.arc(x + g / 2, y + g / 2, rad, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'mixed': {
      if ((cx + cy) % 2 === 0) {
        const idx = Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))
        const ch = RAMP[idx]
        if (ch !== ' ') {
          ctx.font = `${Math.round(g * 1.05)}px ${GLYPH_FONTS}`
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          ctx.fillText(ch, x + g / 2, y + g / 2)
        }
      } else {
        const s = Math.max(0.5, v * g)
        ctx.fillRect(x + (g - s) / 2, y + (g - s) / 2, s, s)
      }
      break
    }
    case 'mosaic': {
      const ox = jit * g * 0.3
      const oy = rnd() * g * 0.3
      const s = g * (0.75 + v * 0.35)
      ctx.fillRect(x + ox - g * 0.1, y + oy - g * 0.1, Math.min(g, s), Math.min(g, s))
      break
    }
    case 'lego': {
      ctx.fillRect(x, y, g, g)
      ctx.save()
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.arc(x + g / 2, y + g / 2, g * 0.18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(x, y + g - 1.5, g, 1.5)
      ctx.restore()
      break
    }
    case 'cross': {
      const t = Math.max(0.5, v * g * 0.25)
      ctx.lineWidth = t
      const p = g * 0.15
      ctx.beginPath()
      ctx.moveTo(x + p, y + p)
      ctx.lineTo(x + g - p, y + g - p)
      ctx.moveTo(x + g - p, y + p)
      ctx.lineTo(x + p, y + g - p)
      ctx.stroke()
      break
    }
    case 'diamond': {
      const s = (v * g) / 2
      if (s < 0.4) return
      ctx.beginPath()
      ctx.moveTo(x + g / 2, y + g / 2 - s)
      ctx.lineTo(x + g / 2 + s, y + g / 2)
      ctx.lineTo(x + g / 2, y + g / 2 + s)
      ctx.lineTo(x + g / 2 - s, y + g / 2)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'lines': {
      const hh = Math.max(0.5, v * g)
      ctx.fillRect(x, y + (g - hh), g, hh)
      break
    }
    case 'diagonal': {
      const t = Math.max(0.5, v * g * 0.3)
      ctx.lineWidth = t
      ctx.beginPath()
      if ((cx + cy) % 2 === 0) {
        ctx.moveTo(x, y + g)
        ctx.lineTo(x + g, y)
      } else {
        ctx.moveTo(x, y)
        ctx.lineTo(x + g, y + g)
      }
      ctx.stroke()
      break
    }
    case 'braille': {
      const dot = Math.max(0.6, g * 0.14)
      for (let by = 0; by < 4; by++) {
        for (let bx = 0; bx < 2; bx++) {
          const t = thresholdAt('bayer4', cx * 2 + bx, cy * 4 + by, rnd)
          if (v > t) {
            ctx.beginPath()
            ctx.arc(x + g * (0.3 + bx * 0.4), y + g * (0.15 + by * 0.23), dot, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      break
    }
    case 'voxel': {
      ctx.fillRect(x, y, g, g)
      ctx.save()
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillRect(x, y, g, Math.max(1, g * 0.18))
      ctx.fillStyle = 'rgba(0,0,0,0.28)'
      ctx.fillRect(x + g - Math.max(1, g * 0.18), y, Math.max(1, g * 0.18), g)
      ctx.restore()
      break
    }
    case 'disco': {
      const hue = (seedIndex * 7 + v * 140 + jit * 40) % 360
      ctx.fillStyle = `hsl(${hue} 90% ${18 + v * 55}%)`
      ctx.fillRect(x, y, g, g)
      break
    }
    case 'hexagon': {
      const s = (v * g) / 2
      if (s < 0.4) return
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 6
        const px2 = x + g / 2 + Math.cos(a) * s
        const py2 = y + g / 2 + Math.sin(a) * s
        if (k === 0) ctx.moveTo(px2, py2)
        else ctx.lineTo(px2, py2)
      }
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'triangle': {
      const s = (v * g) / 2
      if (s < 0.4) return
      ctx.beginPath()
      ctx.moveTo(x + g / 2, y + g / 2 - s)
      ctx.lineTo(x + g / 2 + s * 0.87, y + g / 2 + s * 0.5)
      ctx.lineTo(x + g / 2 - s * 0.87, y + g / 2 + s * 0.5)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'star': {
      const outer = (v * g) / 2
      if (outer < 0.5) return
      const inner = outer * 0.45
      ctx.beginPath()
      for (let k = 0; k < 10; k++) {
        const a = (Math.PI / 5) * k - Math.PI / 2
        const rr = k % 2 === 0 ? outer : inner
        const px2 = x + g / 2 + Math.cos(a) * rr
        const py2 = y + g / 2 + Math.sin(a) * rr
        if (k === 0) ctx.moveTo(px2, py2)
        else ctx.lineTo(px2, py2)
      }
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'spiral': {
      const turns = 1 + v * 2
      const rr = (v * g) / 2
      if (rr < 0.5) return
      ctx.lineWidth = Math.max(0.5, g * 0.1)
      ctx.beginPath()
      for (let a = 0; a < turns * Math.PI * 2; a += 0.35) {
        const rad = (a / (turns * Math.PI * 2)) * rr
        const px2 = x + g / 2 + Math.cos(a) * rad
        const py2 = y + g / 2 + Math.sin(a) * rad
        if (a === 0) ctx.moveTo(px2, py2)
        else ctx.lineTo(px2, py2)
      }
      ctx.stroke()
      break
    }
    case 'waves': {
      const t = Math.max(0.5, v * g * 0.3)
      ctx.lineWidth = t
      ctx.beginPath()
      for (let dx = 0; dx <= g; dx += 2) {
        const py2 = y + g / 2 + Math.sin((dx / g) * Math.PI * 2 + cx) * (g * 0.25)
        if (dx === 0) ctx.moveTo(x + dx, py2)
        else ctx.lineTo(x + dx, py2)
      }
      ctx.stroke()
      break
    }
    case 'heart': {
      const s = (v * g) / 2
      if (s < 0.5) return
      ctx.beginPath()
      const cxm = x + g / 2
      const cym = y + g / 2 + s * 0.25
      ctx.moveTo(cxm, cym + s * 0.75)
      ctx.bezierCurveTo(cxm - s * 1.1, cym - s * 0.1, cxm - s * 0.55, cym - s * 0.95, cxm, cym - s * 0.35)
      ctx.bezierCurveTo(cxm + s * 0.55, cym - s * 0.95, cxm + s * 1.1, cym - s * 0.1, cxm, cym + s * 0.75)
      ctx.fill()
      break
    }
    default:
      ctx.fillRect(x, y, g, g)
  }
}

export function chromaLabel(id: ChromaId): string {
  return id
}
