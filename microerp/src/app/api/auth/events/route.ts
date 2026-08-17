import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { subscribe } from '@/lib/session-hub'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return new Response('No autorizado', { status: 401 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        if (controller.desiredSize === null) return
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      send(JSON.stringify({ type: 'connected' }))

      const unsubscribe = subscribe(session.userId, (payload) => send(payload))

      const heartbeat = setInterval(() => {
        if (controller.desiredSize === null) return
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // Stream ya cerrado
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}