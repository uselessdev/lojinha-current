import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lojinha',
  description: 'E-commerce headless para desenvolvedores.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-gray-50 grid place-items-center">{children}</body>
    </html>
  )
}
