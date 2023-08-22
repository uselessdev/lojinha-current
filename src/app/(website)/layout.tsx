import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="grid min-h-screen grid-rows-[80px_1fr_80px] bg-white dark:bg-black selection:bg-gray-100 selection:text-gray-700">
      <header className="w-full px-6">
        <section className="container mx-auto flex h-20 items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-600 dark:text-gray-200">
            <Link href="/">
              <Image src="/favicon.svg" alt="lojinha.dev" className="w-10 h-10" width={40} height={40} />
            </Link>
          </h1>

          <nav className="flex gap-6 items-center">
            <a
              href="https://docs.lojinha.dev"
              target="_blank"
              className="flex gap-2 items-center text-sm text-gray-500 hover:text-gray-700 font-semibold"
              rel="noreferrer"
            >
              <span>Documentação</span>
            </a>

            {/* {isSignedIn ? (
              <Link
                href="/dashboard"
                className="flex gap-1 items-center py-1 px-3 rounded-md text-xs font-semibold dark:text-gray-50 bg-gray-100 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700/50 transition-colors group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
              >
                Dashboard
                <ArrowRightIcon className="w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="flex gap-1 items-center py-1 px-3 rounded-md text-xs font-semibold dark:text-gray-50 bg-gray-100 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700/50 transition-colors group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700">
                  Entrar{" "}
                  <ArrowRightIcon className="w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            )} */}
          </nav>
        </section>
      </header>

      <main className="grid h-full place-items-center px-6">
        <section className="container mx-auto">{children}</section>
      </main>

      <footer className="w-full px-6">
        <section className="container mx-auto flex h-20 items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy;{new Date().getFullYear()} lojinha.dev
          </p>
        </section>
      </footer>
    </section>
  )
}
