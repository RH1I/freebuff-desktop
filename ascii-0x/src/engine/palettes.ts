import type { PaletteId } from './types'

export interface Palette {
  id: PaletteId
  label: string
  labelAr: string
  ramp: string[]
}

export const PALETTES: Palette[] = [
  { id: 'mono', label: 'Mono 1-bit', labelAr: 'أحادي 1-بت', ramp: ['#040406', '#f2f2f2'] },
  {
    id: 'grey2',
    label: 'Grey 2-bit',
    labelAr: 'رمادي 2-بت',
    ramp: ['#040406', '#5a5a5a', '#a8a8a8', '#f2f2f2'],
  },
  {
    id: 'grey3',
    label: 'Grey 3-bit',
    labelAr: 'رمادي 3-بت',
    ramp: ['#040406', '#3c3c3c', '#6e6e6e', '#9c9c9c', '#c9c9c9', '#f2f2f2'],
  },
  { id: 'gameboy', label: 'Game Boy', labelAr: 'جيم بوي', ramp: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  { id: 'cga0', label: 'CGA 0', labelAr: 'CGA 0', ramp: ['#000000', '#55ffff', '#ff5555', '#ffffff'] },
  { id: 'cga1', label: 'CGA 1', labelAr: 'CGA 1', ramp: ['#000000', '#00aa00', '#ff55ff', '#ffff55'] },
  {
    id: 'pico8',
    label: 'Pico-8',
    labelAr: 'بيكو-8',
    ramp: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'],
  },
  {
    id: 'c64',
    label: 'C64',
    labelAr: 'C64',
    ramp: ['#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77', '#dd8855', '#664400', '#ff7777', '#333333', '#777777', '#aaff66', '#0088ff', '#bbbbbb'],
  },
  {
    id: 'nes',
    label: 'NES',
    labelAr: 'نيس',
    ramp: ['#040406', '#fcfcfc', '#f8f8f8', '#bcbcbc', '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8', '#b8b8f8', '#6888fc', '#d8b8f8', '#9878f8', '#f8b8f8', '#f878f8', '#f8a4c0', '#f85898'],
  },
  { id: 'rgb3', label: '3-bit RGB', labelAr: 'RGB ثلاثي', ramp: ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'] },
  { id: 'cyberpunk', label: 'Cyberpunk', labelAr: 'سايبربانك', ramp: ['#040406', '#16103a', '#2a1a5e', '#7a1f6e', '#c62e6b', '#ff4f79', '#ff8a5c', '#ffd166', '#3affd5', '#00e5ff'] },
  { id: 'pastel', label: 'Pastel', labelAr: 'باستيل', ramp: ['#2b2233', '#54426b', '#8a6fa8', '#c39bd3', '#f5c6d6', '#fdf1d6'] },
  { id: 'risograph', label: 'Risograph', labelAr: 'ريزوغراف', ramp: ['#1a1a1a', '#ff5c39', '#ffd23f', '#2ec4b6', '#3a86ff', '#f6f5f0'] },
  { id: 'sepia', label: 'Sepia', labelAr: 'سيبيا', ramp: ['#140d06', '#3c2a14', '#6e4f24', '#a67c3d', '#d4af6a', '#eed9a4', '#f7ecc8'] },
  { id: 'vintage', label: 'Vintage Print', labelAr: 'مطبوع فينتج', ramp: ['#161009', '#3a2d1c', '#6b5535', '#9c7f4e', '#c4a468', '#e2c88f', '#f3e6c4', '#faf3e0'] },
  { id: 'earth', label: 'Earth', labelAr: 'ترابي', ramp: ['#1c1410', '#403024', '#6b5138', '#96754f', '#bfa06a', '#d9c491', '#efe3c0'] },
  { id: 'original', label: 'Original colours', labelAr: 'الألوان الأصلية', ramp: [] },
  { id: 'custom', label: 'Custom', labelAr: 'مخصصة', ramp: [] },
]

const CUSTOM_KEY = 'ascii0x.customPalette'

export function loadCustomRamp(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr) && arr.length >= 2) return arr as string[]
    }
  } catch {
    /* ignore */
  }
  return ['#161009', '#4a3520', '#9c7f4e', '#e2c88f', '#faf3e0']
}

export function saveCustomRamp(ramp: string[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(ramp))
}

export function paletteById(id: PaletteId): Palette {
  const p = PALETTES.find((x) => x.id === id)
  return p ?? PALETTES[0]
}

export function paletteLabel(id: PaletteId): string {
  const p = paletteById(id)
  const lang = document.documentElement.lang
  return lang === 'ar' ? p.labelAr : p.label
}

export function rgbOf(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}
