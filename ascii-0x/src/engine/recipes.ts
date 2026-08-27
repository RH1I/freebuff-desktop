import type { Settings } from './types'
import { DEFAULT_SETTINGS } from './types'

const SAVED_KEY = 'ascii0x.myRecipes'

export interface Recipe {
  id: string
  name: string
  nameAr: string
  settings: Partial<Settings>
}

export const BUILTIN_RECIPES: Recipe[] = [
  {
    id: 'matrix',
    name: 'Matrix',
    nameAr: 'الماتريكس',
    settings: {
      style: 'characters',
      algorithm: 'bayer4',
      palette: 'mono',
      chroma: 'luminance',
      cellSize: 8,
      color: { ...DEFAULT_SETTINGS.color, filter: 'cyber', tint: '#00ff41', tintOpacity: 55, blend: 'color' },
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    nameAr: 'نوار',
    settings: {
      style: 'dither',
      algorithm: 'floyd',
      palette: 'mono',
      chroma: 'luminance',
      contrast: 130,
      color: { ...DEFAULT_SETTINGS.color, filter: 'bw' },
    },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    nameAr: 'فيبورويف',
    settings: {
      style: 'pixelart',
      palette: 'pastel',
      cellSize: 8,
      color: { ...DEFAULT_SETTINGS.color, filter: 'cool', tint: '#ff71ce', tintOpacity: 35, blend: 'soft-light' },
    },
  },
  {
    id: 'goldenhour',
    name: 'Golden Hour',
    nameAr: 'الساعة الذهبية',
    settings: {
      style: 'dither',
      algorithm: 'halftone',
      palette: 'vintage',
      chroma: 'standard',
      cellSize: 6,
      contrast: 115,
      fx: {
        ...DEFAULT_SETTINGS.fx,
        vignette: { on: true, intensity: 38 },
        grain: { on: true, intensity: 22 },
        dust: { on: true, intensity: 20 },
        bloom: { on: true, intensity: 30 },
      },
    },
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    nameAr: 'جيم بوي',
    settings: { style: 'pixelart', palette: 'gameboy', chroma: 'luminance', cellSize: 8, contrast: 125 },
  },
  {
    id: 'riso',
    name: 'Risograph',
    nameAr: 'ريزوغراف',
    settings: {
      style: 'dither',
      algorithm: 'atkinson',
      palette: 'risograph',
      cellSize: 5,
      strength: 90,
    },
  },
  {
    id: 'cyberdream',
    name: 'Cyberdream',
    nameAr: 'حلم سايبر',
    settings: {
      style: 'characters',
      palette: 'cyberpunk',
      cellSize: 7,
      fx: { ...DEFAULT_SETTINGS.fx, scanlines: { on: true, intensity: 35 }, chromatic: { on: true, intensity: 30 } },
    },
  },
  {
    id: 'brailleart',
    name: 'Braille',
    nameAr: 'برايل',
    settings: { style: 'braille', algorithm: 'bayer8', palette: 'grey2', cellSize: 12 },
  },
]

export function encodeRecipe(s: Settings): string {
  const json = JSON.stringify(s)
  return `ascii0x:v1:${btoa(unescape(encodeURIComponent(json)))}`
}

export function decodeRecipe(code: string): Partial<Settings> | null {
  try {
    const body = code.startsWith('ascii0x:v1:') ? code.slice('ascii0x:v1:'.length) : code
    const json = decodeURIComponent(escape(atob(body.trim())))
    const obj = JSON.parse(json) as Partial<Settings>
    if (typeof obj === 'object' && obj !== null) return obj
    return null
  } catch {
    return null
  }
}

export function recipeUrl(s: Settings): string {
  const url = new URL(window.location.href)
  url.search = `?r=${encodeURIComponent(encodeRecipe(s).split(':')[2])}`
  url.hash = ''
  return url.toString()
}

export function recipeFromUrl(): Partial<Settings> | null {
  const r = new URL(window.location.href).searchParams.get('r')
  if (!r) return null
  return decodeRecipe(r)
}

export function loadMyRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (raw) return JSON.parse(raw) as Recipe[]
  } catch {
    /* ignore */
  }
  return []
}

export function persistMyRecipes(list: Recipe[]): void {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list))
}
