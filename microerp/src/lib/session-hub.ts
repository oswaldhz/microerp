type Listener = (payload: string) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribe(userId: string, listener: Listener): () => void {
  if (!listeners.has(userId)) listeners.set(userId, new Set())
  listeners.get(userId)!.add(listener)
  return () => {
    const set = listeners.get(userId)
    if (!set) return
    set.delete(listener)
    if (set.size === 0) listeners.delete(userId)
  }
}

export function emit(userId: string, payload: string) {
  listeners.get(userId)?.forEach((listener) => listener(payload))
}

export function hasListeners(userId: string) {
  return (listeners.get(userId)?.size ?? 0) > 0
}