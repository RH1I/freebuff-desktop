import type { ColorFilter, ColorSettings, BlurSettings } from './types'

const FILTER_CSS: Record<ColorFilter, string> = {
  none: '',
  bw: 'grayscale(1) contrast(1.15)',
  sepia: 'sepia(0.85) contrast(1.05)',
  warm: 'sepia(0.3) saturate(1.3) hue-rotate(-12deg)',
  cool: 'saturate(1.15) hue-rotate(18deg) brightness(1.02)',
  vintage: 'sepia(0.45) contrast(0.92) brightness(1.06) saturate(0.85)',
  fade: 'contrast(0.8) brightness(1.12) saturate(0.75)',
  cyber: 'saturate(1.6) hue-rotate(45deg) contrast(1.15)',
}

export function filterCss(filter: ColorFilter): string {
  return FILTER_CSS[filter]
}

export function colorCss(c: ColorSettings): string {
  const parts: string[] = []
  const f = FILTER_CSS[c.filter]
  if (f) parts.push(f)
  if (c.grayscale > 0) parts.push(`grayscale(${c.grayscale / 100})`)
  if (c.saturation !== 100) parts.push(`saturate(${c.saturation / 100})`)
  return parts.join(' ')
}

export function blurCss(b: BlurSettings): string {
  if (b.type === 'gaussian') return `blur(${(b.amount / 100) * 12}px)`
  return ''
}

export function applyTint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: ColorSettings,
): void {
  if (c.tintOpacity <= 0) return
  ctx.save()
  ctx.globalCompositeOperation = c.blend as GlobalCompositeOperation
  ctx.globalAlpha = c.tintOpacity / 100
  ctx.fillStyle = c.tint
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}
