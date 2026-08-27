import { useCallback, useRef, useState } from 'react'

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial)
  const [cursor, setCursor] = useState(0)
  const past = useRef<T[]>([])
  const future = useRef<T[]>([])
  const [, force] = useState(0)

  const set = useCallback((patch: Partial<T>) => {
    setState((s) => {
      past.current = [...past.current.slice(-49), s]
      future.current = []
      setCursor(past.current.length)
      return { ...s, ...patch }
    })
    force((n) => n + 1)
  }, [])

  const replace = useCallback((next: T) => {
    setState((s) => {
      past.current = [...past.current.slice(-49), s]
      future.current = []
      setCursor(past.current.length)
      return next
    })
    force((n) => n + 1)
  }, [])

  const undo = useCallback(() => {
    setState((s) => {
      const prev = past.current.pop()
      if (prev === undefined) return s
      future.current = [s, ...future.current.slice(0, 49)]
      setCursor(past.current.length)
      return prev
    })
    force((n) => n + 1)
  }, [])

  const redo = useCallback(() => {
    setState((s) => {
      const next = future.current.shift()
      if (next === undefined) return s
      past.current = [...past.current, s]
      setCursor(past.current.length)
      return next
    })
    force((n) => n + 1)
  }, [])

  const canUndo = past.current.length > 0
  const canRedo = future.current.length > 0
  void cursor

  return { state, set, replace, undo, redo, canUndo, canRedo }
}
