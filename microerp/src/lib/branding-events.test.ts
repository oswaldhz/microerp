import { describe, expect, it } from 'vitest'
import { emitBrandingEvent, subscribeBranding } from './branding-events'

const decoder = new TextDecoder()

function openStream(companyId: string) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      subscribeBranding(companyId, controller)
    },
  })
  return stream.getReader()
}

describe('branding-events', () => {
  it('notifica solo a los suscriptores de la empresa', async () => {
    const readerA = openStream('c1')
    const readerB = openStream('c2')

    emitBrandingEvent('c1')

    const { value: event } = await readerA.read()
    expect(decoder.decode(event)).toBe('event: branding\ndata: c1\n\n')
    const pending = await Promise.race([
      readerB.read().then(() => 'event'),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 50)),
    ])
    expect(pending).toBe('timeout')

    readerA.releaseLock()
    readerB.releaseLock()
  })

  it('deja de notificar tras desuscribirse', async () => {
    let unsubscribe: () => void = () => {}
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        unsubscribe = subscribeBranding('c3', controller)
      },
    })
    const reader = stream.getReader()

    unsubscribe()
    emitBrandingEvent('c3')

    const pending = await Promise.race([
      reader.read().then(() => 'event'),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 50)),
    ])
    expect(pending).toBe('timeout')

    reader.releaseLock()
  })

  it('tolera suscriptores cerrados al emitir', async () => {
    const reader = openStream('c4')
    emitBrandingEvent('c4')
    const { value: first } = await reader.read()
    expect(decoder.decode(first)).toBe('event: branding\ndata: c4\n\n')
    await reader.cancel()
    expect(() => emitBrandingEvent('c4')).not.toThrow()
  })
})