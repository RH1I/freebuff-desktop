import skyUrl from '../assets/vibes/sky.png'
import artUrl from '../assets/vibes/0000108796.jpg'
import { mulberry32 } from './matrices'

export interface DemoBg {
  id: string
  label: string
  labelAr: string
  kind: 'proc' | 'img'
  draw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  url?: string
}

function grainPass(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const rnd = mulberry32(seed)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 26
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)
}

function goldenHorizon(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#8a7a63')
  g.addColorStop(0.42, '#b3a288')
  g.addColorStop(0.52, '#e8cf8e')
  g.addColorStop(0.62, '#d9b96e')
  g.addColorStop(0.75, '#c2a06a')
  g.addColorStop(1, '#a8927a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const sun = ctx.createRadialGradient(w * 0.42, h * 0.2, 4, w * 0.42, h * 0.2, h * 0.16)
  sun.addColorStop(0, 'rgba(255,236,180,0.95)')
  sun.addColorStop(1, 'rgba(255,236,180,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h)
  const rnd = mulberry32(42)
  ctx.save()
  for (let i = 0; i < 46; i++) {
    const cy = h * (0.06 + rnd() * 0.4)
    const cw = w * (0.12 + rnd() * 0.3)
    const chh = h * (0.015 + rnd() * 0.045)
    ctx.globalAlpha = 0.05 + rnd() * 0.1
    ctx.fillStyle = rnd() > 0.5 ? '#6e5f4c' : '#d8c9a8'
    ctx.beginPath()
    ctx.ellipse(rnd() * w, cy, cw / 2, chh / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  grainPass(ctx, w, h, 7)
}

function sunOverSea(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#c9b89a')
  g.addColorStop(0.5, '#e3d3ae')
  g.addColorStop(0.52, '#caa25a')
  g.addColorStop(1, '#8a7a5e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.52
  const r = h * 0.13
  ctx.fillStyle = '#e8c87e'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.globalAlpha = 0.35
  for (let i = 0; i < 14; i++) {
    const yy = cy + (i / 14) * h * 0.4
    ctx.fillStyle = '#f0dCA0'
    ctx.fillRect(cx - r * (1 - i / 20), yy, r * 2 * (1 - i / 20), 3)
  }
  ctx.restore()
  grainPass(ctx, w, h, 11)
}

function duneSea(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w
      const v = y / h
      const t =
        Math.sin(u * 6 + Math.sin(v * 4) * 2) * 0.5 +
        Math.sin((u + v) * 9) * 0.25 +
        Math.sin(v * 14 + u * 3) * 0.25
      const m = (t + 1.5) / 3
      const o = (y * w + x) * 4
      d[o] = 120 + m * 110
      d[o + 1] = 100 + m * 100
      d[o + 2] = 74 + m * 76
      d[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  grainPass(ctx, w, h, 21)
}

function carnival(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#c9b490')
  g.addColorStop(0.6, '#a89068')
  g.addColorStop(1, '#7a6248')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const rnd = mulberry32(77)
  const cols = ['#b34a3a', '#d9c491', '#4a6a52', '#8a4a3a', '#c98a4a']
  for (let i = 0; i < 9; i++) {
    const bw = w * (0.08 + rnd() * 0.12)
    const bh = h * (0.18 + rnd() * 0.3)
    const bx = rnd() * (w - bw)
    const by = h * 0.45 + rnd() * h * 0.3
    ctx.fillStyle = cols[Math.floor(rnd() * cols.length)]
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = 'rgba(40,28,18,0.5)'
    ctx.fillRect(bx, by + bh * 0.32, bw, bh * 0.08)
    if (rnd() > 0.4) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(bx, by, bw, bh * 0.32)
      ctx.clip()
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = k % 2 ? '#e8dcc0' : '#b34a3a'
        ctx.fillRect(bx + (k / 6) * bw, by, bw / 6 + 1, bh * 0.32)
      }
      ctx.restore()
    }
  }
  ctx.fillStyle = '#5a4838'
  ctx.fillRect(0, h * 0.78, w, h * 0.22)
  const tower = w * 0.16
  for (let ry = 0; ry < 10; ry++)
    for (let rx = 0; rx < 4; rx++) {
      ctx.fillStyle = (rx + ry) % 2 ? '#b34a3a' : '#e8dcc0'
      ctx.fillRect(w * 0.42 + rx * (tower / 4), h * 0.12 + ry * (h * 0.066), tower / 4 + 1, h * 0.066 + 1)
    }
  grainPass(ctx, w, h, 33)
}

function cloudDrift(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#b3a488'
  ctx.fillRect(0, 0, w, h)
  const rnd = mulberry32(99)
  for (let i = 0; i < 60; i++) {
    const cy = rnd() * h
    const cw = w * (0.15 + rnd() * 0.45)
    const chh = h * (0.02 + rnd() * 0.08)
    const g = ctx.createRadialGradient(w * rnd(), cy, 1, w * 0.5, cy, cw / 2)
    g.addColorStop(0, `rgba(226,212,182,${0.25 + rnd() * 0.3})`)
    g.addColorStop(1, 'rgba(140,124,100,0)')
    ctx.fillStyle = g
    ctx.save()
    ctx.translate(0, 0)
    ctx.beginPath()
    ctx.ellipse(w * rnd(), cy, cw / 2, chh, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  grainPass(ctx, w, h, 44)
}

function emberSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#3a2418')
  g.addColorStop(0.45, '#8a4a2a')
  g.addColorStop(0.6, '#d98a4a')
  g.addColorStop(0.75, '#e8b878')
  g.addColorStop(1, '#4a3424')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const rnd = mulberry32(123)
  for (let i = 0; i < 26; i++) {
    const cx = rnd() * w
    const cy = h * (0.3 + rnd() * 0.45)
    const r = 2 + rnd() * 5
    ctx.fillStyle = `rgba(255,${160 + rnd() * 60},80,${0.2 + rnd() * 0.5})`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  grainPass(ctx, w, h, 55)
}

function wavesOld(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w
      const v = y / h
      let t =
        Math.sin(u * 9 + Math.sin(v * 6.3) * 2.2) * 0.5 +
        Math.sin((u + v) * 4.5) * 0.3 +
        Math.sin(v * 11.7) * 0.2
      t = (t + 1) / 2
      const o = (y * w + x) * 4
      d[o] = 26 + t * 229
      d[o + 1] = 16 + t * 220
      d[o + 2] = 4 + t * 176
      d[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

function wavesColor(
  c1: number[],
  c3: number[],
  freq: number,
  drift: number,
): (ctx: CanvasRenderingContext2D, w: number, h: number) => void {
  return (ctx, w, h) => {
    const img = ctx.createImageData(w, h)
    const d = img.data
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w
        const v = y / h
        let t =
          Math.sin(u * freq + Math.sin(v * freq * 0.7 + drift) * 2.2) * 0.5 +
          Math.sin((u + v) * freq * 0.5 + drift * 2) * 0.3 +
          Math.sin(v * freq * 1.3 - drift) * 0.2
        t = (t + 1) / 2
        const o = (y * w + x) * 4
        d[o] = c1[0] + (c3[0] - c1[0]) * t
        d[o + 1] = c1[1] + (c3[1] - c1[1]) * t
        d[o + 2] = c1[2] + (c3[2] - c1[2]) * t
        d[o + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }
}

function orbs(c1: number[], c2: number[]) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const grd = ctx.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, `rgb(${c1.join(',')})`)
    grd.addColorStop(1, `rgb(${c2.join(',')})`)
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 26; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453
      const r1 = s - Math.floor(s)
      const s2 = Math.sin(i * 78.233) * 12345.6789
      const r2 = s2 - Math.floor(s2)
      const s3 = Math.sin(i * 3.7) * 9876.5
      const r3 = s3 - Math.floor(s3)
      const rad = (0.04 + r3 * 0.16) * w
      const cx = r1 * w
      const cy = r2 * h
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
      const light = i % 2 === 0 ? '255,240,200' : '120,180,255'
      g2.addColorStop(0, `rgba(${light},${0.5 + r3 * 0.4})`)
      g2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g2
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
    }
  }
}

export const DEMO_BGS: DemoBg[] = [
  { id: 'sky', label: 'Sky', labelAr: 'السماء', kind: 'img', url: skyUrl },
  { id: 'carnivalArt', label: 'Carnival', labelAr: 'الكارنيڤال', kind: 'img', url: artUrl },
  { id: 'horizon', label: 'Golden Horizon', labelAr: 'أفق ذهبي', kind: 'proc', draw: goldenHorizon },
  { id: 'sunsea', label: 'Sun Over Sea', labelAr: 'شمس على البحر', kind: 'proc', draw: sunOverSea },
  { id: 'dunes', label: 'Dune Sea', labelAr: 'بحر الرمال', kind: 'proc', draw: duneSea },
  { id: 'carnival', label: 'Carnival Grounds', labelAr: 'أرض الكارنيڤال', kind: 'proc', draw: carnival },
  { id: 'clouds', label: 'Cloud Drift', labelAr: 'انجراف الغيوم', kind: 'proc', draw: cloudDrift },
  { id: 'ember', label: 'Ember Sky', labelAr: 'سماء جمرة', kind: 'proc', draw: emberSky },
  { id: 'gold', label: 'Golden Waves', labelAr: 'أمواج ذهبية', kind: 'proc', draw: wavesOld },
  { id: 'teal', label: 'Deep Teal', labelAr: 'أزرق عميق', kind: 'proc', draw: wavesColor([3, 12, 16], [20, 120, 130], 7, 2.8) },
  { id: 'magenta', label: 'Neon Dusk', labelAr: 'غروب نيون', kind: 'proc', draw: wavesColor([10, 4, 18], [90, 30, 160], 11, 4.2) },
  { id: 'toxic', label: 'Toxic', labelAr: 'سام', kind: 'proc', draw: wavesColor([4, 10, 4], [20, 120, 40], 12, 5.1) },
  { id: 'bubbles', label: 'Bubbles', labelAr: 'فقاعات', kind: 'proc', draw: orbs([8, 8, 16], [40, 40, 80]) },
  { id: 'sunset', label: 'Sunset Orb', labelAr: 'شمس الغروب', kind: 'proc', draw: orbs([30, 10, 30], [255, 140, 60]) },
]

export function renderDemo(id: string, w = 1280, h = 720): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const bg = DEMO_BGS.find((b) => b.id === id) ?? DEMO_BGS[2]
  if (ctx) {
    if (bg.kind === 'img' && bg.url) {
      const img = new Image()
      img.src = bg.url
      ctx.fillStyle = '#1a140c'
      ctx.fillRect(0, 0, w, h)
      const draw = () => {
        const s = Math.max(w / img.width, h / img.height)
        const dw = img.width * s
        const dh = img.height * s
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      }
      if (img.complete) draw()
      else img.onload = draw
    } else if (bg.draw) {
      bg.draw(ctx, w, h)
    }
  }
  return c
}

export function loadDemoImage(id: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const bg = DEMO_BGS.find((b) => b.id === id) ?? DEMO_BGS[0]
    if (bg.kind === 'proc' && bg.draw) {
      const c = renderDemo(id, 1280, 720)
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = c.toDataURL()
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = bg.url ?? ''
  })
}
