import { useEffect } from 'react'

export interface Hotkey {
  key: string
  ctrl?: boolean
  shift?: boolean
  handler: (e: KeyboardEvent) => void
}

export function useHotkeys(hotkeys: Hotkey[], active: boolean): void {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        if (!(e.ctrlKey || e.metaKey)) return
      }
      for (const h of hotkeys) {
        if (e.key.toLowerCase() !== h.key.toLowerCase()) continue
        if (!!h.ctrl !== (e.ctrlKey || e.metaKey)) continue
        if (!!h.shift !== e.shiftKey) continue
        e.preventDefault()
        h.handler(e)
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkeys, active])
}
