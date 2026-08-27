import { useI18n } from '../i18n'

export function WhatsNew({ onClose }: { onClose: () => void }) {
  const { t, list, lang } = useI18n()
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[min(92vw,440px)] border border-white/15 bg-[#0a0a0d] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="float-end text-white/40 hover:text-white">
          ✕
        </button>
        <span className="mb-3 inline-block border border-emerald-400/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400">
          v2.0
        </span>
        <h2 className="mb-4 text-base font-medium text-white">{t('wnTitle')}</h2>
        <ul className="space-y-2.5">
          {list('wnItems').map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-white/70">
              <span className="text-white/30">→</span>
              <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>{item}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-5 w-full border border-white/25 py-2 text-[12px] text-white/80 hover:border-white/60"
        >
          {t('close')}
        </button>
      </div>
    </div>
  )
}
