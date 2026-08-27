import type { ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { FxChannel } from '../engine/types'

export function Section({
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string
  badge?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-b border-white/10">
      <button onClick={onToggle} className="flex w-full items-center gap-2 px-5 py-4 text-start">
        <span className="text-[11px] font-medium tracking-[0.2em] text-white/50 uppercase">
          /{title}
        </span>
        {badge && (
          <span className="border border-emerald-400/60 px-1.5 py-px text-[9px] font-bold tracking-wider text-emerald-400">
            {badge}
          </span>
        )}
        <span className="ms-auto text-white/30">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-2.5 py-1.5 text-[11px] transition-colors ${
        active
          ? 'border-white bg-white/10 text-white'
          : 'border-white/20 bg-white/5 text-white/70 hover:border-white/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-white/70">{label}</span>
        <span className="font-mono text-[11px] text-white/50">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[12px] text-white/70">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer border border-white/25 bg-transparent px-3 py-2 pe-8 text-[12px] text-white/90 outline-none hover:border-white/60"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0a0a0d]">
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-white/50">
          ▾
        </span>
      </div>
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-[12px] text-white/70">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-8 border transition-colors ${
          checked ? 'border-white bg-white/80' : 'border-white/30 bg-transparent'
        }`}
      >
        <span
          className={`absolute top-0.5 h-2.5 w-2.5 transition-all ${
            checked ? 'start-4 bg-black' : 'start-0.5 bg-white/60'
          }`}
        />
      </button>
    </label>
  )
}

export function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-white/70">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-10 cursor-pointer border border-white/25 bg-transparent p-0"
      />
    </label>
  )
}

export function FxRow({
  label,
  channel,
  onChange,
}: {
  label: string
  channel: FxChannel
  onChange: (c: FxChannel) => void
}) {
  const { t } = useI18n()
  return (
    <div className="mb-3 border border-white/10 p-2.5">
      <Toggle label={label} checked={channel.on} onChange={(on) => onChange({ ...channel, on })} />
      {channel.on && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[10px] text-white/40">
            <span>{t('intensity')}</span>
            <span className="font-mono">{channel.intensity}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={channel.intensity}
            onChange={(e) => onChange({ ...channel, intensity: Number(e.target.value) })}
          />
        </div>
      )}
    </div>
  )
}
