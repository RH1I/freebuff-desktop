import { useRef } from 'react'
import { useI18n } from '../i18n'
import type { Lang } from '../i18n'

export function TopBar({
  onUploadFile,
  onCrop,
  onRecipes,
  onExport,
  onWhatsNew,
  onReset,
}: {
  onUploadFile: (f: File) => void
  onCrop: () => void
  onRecipes: () => void
  onExport: () => void
  onWhatsNew: () => void
  onReset: () => void
}) {
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)

  const btn = 'border border-white/25 px-3.5 py-1.5 text-[12px] text-white/85 hover:border-white/70'

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">✳</span>
        <span className="text-[15px] font-medium tracking-tight">{t('appName')}</span>
      </div>
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button className={btn} onClick={() => fileRef.current?.click()}>
          {t('upload')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUploadFile(f)
            e.target.value = ''
          }}
        />
        <button className={btn} onClick={onCrop}>
          {t('crop')}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className={btn} onClick={onRecipes}>
          ☰ {t('recipes')}
        </button>
        <button
          className="bg-white px-4 py-1.5 text-[12px] font-medium text-black hover:bg-white/85"
          onClick={onExport}
        >
          {t('export')} ▾
        </button>
        <button
          className={btn}
          title={t('whatsNew')}
          onClick={onWhatsNew}
        >
          🎁
        </button>
        <button
          className={btn}
          onClick={() => setLang((lang === 'ar' ? 'en' : 'ar') as Lang)}
        >
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>
        <button className={btn} title={t('resetAll')} onClick={onReset}>
          ⟲
        </button>
      </div>
    </header>
  )
}
