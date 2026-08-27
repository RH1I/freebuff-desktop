import { useCallback, useEffect, useRef, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { useHistory } from './hooks/useHistory'
import { useHotkeys } from './hooks/useHotkeys'
import { DEFAULT_SETTINGS, PALETTE_IDS, STYLE_IDS, ALGORITHM_IDS } from './engine/types'
import type { Settings } from './engine/types'
import { render, computeCells, type Source } from './engine/render'
import { loadDemoImage } from './engine/demo'
import { paletteById } from './engine/palettes'
import {
  VideoManager,
} from './engine/video'
import {
  BUILTIN_RECIPES,
  encodeRecipe,
  loadMyRecipes,
  persistMyRecipes,
  recipeFromUrl,
  type Recipe,
} from './engine/recipes'
import { cellsColors, copyToClipboard, exportImage, exportSvg, exportTxt } from './engine/exporter'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { Viewport } from './components/Viewport'
import { ExportDialog } from './components/ExportDialog'
import { RecipesPanel } from './components/RecipesPanel'
import { CropOverlay } from './components/CropOverlay'
import { WhatsNew } from './components/WhatsNew'

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const BG_IDS = ['sky', 'carnivalArt', 'horizon', 'sunsea', 'dunes', 'carnival', 'clouds', 'ember', 'gold', 'teal', 'magenta', 'toxic', 'bubbles', 'sunset']

function AppInner() {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state: settings, set, replace, undo, redo } = useHistory<Settings>(DEFAULT_SETTINGS)
  const [source, setSource] = useState<Source | null>(null)
  const [activeBg, setActiveBg] = useState('sky')
  const [open, setOpen] = useState<Record<string, boolean>>({
    bg: true, style: true, engine: true, mask: false, color: false, blur: false, fx: false,
  })
  const [dialog, setDialog] = useState<'none' | 'export' | 'recipes' | 'crop' | 'whatsnew'>('none')
  const [myRecipes, setMyRecipes] = useState<Recipe[]>(() => loadMyRecipes())
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const videoRef = useRef<VideoManager | null>(null)
  if (!videoRef.current) videoRef.current = new VideoManager()
  const video = videoRef.current
  const [, forceTick] = useState(0)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const doRender = useCallback(
    (preview = false) => {
      if (!canvasRef.current || !source) return
      const cells = render(canvasRef.current, source, settingsRef.current, { preview })
      if (cells && (cells.W !== dims.w || cells.H !== dims.h)) setDims({ w: cells.W, h: cells.H })
    },
    [source, dims.w, dims.h],
  )

  useEffect(() => {
    doRender(false)
  }, [settings, source, doRender])

  useEffect(() => {
    if (!source || !(source instanceof HTMLVideoElement)) return
    let raf = 0
    const loop = () => {
      doRender(true)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [source, doRender])

  useEffect(() => {
    const recipe = recipeFromUrl()
    if (recipe) replace({ ...DEFAULT_SETTINGS, ...recipe })
    void loadDemoImage('sky').then((img) => {
      setSource((s) => s ?? img)
      setActiveBg('sky')
    })
    if (!localStorage.getItem('ascii0x.seen2')) setDialog('whatsnew')
  }, [replace])

  const loadFile = useCallback(async (f: File) => {
    if (f.type.startsWith('video/')) {
      const v = await video.loadFile(f)
      setSource(v)
      setActiveBg('')
      return
    }
    if (!f.type.startsWith('image/')) return
    video.stopVideo()
    const bmp = await createImageBitmap(f)
    setSource(bmp)
    setActiveBg('')
  }, [video])

  const pickBg = useCallback(
    (id: string) => {
      void loadDemoImage(id).then((img) => {
        setSource(img)
        setActiveBg(id)
      })
    },
    [],
  )

  const inspire = useCallback(() => {
    set({
      style: pick(STYLE_IDS),
      algorithm: pick(ALGORITHM_IDS),
      palette: pick(PALETTE_IDS),
      cellSize: 4 + Math.floor(Math.random() * 12),
      contrast: 80 + Math.floor(Math.random() * 60),
      seed: Math.floor(Math.random() * 9999) + 1,
    })
    pickBg(pick(BG_IDS))
  }, [set, pickBg])

  const restyle = useCallback(() => {
    set({ style: pick(STYLE_IDS), palette: pick(PALETTE_IDS) })
  }, [set])

  const toggleCamera = useCallback(async () => {
    if (video.state().isCamera) {
      video.stopCamera()
      video.stopVideo()
      setSource(null)
      forceTick((n) => n + 1)
      pickBg('sky')
      return
    }
    try {
      const v = await video.startCamera()
      setSource(v)
      setActiveBg('')
    } catch {
      /* camera denied */
    }
  }, [video, pickBg])

  const toggleWebm = useCallback(() => {
    if (recording) {
      void video.stopRecording().then(() => setRecording(false))
    } else if (canvasRef.current) {
      video.startRecording(canvasRef.current, 30)
      setRecording(true)
    }
  }, [recording, video])

  const recordGif = useCallback(() => {
    void video.recordGif(() => canvasRef.current, 10, 12)
  }, [video])

  const applyRecipe = useCallback(
    (r: Recipe) => {
      replace({ ...DEFAULT_SETTINGS, ...r.settings })
      setDialog('none')
    },
    [replace],
  )

  const saveCurrent = useCallback(() => {
    const list = [
      ...myRecipes,
      { id: `r${Date.now()}`, name: `Recipe ${myRecipes.length + 1}`, nameAr: `وصفة ${myRecipes.length + 1}`, settings: settingsRef.current },
    ]
    setMyRecipes(list)
    persistMyRecipes(list)
  }, [myRecipes])

  const deleteRecipe = useCallback(
    (id: string) => {
      const list = myRecipes.filter((r) => r.id !== id)
      setMyRecipes(list)
      persistMyRecipes(list)
    },
    [myRecipes],
  )

  const handleExportImage = useCallback(
    (f: 'png' | 'jpg' | 'webp', scale: number, transparent: boolean) => {
      if (!source) return
      setBusy('…')
      setTimeout(() => {
        void exportImage(source, settingsRef.current, f, scale, transparent)
        setBusy(null)
      }, 30)
    },
    [source],
  )

  const handleExportTxt = useCallback(() => {
    if (!source) return
    const cells = computeCells(source, settingsRef.current, 1)
    if (cells) exportTxt(cells)
  }, [source])

  const handleExportSvg = useCallback(() => {
    if (!source) return
    const cells = computeCells(source, settingsRef.current, 1)
    if (!cells) return
    const pal = paletteById(settingsRef.current.palette)
    const ramp =
      settingsRef.current.palette === 'custom' ? settingsRef.current.customRamp : pal.ramp.length >= 2 ? pal.ramp : ['#000000', '#ffffff']
    const colors = cellsColors(cells, ramp, settingsRef.current.palette === 'original', settingsRef.current.chroma)
    exportSvg(cells, settingsRef.current, colors)
  }, [source])

  const handleCopy = useCallback(async () => {
    if (!source) return
    await copyToClipboard(source, settingsRef.current)
  }, [source])

  useHotkeys(
    [
      { key: 'i', handler: inspire },
      { key: 'r', handler: restyle },
      { key: 'e', handler: () => setDialog('export') },
      { key: 'c', handler: () => setDialog('crop') },
      { key: 'z', ctrl: true, handler: undo },
      { key: 'z', ctrl: true, shift: true, handler: redo },
      { key: ' ', handler: () => video.toggle() },
    ],
    dialog === 'none',
  )

  const cameraActive = video.state().isCamera

  return (
    <div
      className="flex h-full flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f) void loadFile(f)
      }}
    >
      <TopBar
        onUploadFile={(f) => void loadFile(f)}
        onCrop={() => setDialog('crop')}
        onRecipes={() => setDialog('recipes')}
        onExport={() => setDialog('export')}
        onWhatsNew={() => setDialog('whatsnew')}
        onReset={() => replace(DEFAULT_SETTINGS)}
      />
      <div className="flex min-h-0 flex-1">
        <Viewport
          canvasRef={canvasRef}
          hasSource={!!source}
          video={source instanceof HTMLVideoElement ? video : null}
          onInspire={inspire}
          onRestyle={restyle}
          onDropFile={(f) => void loadFile(f)}
          onGif={recordGif}
          onWebm={toggleWebm}
          recording={recording}
          onCamera={() => void toggleCamera()}
          cameraActive={cameraActive}
        />
        <Sidebar
          settings={settings}
          set={set}
          open={open}
          toggle={(k) => setOpen((o) => ({ ...o, [k]: !o[k] }))}
          onPickBg={pickBg}
          activeBg={activeBg}
        />
      </div>

      {dialog === 'export' && (
        <ExportDialog
          onClose={() => setDialog('none')}
          onExportImage={handleExportImage}
          onExportTxt={handleExportTxt}
          onExportSvg={handleExportSvg}
          onCopy={handleCopy}
          dims={dims}
          busy={busy ? t('exportBtn') + '…' : null}
        />
      )}
      {dialog === 'recipes' && (
        <RecipesPanel
          myRecipes={myRecipes}
          onClose={() => setDialog('none')}
          onApply={applyRecipe}
          onSaveCurrent={saveCurrent}
          onDelete={deleteRecipe}
          shareCode={encodeRecipe(settings)}
        />
      )}
      {dialog === 'crop' && (
        <CropOverlay
          crop={settings.crop}
          onChange={(c) => set({ crop: c })}
          onClose={() => setDialog('none')}
          onSave={() => setDialog('none')}
        />
      )}
      {dialog === 'whatsnew' && (
        <WhatsNew
          onClose={() => {
            localStorage.setItem('ascii0x.seen2', '1')
            setDialog('none')
          }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  )
}

void BUILTIN_RECIPES
