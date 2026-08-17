import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MicroERP',
  description: 'Sistema de gestión para comercios minoristas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}