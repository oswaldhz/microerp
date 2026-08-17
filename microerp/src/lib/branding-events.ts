const subscribers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>()

export function subscribeBranding(
  companyId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): () => void {
  let set = subscribers.get(companyId)
  if (!set) {
    set = new Set()
    subscribers.set(companyId, set)
  }
  set.add(controller)
  return () => {
    set!.delete(controller)
    if (set!.size === 0) subscribers.delete(companyId)
  }
}

export function emitBrandingEvent(companyId: string): void {
  const set = subscribers.get(companyId)
  if (!set) return
  const payload = new TextEncoder().encode(`event: branding\ndata: ${companyId}\n\n`)
  for (const controller of set) {
    try {
      controller.enqueue(payload)
    } catch {
      // stream cerrado: se limpia con el abort del cliente
    }
  }
}