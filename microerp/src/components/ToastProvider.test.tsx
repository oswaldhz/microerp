import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '@/components/ToastProvider'

function Harness() {
  const toast = useToast()
  return (
    <div>
      <button onClick={() => toast.success('Registro creado')}>ok</button>
      <button onClick={() => toast.error('Algo falló')}>err</button>
    </div>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastProvider', () => {
  it('muestra un toast de éxito con su texto', () => {
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('ok'))
    expect(screen.getByText('Registro creado')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('muestra un toast de error', () => {
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('err'))
    expect(screen.getByText('Algo falló')).toBeInTheDocument()
  })

  it('apila varios toasts', () => {
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('ok'))
    fireEvent.click(screen.getByText('err'))
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  it('el botón X cierra el toast', () => {
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('ok'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }))
    expect(screen.queryByText('Registro creado')).not.toBeInTheDocument()
  })

  it('se cierra solo tras 4 segundos', async () => {
    vi.useFakeTimers()
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('ok'))
    expect(screen.getByText('Registro creado')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    await vi.waitFor(() => expect(screen.queryByText('Registro creado')).not.toBeInTheDocument())
  })
})