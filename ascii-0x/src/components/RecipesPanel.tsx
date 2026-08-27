import { useState } from 'react'
import { useI18n } from '../i18n'
import type { Recipe } from '../engine/recipes'
import { BUILTIN_RECIPES } from '../engine/recipes'

export function RecipesPanel({
  myRecipes,
  onClose,
  onApply,
  onSaveCurrent,
  onDelete,
  shareCode,
}: {
  myRecipes: Recipe[]
  onClose: () => void
  onApply: (r: Recipe) => void
  onSaveCurrent: () => void
  onDelete: (id: string) => void
  shareCode: string
}) {
  const { t, lang } = useI18n()
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState('')

  const copy = async (text: string, tag: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(tag)
    setTimeout(() => setCopied(''), 1500)
  }

  const shareUrl = () => {
    const url = new URL(window.location.href)
    url.search = `?r=${encodeURIComponent(shareCode.split(':')[2] ?? '')}`
    return url.toString()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[80vh] w-[min(94vw,640px)] overflow-y-auto border border-white/15 bg-[#0a0a0d] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">✨ {t('recipesTitle')}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {BUILTIN_RECIPES.map((r) => (
            <button
              key={r.id}
              onClick={() => onApply(r)}
              className="group border border-white/15 p-3 text-start hover:border-white/60"
            >
              <div className="mb-1 text-[12px] text-white/90">{lang === 'ar' ? r.nameAr : r.name}</div>
              <div className="text-[10px] text-white/40 group-hover:text-white/60">{t('apply')} →</div>
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12px] uppercase tracking-widest text-white/40">{t('myRecipes')}</h3>
          <button
            onClick={onSaveCurrent}
            className="border border-white/25 px-3 py-1.5 text-[11px] text-white/80 hover:border-white/60"
          >
            + {t('saveCurrent')}
          </button>
        </div>
        {myRecipes.length === 0 ? (
          <p className="mb-5 text-[11px] text-white/30">—</p>
        ) : (
          <div className="mb-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {myRecipes.map((r) => (
              <div key={r.id} className="border border-white/15 p-3">
                <button onClick={() => onApply(r)} className="mb-1 block text-start text-[12px] text-white/90 hover:text-white">
                  {lang === 'ar' ? r.nameAr || r.name : r.name}
                </button>
                <div className="flex gap-2 text-[10px]">
                  <button className="text-white/40 hover:text-white" onClick={() => setSharing(true)}>
                    {t('share')}
                  </button>
                  <button className="text-red-400/60 hover:text-red-400" onClick={() => onDelete(r.id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sharing && (
          <div className="border border-white/15 p-4">
            <p className="mb-3 text-[11px] leading-relaxed text-white/50">
              {lang === 'ar'
                ? 'التقط شكلك الحالي كوصفة قابلة للنسخ. شارك الرابط ويمكن لأي شخص تطبيق إعداداتك بالضبط على صورته.'
                : 'Capture your current look as a copy-pasteable recipe. Share the link and anyone can apply your exact settings to their own image.'}
            </p>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">{t('shareLink')}</div>
            <div className="mb-3 flex gap-1.5">
              <input
                readOnly
                value={shareUrl()}
                className="grow border border-white/15 bg-transparent px-2 py-1.5 font-mono text-[10px] text-white/60"
              />
              <button
                onClick={() => copy(shareUrl(), 'link')}
                className="border border-white/25 px-2 text-[10px] text-white/80 hover:border-white/60"
              >
                {copied === 'link' ? t('copied') : t('copyLink')}
              </button>
            </div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">{t('recipeCode')}</div>
            <div className="flex gap-1.5">
              <input
                readOnly
                value={shareCode}
                className="grow border border-white/15 bg-transparent px-2 py-1.5 font-mono text-[10px] text-white/60"
              />
              <button
                onClick={() => copy(shareCode, 'code')}
                className="border border-white/25 px-2 text-[10px] text-white/80 hover:border-white/60"
              >
                {copied === 'code' ? t('copied') : t('copyCode')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
