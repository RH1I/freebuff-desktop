export type StyleId =
  | 'characters'
  | 'dither'
  | 'block'
  | 'dots'
  | 'mixed'
  | 'pixelart'
  | 'mosaic'
  | 'lego'
  | 'cross'
  | 'diamond'
  | 'lines'
  | 'diagonal'
  | 'braille'
  | 'voxel'
  | 'disco'
  | 'hexagon'
  | 'triangle'
  | 'star'
  | 'spiral'
  | 'waves'
  | 'heart'

export type AlgorithmId =
  | 'bayer2'
  | 'bayer4'
  | 'bayer8'
  | 'bayer16'
  | 'halftone'
  | 'radial'
  | 'hlines'
  | 'vlines'
  | 'dlines'
  | 'whitenoise'
  | 'bluenoise'
  | 'voidcluster'
  | 'riemersma'
  | 'floyd'
  | 'atkinson'
  | 'stucki'
  | 'sierra'

export type ChromaId = 'standard' | 'luminance' | 'perchannel' | 'binary'

export type PaletteId =
  | 'mono'
  | 'grey2'
  | 'grey3'
  | 'gameboy'
  | 'cga0'
  | 'cga1'
  | 'pico8'
  | 'c64'
  | 'nes'
  | 'rgb3'
  | 'cyberpunk'
  | 'pastel'
  | 'risograph'
  | 'sepia'
  | 'vintage'
  | 'earth'
  | 'original'
  | 'custom'

export type ColorFilter =
  | 'none'
  | 'bw'
  | 'sepia'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'fade'
  | 'cyber'

export type BlendMode =
  | 'multiply'
  | 'overlay'
  | 'screen'
  | 'color'
  | 'hue'
  | 'saturation'
  | 'luminosity'
  | 'soft-light'
  | 'hard-light'
  | 'color-burn'
  | 'color-dodge'

export interface ColorSettings {
  filter: ColorFilter
  tint: string
  tintOpacity: number
  blend: BlendMode
  saturation: number
  grayscale: number
}

export type BlurType = 'off' | 'gaussian' | 'lens' | 'tiltshift' | 'directional' | 'radial' | 'progressive'

export interface BlurSettings {
  type: BlurType
  amount: number
}

export interface FxChannel {
  on: boolean
  intensity: number
}

export interface FxSettings {
  vignette: FxChannel
  scanlines: FxChannel
  crt: FxChannel
  chromatic: FxChannel
  bloom: FxChannel
  grain: FxChannel
  glitch: FxChannel
  rgbsplit: FxChannel
  pixelate: FxChannel
  dust: FxChannel
}

export interface MaskSettings {
  enabled: boolean
  shadows: number
  highlights: number
}

export interface CropSettings {
  aspect: string
  rotation: 0 | 90 | 180 | 270
  zoom: number
  offsetX: number
  offsetY: number
}

export interface Settings {
  style: StyleId
  algorithm: AlgorithmId
  palette: PaletteId
  chroma: ChromaId
  pixelSize: number
  strength: number
  contrast: number
  threshold: number
  cellSize: number
  serpentine: boolean
  seed: number
  customRamp: string[]
  color: ColorSettings
  blur: BlurSettings
  fx: FxSettings
  mask: MaskSettings
  crop: CropSettings
}

export const DEFAULT_SETTINGS: Settings = {
  style: 'dither',
  algorithm: 'halftone',
  palette: 'vintage',
  chroma: 'standard',
  pixelSize: 2,
  strength: 100,
  contrast: 110,
  threshold: 50,
  cellSize: 6,
  serpentine: true,
  seed: 1337,
  customRamp: ['#1a120b', '#4a3520', '#8a6a3a', '#c9a45c', '#eed9a4'],
  color: {
    filter: 'none',
    tint: '#d4af6a',
    tintOpacity: 20,
    blend: 'soft-light',
    saturation: 100,
    grayscale: 0,
  },
  blur: { type: 'off', amount: 4 },
  fx: {
    vignette: { on: true, intensity: 30 },
    scanlines: { on: false, intensity: 30 },
    crt: { on: false, intensity: 30 },
    chromatic: { on: false, intensity: 30 },
    bloom: { on: false, intensity: 40 },
    grain: { on: true, intensity: 18 },
    glitch: { on: false, intensity: 30 },
    rgbsplit: { on: false, intensity: 25 },
    pixelate: { on: false, intensity: 20 },
    dust: { on: true, intensity: 15 },
  },
  mask: { enabled: false, shadows: 20, highlights: 20 },
  crop: { aspect: 'free', rotation: 0, zoom: 100, offsetX: 0, offsetY: 0 },
}

export const STYLE_IDS: StyleId[] = [
  'characters', 'dither', 'block', 'dots', 'mixed', 'pixelart', 'mosaic',
  'lego', 'cross', 'diamond', 'lines', 'diagonal', 'braille', 'voxel', 'disco',
  'hexagon', 'triangle', 'star', 'spiral', 'waves', 'heart',
]

export const ALGORITHM_IDS: AlgorithmId[] = [
  'bayer2', 'bayer4', 'bayer8', 'bayer16', 'halftone', 'radial', 'hlines',
  'vlines', 'dlines', 'whitenoise', 'bluenoise', 'voidcluster', 'riemersma',
  'floyd', 'atkinson', 'stucki', 'sierra',
]

export const PALETTE_IDS: PaletteId[] = [
  'mono', 'grey2', 'grey3', 'gameboy', 'cga0', 'cga1', 'pico8', 'c64', 'nes',
  'rgb3', 'cyberpunk', 'pastel', 'risograph', 'sepia', 'vintage', 'earth',
  'original', 'custom',
]

export const ASPECTS: { id: string; label: string; w: number; h: number }[] = [
  { id: 'free', label: '—', w: 0, h: 0 },
  { id: '1:1', label: '1:1', w: 1, h: 1 },
  { id: '4:5', label: '4:5', w: 4, h: 5 },
  { id: '3:4', label: '3:4', w: 3, h: 4 },
  { id: '9:16', label: '9:16', w: 9, h: 16 },
  { id: '16:9', label: '16:9', w: 16, h: 9 },
  { id: '4:3', label: '4:3', w: 4, h: 3 },
  { id: '3:2', label: '3:2', w: 3, h: 2 },
]
