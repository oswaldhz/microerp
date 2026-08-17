import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmProvider, useConfirm } from '@/components/ConfirmProvider'

function Harness() {
  const confirmDialog = useConfirm()
  const [result, setResult] = useState<boolean | null>(null)
  return (
    <div>
      <button onClick={() => confirmDialog({ title: 'Eliminar', message: '¿Eliminar el registro?' }).then(setResult)}>
        abrir
      </button>
      <span data-testid="result">{result === null ? 'nada' : String(result)}</span>
    </div>
  )
}

describe('ConfirmProvider', () => {
  it('abre el modal con título, mensaje y botones por defecto', () => {
    render(
      <ConfirmProvider>
        <Harness />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('abrir'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
    expect(screen.getByText('¿Eliminar el registro?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('resuelve true al confirmar', async () => {
    render(
      <ConfirmProvider>
        <Harness />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('abrir'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('true'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('resuelve false al cancelar', async () => {
    render(
      <ConfirmProvider>
        <Harness />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('abrir'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('false'))
  })

  it('Escape cancela y Enter confirma', async () => {
    render(
      <ConfirmProvider>
        <Harness />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('abrir'))
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('false'))

    fireEvent.click(screen.getByText('abrir'))
    fireEvent.keyDown(window, { key: 'Enter' })
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('true'))
  })

  it('danger muestra botón rojo; sin danger muestra verde', () => {
    function DangerHarness() {
      const confirmDialog = useConfirm()
      return (
        <button onClick={() => confirmDialog({ title: 'X', message: 'm', danger: true })}>rojo</button>
      )
    }
    render(
      <ConfirmProvider>
        <DangerHarness />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('rojo'))
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveClass('bg-red-600')
  })

  it('usa labels personalizados', () => {
    function CustomHarness() {
      const confirmDialog = useConfirm()
      return (
        <button onClick={() => confirmDialog({ title: 'T', message: 'M', confirmLabel: 'Borrar', cancelLabel: 'Volver' })}>
          custom
        </button>
      )
    }
    render(
      <ConfirmProvider>
        <CustomHarness />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('custom'))
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })
})