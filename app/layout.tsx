// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clientum Nóminas',
  description: 'Dashboard de nóminas',
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </body>
    </html>
  )
}
