import { useI18n } from '../i18n'
import type { Dict } from '../i18n/dicts'
import type { AlgorithmId, PaletteId, Settings, StyleId, ChromaId, FxChannel } from '../engine/types'
import { PALETTES, loadCustomRamp, saveCustomRamp } from '../engine/palettes'
import { DEMO_BGS } from '../engine/demo'
import { Section, Chip, Slider, Select, Toggle, ColorInput, FxRow } from './controls'

const STYLE_KEYS: Record<StyleId, keyof Dict> = {
  characters: 'stCharacters',
  dither: 'stDither',
  block: 'stBlock',
  dots: 'stDots',
  mixed: 'stMixed',
  pixelart: 'stPixelArt',
  mosaic: 'stMosaic',
  lego: 'stLego',
  cross: 'stCross',
  diamond: 'stDiamond',
  lines: 'stLines',
  diagonal: 'stDiagonal',
  braille: 'stBraille',
  voxel: 'stVoxel',
  disco: 'stDisco',
  hexagon: 'stHexagon',
  triangle: 'stTriangle',
  star: 'stStar',
  spiral: 'stSpiral',
  waves: 'stWaves',
  heart: 'stHeart',
}

const ALGO_LABELS: Record<AlgorithmId, string> = {
  bayer2: 'Bayer 2×2',
  bayer4: 'Bayer 4×4',
  bayer8: 'Bayer 8×8',
  bayer16: 'Bayer 16×16',
  halftone: 'Halftone',
  radial: 'Radial',
  hlines: 'Horizontal Lines',
  vlines: 'Vertical Lines',
  dlines: 'Diagonal Lines',
  whitenoise: 'White Noise',
  bluenoise: 'Blue Noise',
  voidcluster: 'Void-Cluster (true blue)',
  riemersma: 'Riemersma (Hilbert)',
  floyd: 'Floyd–Steinberg',
  atkinson: 'Atkinson',
  stucki: 'Stucki',
  sierra: 'Sierra Lite',
}

const CHROMA_KEYS: Record<ChromaId, keyof Dict> = {
  standard: 'chromaStandard',
  luminance: 'chromaLum',
  perchannel: 'chromaPer',
  binary: 'chromaBinary',
}

const FILTER_KEYS: Record<string, keyof Dict> = {
  none: 'fNone',
  bw: 'fBw',
  sepia: 'fSepia',
  warm: 'fWarm',
  cool: 'fCool',
  vintage: 'fVintage',
  fade: 'fFade',
  cyber: 'fCyber',
}

const BLUR_KEYS: Record<string, keyof Dict> = {
  off: 'blurOff',
  gaussian: 'blurGaussian',
  lens: 'blurLens',
  tiltshift: 'blurTilt',
  directional: 'blurDir',
  radial: 'blurRadial',
  progressive: 'blurProg',
}

const FX_ROWS: { id: keyof Settings['fx']; key: keyof Dict }[] = [
  { id: 'vignette', key: 'fxVignette' },
  { id: 'scanlines', key: 'fxScan' },
  { id: 'crt', key: 'fxCrt' },
  { id: 'chromatic', key: 'fxChromatic' },
  { id: 'bloom', key: 'fxBloom' },
  { id: 'grain', key: 'fxGrain' },
  { id: 'glitch', key: 'fxGlitch' },
  { id: 'rgbsplit', key: 'fxRgb' },
  { id: 'pixelate', key: 'fxPixelate' },
  { id: 'dust', key: 'fxDust' },
]

export function Sidebar({
  settings,
  set,
  open,
  toggle,
  onPickBg,
  activeBg,
}: {
  settings: Settings
  set: (patch: Partial<Settings>) => void
  open: Record<string, boolean>
  toggle: (k: string) => void
  onPickBg: (id: string) => void
  activeBg: string
}) {
  const { t, lang } = useI18n()
  const palette = PALETTES.find((p) => p.id === settings.palette)
  const effRamp =
    settings.palette === 'custom'
      ? settings.customRamp
      : palette && palette.ramp.length
        ? palette.ramp
        : []

  const setCustomColor = (idx: number, color: string) => {
    const ramp = [...settings.customRamp]
    ramp[idx] = color
    set({ customRamp: ramp })
    saveCustomRamp(ramp)
  }

  return (
    <aside className="h-full w-[340px] shrink-0 overflow-y-auto border-s border-white/10 bg-[#0a0a0d]">
      <Section title={t('background')} open={open.bg} onToggle={() => toggle('bg')}>
        <div className="grid grid-cols-4 gap-1.5">
          {DEMO_BGS.map((bg) => (
            <button
              key={bg.id}
              title={lang === 'ar' ? bg.labelAr : bg.label}
              onClick={() => onPickBg(bg.id)}
              className={`aspect-square overflow-hidden border ${
                activeBg === bg.id ? 'border-white' : 'border-white/10 hover:border-white/40'
              }`}
            >
              <BgThumb id={bg.id} />
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-white/30">{t('bgNote')}</p>
      </Section>

      <Section title={t('style')} open={open.style} onToggle={() => toggle('style')}>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STYLE_KEYS) as StyleId[]).map((s) => (
            <Chip
              key={s}
              label={t(STYLE_KEYS[s])}
              active={settings.style === s}
              onClick={() => set({ style: s })}
            />
          ))}
        </div>
      </Section>

      <Section title={t('engine')} open={open.engine} onToggle={() => toggle('engine')}>
        <Select
          label={t('algorithm')}
          value={settings.algorithm}
          options={(Object.keys(ALGO_LABELS) as AlgorithmId[]).map((a) => ({
            value: a,
            label: ALGO_LABELS[a],
          }))}
          onChange={(v) => set({ algorithm: v as AlgorithmId })}
        />
        <Select
          label={t('palette')}
          value={settings.palette}
          options={PALETTES.map((p) => ({ value: p.id, label: lang === 'ar' ? p.labelAr : p.label }))}
          onChange={(v) => set({ palette: v as PaletteId })}
        />
        {effRamp.length > 0 && (
          <div className="mb-4 flex gap-1">
            {effRamp.map((c, i) => (
              <span
                key={i}
                className="h-4 w-4 border border-white/20"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
        {settings.palette === 'custom' && (
          <div className="mb-4 border border-white/10 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {settings.customRamp.map((c, i) => (
                <input
                  key={i}
                  type="color"
                  value={c}
                  onChange={(e) => setCustomColor(i, e.target.value)}
                  className="h-7 w-7 cursor-pointer border border-white/25 bg-transparent p-0"
                />
              ))}
            </div>
            <div className="flex gap-2">
              {settings.customRamp.length < 10 && (
                <button
                  onClick={() => {
                    const ramp = [...settings.customRamp, '#888888']
                    set({ customRamp: ramp })
                    saveCustomRamp(ramp)
                  }}
                  className="border border-white/25 px-2 py-1 text-[10px] text-white/70 hover:border-white/60"
                >
                  + {t('addColor')}
                </button>
              )}
              {settings.customRamp.length > 2 && (
                <button
                  onClick={() => {
                    const ramp = settings.customRamp.slice(0, -1)
                    set({ customRamp: ramp })
                    saveCustomRamp(ramp)
                  }}
                  className="border border-white/25 px-2 py-1 text-[10px] text-white/70 hover:border-white/60"
                >
                  −
                </button>
              )}
            </div>
          </div>
        )}
        <Select
          label={t('chroma')}
          value={settings.chroma}
          options={(Object.keys(CHROMA_KEYS) as ChromaId[]).map((c) => ({
            value: c,
            label: t(CHROMA_KEYS[c]),
          }))}
          onChange={(v) => set({ chroma: v as ChromaId })}
        />
        <Slider label={t('pixelSize')} value={settings.pixelSize} min={1} max={6} onChange={(v) => set({ pixelSize: v })} />
        <Slider label={t('strength')} value={settings.strength} min={0} max={100} onChange={(v) => set({ strength: v })} />
        <Slider label={t('contrast')} value={settings.contrast} min={50} max={200} onChange={(v) => set({ contrast: v })} />
        <Slider label={t('threshold')} value={settings.threshold} min={0} max={100} onChange={(v) => set({ threshold: v })} />
        <Slider label={t('cellSize')} value={settings.cellSize} min={4} max={24} onChange={(v) => set({ cellSize: v })} />
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="grow">
            <Slider label={t('seed')} value={settings.seed} min={1} max={9999} onChange={(v) => set({ seed: v })} />
          </div>
          <button
            onClick={() => set({ seed: Math.floor(Math.random() * 9999) + 1 })}
            title={t('reroll')}
            className="mb-4 border border-white/25 px-2.5 py-1.5 text-[11px] text-white/80 hover:border-white/60"
          >
            🎲
          </button>
        </div>
        <Toggle
          label="Serpentine scanning"
          checked={settings.serpentine}
          onChange={(v) => set({ serpentine: v })}
        />
      </Section>

      <Section title={t('mask')} open={open.mask} onToggle={() => toggle('mask')}>
        <Toggle label={t('enableMask')} checked={settings.mask.enabled} onChange={(v) => set({ mask: { ...settings.mask, enabled: v } })} />
        {settings.mask.enabled && (
          <>
            <Slider label={t('shadows')} value={settings.mask.shadows} min={0} max={60} onChange={(v) => set({ mask: { ...settings.mask, shadows: v } })} />
            <Slider label={t('highlights')} value={settings.mask.highlights} min={0} max={60} onChange={(v) => set({ mask: { ...settings.mask, highlights: v } })} />
          </>
        )}
      </Section>

      <Section title={t('color')} badge={t('newBadge')} open={open.color} onToggle={() => toggle('color')}>
        <Select
          label={t('filter')}
          value={settings.color.filter}
          options={Object.keys(FILTER_KEYS).map((f) => ({ value: f, label: t(FILTER_KEYS[f]) }))}
          onChange={(v) => set({ color: { ...settings.color, filter: v as Settings['color']['filter'] } })}
        />
        <ColorInput
          label={t('tint')}
          value={settings.color.tint}
          onChange={(v) => set({ color: { ...settings.color, tint: v } })}
        />
        <Slider label={t('tintOpacity')} value={settings.color.tintOpacity} min={0} max={100} suffix="%" onChange={(v) => set({ color: { ...settings.color, tintOpacity: v } })} />
        <Select
          label={t('blend')}
          value={settings.color.blend}
          options={['multiply', 'overlay', 'screen', 'color', 'hue', 'saturation', 'luminosity', 'soft-light', 'hard-light', 'color-burn', 'color-dodge'].map((b) => ({ value: b, label: b }))}
          onChange={(v) => set({ color: { ...settings.color, blend: v as Settings['color']['blend'] } })}
        />
        <Slider label={t('saturation')} value={settings.color.saturation} min={0} max={200} suffix="%" onChange={(v) => set({ color: { ...settings.color, saturation: v } })} />
        <Slider label={t('grayscale')} value={settings.color.grayscale} min={0} max={100} suffix="%" onChange={(v) => set({ color: { ...settings.color, grayscale: v } })} />
      </Section>

      <Section title={t('blur')} badge={t('newBadge')} open={open.blur} onToggle={() => toggle('blur')}>
        <Select
          label={t('blurType')}
          value={settings.blur.type}
          options={Object.keys(BLUR_KEYS).map((b) => ({ value: b, label: t(BLUR_KEYS[b]) }))}
          onChange={(v) => set({ blur: { ...settings.blur, type: v as Settings['blur']['type'] } })}
        />
        {settings.blur.type !== 'off' && (
          <Slider label={t('amount')} value={settings.blur.amount} min={0} max={100} onChange={(v) => set({ blur: { ...settings.blur, amount: v } })} />
        )}
      </Section>

      <Section title={t('postfx')} badge={t('newBadge')} open={open.fx} onToggle={() => toggle('fx')}>
        {FX_ROWS.map((row) => (
          <FxRow
            key={row.id}
            label={t(row.key)}
            channel={settings.fx[row.id] as FxChannel}
            onChange={(c) => set({ fx: { ...settings.fx, [row.id]: c } })}
          />
        ))}
      </Section>
    </aside>
  )
}

function BgThumb({ id }: { id: string }) {
  const bg = DEMO_BGS.find((b) => b.id === id)
  if (bg && bg.kind === 'img' && bg.url) {
    return <img src={bg.url} alt={id} className="h-full w-full object-cover" loading="lazy" />
  }
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const ctx = c.getContext('2d')
  if (bg && ctx && bg.draw) bg.draw(ctx, 64, 64)
  return <img src={c.toDataURL()} alt={id} className="h-full w-full object-cover" />
}

void loadCustomRamp
