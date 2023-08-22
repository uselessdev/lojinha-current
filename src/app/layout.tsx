import '~/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: "lojinha",
    template: "%s | Lojinha",
  },
  description:
    "Uma plataforma de e-commerce headless para desenvolvedores front-end.",
  icons: [
    { rel: "apple-touch-icon", url: "./apple-touch-icon.png" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
  ],
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#fefefe" },
  ],
};

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
