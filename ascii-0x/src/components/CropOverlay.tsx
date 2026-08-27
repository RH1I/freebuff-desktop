import { useI18n } from '../i18n'
import type { CropSettings } from '../engine/types'
import { ASPECTS } from '../engine/types'
import { Slider, Select } from './controls'

export function CropOverlay({
  crop,
  onChange,
  onClose,
  onSave,
}: {
  crop: CropSettings
  onChange: (c: CropSettings) => void
  onClose: () => void
  onSave: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[min(92vw,400px)] border border-white/15 bg-[#0a0a0d] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">{t('cropTitle')}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-3 mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <button
              className="border border-white/25 px-3 py-1.5 text-[13px] text-white/80 hover:border-white/60"
              onClick={() => onChange({ ...crop, rotation: (((crop.rotation + 270) % 360) as CropSettings['rotation']) })}
            >
              ↺
            </button>
            <button
              className="border border-white/25 px-3 py-1.5 text-[13px] text-white/80 hover:border-white/60"
              onClick={() => onChange({ ...crop, rotation: (((crop.rotation + 90) % 360) as CropSettings['rotation']) })}
            >
              ↻
            </button>
          </div>
          <span className="text-[11px] text-white/40">
            {t('rotate')}: {crop.rotation}°
          </span>
        </div>

        <Select
          label={t('ratio')}
          value={crop.aspect}
          options={ASPECTS.map((a) => ({ value: a.id, label: a.id === 'free' ? t('free') : a.label }))}
          onChange={(v) => onChange({ ...crop, aspect: v })}
        />
        <Slider label={t('zoom')} value={crop.zoom} min={100} max={400} suffix="%" onChange={(v) => onChange({ ...crop, zoom: v })} />
        <Slider label={t('offsetX')} value={crop.offsetX} min={-100} max={100} onChange={(v) => onChange({ ...crop, offsetX: v })} />
        <Slider label={t('offsetY')} value={crop.offsetY} min={-100} max={100} onChange={(v) => onChange({ ...crop, offsetY: v })} />

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="border border-white/25 px-4 py-2 text-[12px] text-white/80 hover:border-white/60"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          <button className="bg-white px-4 py-2 text-[12px] font-medium text-black hover:bg-white/85" onClick={onSave}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
