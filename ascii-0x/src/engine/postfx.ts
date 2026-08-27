import type { FxSettings } from './types'
import { mulberry32 } from './matrices'

export function applyPostFx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fx: FxSettings,
  seed: number,
): void {
  if (fx.glitch.on) glitch(ctx, w, h, fx.glitch.intensity, seed)
  if (fx.rgbsplit.on) rgbSplit(ctx, w, h, fx.rgbsplit.intensity)
  if (fx.chromatic.on) chromatic(ctx, w, h, fx.chromatic.intensity)
  if (fx.pixelate.on) pixelate(ctx, w, h, fx.pixelate.intensity)
  if (fx.crt.on) crt(ctx, w, h, fx.crt.intensity)
  if (fx.bloom.on) bloom(ctx, w, h, fx.bloom.intensity)
  if (fx.scanlines.on) scanlines(ctx, w, h, fx.scanlines.intensity)
  if (fx.vignette.on) vignette(ctx, w, h, fx.vignette.intensity)
  if (fx.grain.on) grain(ctx, w, h, fx.grain.intensity, seed)
  if (fx.dust.on) dust(ctx, w, h, fx.dust.intensity, seed)
}

function glitch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
  seed: number,
): void {
  const rnd = mulberry32(seed + 7)
  const bands = Math.round(2 + (intensity / 100) * 10)
  for (let i = 0; i < bands; i++) {
    const y = Math.floor(rnd() * h)
    const bh = Math.floor(2 + rnd() * (h / 30))
    const shift = Math.floor((rnd() - 0.5) * (intensity / 100) * w * 0.08)
    const slice = ctx.getImageData(0, y, w, Math.min(bh, h - y))
    ctx.clearRect(0, y, w, bh)
    ctx.putImageData(slice, shift, y)
  }
}

function rgbSplit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const d = Math.max(1, Math.round((intensity / 100) * 8))
  const img = ctx.getImageData(0, 0, w, h)
  const src = img.data
  const out = ctx.createImageData(w, h)
  const dst = out.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      const ro = (y * w + Math.min(w - 1, x + d)) * 4
      const bo = (y * w + Math.max(0, x - d)) * 4
      dst[o] = src[ro]
      dst[o + 1] = src[o + 1]
      dst[o + 2] = src[bo + 2]
      dst[o + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)

}

function chromatic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const d = Math.max(1, Math.round((intensity / 100) * 6))
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 0.25
  ctx.drawImage(ctx.canvas, d, -d / 2, w, h)
  ctx.drawImage(ctx.canvas, -d, d / 2, w, h)
  ctx.restore()

}

function pixelate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const size = Math.max(2, Math.round((intensity / 100) * 24))
  const sw = Math.max(2, Math.round(w / size))
  const sh = Math.max(2, Math.round(h / size))
  const tmp = document.createElement('canvas')
  tmp.width = sw
  tmp.height = sh
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(ctx.canvas, 0, 0, sw, sh)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h)
  ctx.imageSmoothingEnabled = true
}

function crt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const slices = 60
  const sh = h / slices
  const bulge = (intensity / 100) * w * 0.04
  const tmp = document.createElement('canvas')
  tmp.width = w
  tmp.height = h
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  tctx.drawImage(ctx.canvas, 0, 0)
  ctx.clearRect(0, 0, w, h)
  for (let i = 0; i < slices; i++) {
    const t = i / (slices - 1)
    const off = Math.sin(t * Math.PI) * bulge
    const inset = off
    ctx.drawImage(tmp, 0, i * sh, w, sh, inset, i * sh, w - inset * 2, sh)
  }
}

function bloom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const tmp = document.createElement('canvas')
  tmp.width = Math.max(2, Math.round(w / 4))
  tmp.height = Math.max(2, Math.round(h / 4))
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  tctx.filter = `brightness(1.4) contrast(1.8) blur(2px)`
  tctx.drawImage(ctx.canvas, 0, 0, tmp.width, tmp.height)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = (intensity / 100) * 0.55
  ctx.filter = `blur(${Math.max(2, (intensity / 100) * 8)}px)`
  ctx.drawImage(tmp, 0, 0, w, h)
  ctx.restore()
  ctx.filter = 'none'
}

function scanlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const step = 3
  ctx.save()
  ctx.globalAlpha = (intensity / 100) * 0.35
  ctx.fillStyle = '#000'
  for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, 1)
  ctx.restore()
}

function vignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72,
  )
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${(intensity / 100) * 0.85})`)
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

function grain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
  seed: number,
): void {
  const rnd = mulberry32(seed + 99)
  const n = Math.round((intensity / 100) * w * h * 0.06)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd() * w)
    const y = Math.floor(rnd() * h)
    const o = (y * w + x) * 4
    const delta = (rnd() - 0.5) * (intensity / 100) * 160
    d[o] = Math.max(0, Math.min(255, d[o] + delta))
    d[o + 1] = Math.max(0, Math.min(255, d[o + 1] + delta))
    d[o + 2] = Math.max(0, Math.min(255, d[o + 2] + delta))
  }
  ctx.putImageData(img, 0, 0)
}

function dust(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
  seed: number,
): void {
  const rnd = mulberry32(seed + 555)
  const n = Math.round((intensity / 100) * 140)
  ctx.save()
  for (let i = 0; i < n; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const r = 0.4 + rnd() * 1.4
    ctx.globalAlpha = 0.12 + rnd() * 0.3
    ctx.fillStyle = rnd() > 0.25 ? '#f5edd8' : '#241c12'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
