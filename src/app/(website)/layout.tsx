import * as React from "react";
import { Logo } from "~/components/logo";
import { ThemeToggle } from "~/components/theme-toggle";
import { Signin } from "./components/sign";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid h-[100dvh] w-full grid-rows-[80px_1fr_62px]">
      <header className="container mx-auto flex items-center justify-between">
        <Logo className="h-10 w-10" aria-label="lojinha.dev" />

        <nav className="flex items-center gap-3">
          <a
            target="_blank"
            className="text-sm font-medium outline-none hover:text-zinc-500 focus:text-zinc-500"
            href="https://docs.lojinha.dev"
          >
            Documentação
          </a>

          <Signin />
        </nav>
      </header>

      <div className="container mx-auto grid place-items-center justify-start">
        {children}
      </div>

      <footer className="container mx-auto flex items-center">
        <ThemeToggle />
      </footer>
    </main>
  );
}

// 'use client'

// import { SignInButton, useUser } from '@clerk/nextjs'
// import Image from 'next/image'
// import Link from 'next/link'
// import * as React from 'react'
// import { ArrowRightIcon } from 'lucide-react'

// export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
//   const { isSignedIn } = useUser();

//   return (
//     <section className="grid min-h-screen grid-rows-[80px_1fr_80px] bg-white dark:bg-black selection:bg-gray-100 selection:text-gray-700">
//       <header className="w-full px-6">
//         <section className="container mx-auto flex h-20 items-center gap-4">
//           <h1 className="text-xl font-semibold text-gray-600 dark:text-gray-200">
//             <Link href="/" className="outline-none">
//               <Image src="/favicon.svg" alt="lojinha.dev" className="w-10 h-10" width={40} height={40} />
//             </Link>
//           </h1>

//           <div className="flex flex-1 gap-6 items-center justify-between">
//             <a
//               href="https://docs.lojinha.dev"
//               target="_blank"
//               className="flex gap-2 items-center text-sm text-gray-500 hover:text-gray-700 focus:text-gray-700 outline-none font-semibold"
//               rel="noreferrer"
//             >
//               <span>Documentação</span>
//             </a>

//             {isSignedIn ? (
//               <Link
//                 href="/dashboard"
//                 className="flex gap-1 items-center py-1 px-3 rounded-md text-xs font-semibold dark:text-gray-50 bg-gray-100 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700/50 transition-colors group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
//               >
//                 Dashboard
//                 <ArrowRightIcon className="w-4 group-hover:translate-x-1 transition-transform" />
//               </Link>
//             ) : (
//               <SignInButton mode="modal">
//                 <button className="flex gap-1 items-center py-1 px-3 rounded-md text-xs font-semibold dark:text-gray-50 bg-gray-100 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700/50 transition-colors group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
//                   Entrar{" "}
//                   <ArrowRightIcon className="w-4 group-hover:translate-x-1 transition-transform" />
//                 </button>
//               </SignInButton>
//             )}
//           </div>
//         </section>
//       </header>

//       <main className="grid h-full place-items-center px-6">
//         <section className="container mx-auto">{children}</section>
//       </main>

//       <footer className="w-full px-6">
//         <section className="container mx-auto flex h-20 items-center justify-between">
//           <p className="text-sm text-gray-500 dark:text-gray-400">
//             &copy;{new Date().getFullYear()} lojinha.dev
//           </p>
//         </section>
//       </footer>
//     </section>
//   )
// }
