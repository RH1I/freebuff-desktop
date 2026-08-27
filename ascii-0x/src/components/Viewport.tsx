import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { VideoManager } from '../engine/video'

export function Viewport({
  canvasRef,
  hasSource,
  video,
  onInspire,
  onRestyle,
  onDropFile,
  onGif,
  onWebm,
  recording,
  onCamera,
  cameraActive,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  hasSource: boolean
  video: VideoManager | null
  onInspire: () => void
  onRestyle: () => void
  onDropFile: (f: File) => void
  onGif: () => void
  onWebm: () => void
  recording: boolean
  onCamera: () => void
  cameraActive: boolean
}) {
  const { t } = useI18n()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [compare, setCompare] = useState(false)
  const [tick, setTick] = useState(0)
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => {
    if (!video) return
    const id = setInterval(() => setTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [video])

  const vs = video?.state()

  return (
    <main
      ref={wrapRef}
      className="relative grid min-w-0 flex-1 place-items-center overflow-hidden p-8"
      onWheel={(e) => {
        e.preventDefault()
        setZoom((z) => Math.min(5, Math.max(0.2, z * (e.deltaY < 0 ? 1.1 : 0.9))))
      }}
      onPointerDown={(e) => {
        dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      }}
      onPointerMove={(e) => {
        const d = dragRef.current
        if (d) setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) })
      }}
      onPointerUp={() => (dragRef.current = null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f) onDropFile(f)
      }}
    >
      <div
        className="relative"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {hasSource ? (
          <canvas
            ref={canvasRef}
            className="max-h-[70vh] max-w-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          />
        ) : (
          <div className="p-24 text-center text-white/40">
            <p className="mb-2 text-4xl">✳</p>
            <p className="text-sm">{t('dropImage')}</p>
          </div>
        )}
        {compare && hasSource && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#040406]/90">
            <span className="text-xs text-white/50">{t('compare')} — original</span>
          </div>
        )}
      </div>

      {vs && (
        <div className="absolute bottom-16 left-1/2 flex w-[min(90%,520px)] -translate-x-1/2 items-center gap-2 border border-white/15 bg-black/70 px-3 py-2 backdrop-blur">
          <button
            className="border border-white/25 px-2 py-1 text-[11px] text-white/85 hover:border-white/70"
            onClick={() => {
              video?.toggle()
              setTick((n) => n + 1)
            }}
          >
            {vs.playing ? `⏸ ${t('pause')}` : `▶ ${t('play')}`}
          </button>
          {!vs.isCamera ? (
            <input
              type="range"
              min={0}
              max={Math.max(0.1, vs.duration)}
              step={0.05}
              value={vs.time}
              onChange={(e) => video?.seek(Number(e.target.value))}
              className="grow"
            />
          ) : (
            <span className="grow text-center text-[11px] text-emerald-400">● LIVE</span>
          )}
          <span className="font-mono text-[10px] text-white/40">
            {vs.time.toFixed(1)}/{vs.duration.toFixed(1)}
          </span>
          <button
            className={`border px-2 py-1 text-[11px] ${
              recording ? 'border-red-500 text-red-400' : 'border-white/25 text-white/85 hover:border-white/70'
            }`}
            onClick={recording ? onWebm : onWebm}
          >
            {recording ? `■ ${t('stop')}` : `⏺ ${t('record')}`}
          </button>
          <button
            className="border border-white/25 px-2 py-1 text-[11px] text-white/85 hover:border-white/70"
            onClick={onGif}
          >
            GIF
          </button>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={onInspire}
          className="border border-white/25 bg-black/60 px-4 py-2 text-[12px] text-white/85 backdrop-blur hover:border-white/70"
        >
          ✦ {t('inspire')}
        </button>
        <button
          onClick={onRestyle}
          className="border border-white/25 bg-black/60 px-4 py-2 text-[12px] text-white/85 backdrop-blur hover:border-white/70"
        >
          ⟳ {t('restyle')}
        </button>
        <button
          onClick={onCamera}
          className={`border px-4 py-2 text-[12px] backdrop-blur ${
            cameraActive
              ? 'border-red-500 bg-red-500/10 text-red-400'
              : 'border-white/25 bg-black/60 text-white/85 hover:border-white/70'
          }`}
        >
          {cameraActive ? `⏹ ${t('stopCamera')}` : `📷 ${t('camera')}`}
        </button>
        <button
          onMouseDown={() => setCompare(true)}
          onMouseUp={() => setCompare(false)}
          onTouchStart={() => setCompare(true)}
          onTouchEnd={() => setCompare(false)}
          className="border border-white/25 bg-black/60 px-4 py-2 text-[12px] text-white/85 backdrop-blur hover:border-white/70"
        >
          👁 {t('compare')}
        </button>
        {zoom !== 1 && (
          <button
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="border border-white/25 bg-black/60 px-3 py-2 text-[12px] text-white/85 backdrop-blur hover:border-white/70"
          >
            {t('fit')}
          </button>
        )}
      </div>
      <span className="absolute end-3 top-3 font-mono text-[10px] text-white/25">{tick}</span>
    </main>
  )
}
