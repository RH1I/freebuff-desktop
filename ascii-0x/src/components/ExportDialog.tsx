import { useState } from 'react'
import { useI18n } from '../i18n'

export function ExportDialog({
  onClose,
  onExportImage,
  onExportTxt,
  onExportSvg,
  onCopy,
  dims,
  busy,
}: {
  onClose: () => void
  onExportImage: (f: 'png' | 'jpg' | 'webp', scale: number, transparent: boolean) => void
  onExportTxt: () => void
  onExportSvg: () => void
  onCopy: () => void
  dims: { w: number; h: number }
  busy: string | null
}) {
  const { t } = useI18n()
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png')
  const [scale, setScale] = useState(1)
  const [transparent, setTransparent] = useState(false)
  const [copied, setCopied] = useState(false)

  const btn = (active: boolean) =>
    `border px-3 py-1.5 text-[12px] ${
      active ? 'border-white bg-white/10 text-white' : 'border-white/25 text-white/70 hover:border-white/60'
    }`

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[min(92vw,420px)] border border-white/15 bg-[#0a0a0d] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">{t('export')}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-4 mt-4">
          <div className="mb-2 text-[11px] uppercase tracking-widest text-white/40">{t('format')}</div>
          <div className="flex gap-1.5">
            <button className={btn(format === 'png')} onClick={() => setFormat('png')}>PNG</button>
            <button className={btn(format === 'jpg')} onClick={() => setFormat('jpg')}>JPG</button>
            <button className={btn(format === 'webp')} onClick={() => setFormat('webp')}>WebP</button>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[11px] uppercase tracking-widest text-white/40">{t('resolution')}</div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <button key={s} className={btn(scale === s)} onClick={() => setScale(s)}>
                {s}×
              </button>
            ))}
            <span className="ms-2 font-mono text-[11px] text-white/40">
              {dims.w * scale} × {dims.h * scale} px
            </span>
          </div>
        </div>

        {format === 'png' && (
          <label className="mb-4 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
              className="accent-white"
            />
            <span className="text-[12px] text-white/70">{t('transparent')}</span>
          </label>
        )}

        <button
          className="mb-3 w-full bg-white py-2.5 text-[13px] font-medium text-black hover:bg-white/85"
          onClick={() => onExportImage(format, scale, transparent)}
        >
          {busy ?? `${t('exportBtn')} ${format.toUpperCase()}`}
        </button>

        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button className="border border-white/25 py-2 text-[12px] text-white/80 hover:border-white/60" onClick={onExportTxt}>
            TXT
          </button>
          <button className="border border-white/25 py-2 text-[12px] text-white/80 hover:border-white/60" onClick={onExportSvg}>
            SVG
          </button>
        </div>

        <button
          className="w-full border border-white/25 py-2 text-[12px] text-white/80 hover:border-white/60"
          onClick={async () => {
            await onCopy()
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? t('copied') : t('copyClip')}
        </button>
      </div>
    </div>
  )
}
