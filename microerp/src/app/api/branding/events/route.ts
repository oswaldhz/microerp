import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requireSession } from '@/lib/api-helpers'
import { subscribeBranding } from '@/lib/branding-events'

export async function GET(request: Request) {
  const session = await getSession()
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const unsubscribe = subscribeBranding(checked.companyId, controller)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          // stream cerrado
        }
      }, 20000)
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // ya cerrado
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}