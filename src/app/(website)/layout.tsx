import * as React from "react";
import { Logo } from "~/components/logo";
import { ThemeToggle } from "~/components/theme-toggle";

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
          {/* <a
            target="_blank"
            className="text-sm font-medium outline-none hover:text-zinc-500 focus:text-zinc-500"
            href="https://docs.lojinha.dev"
          >
            Documentação
          </a> */}

          {/* <Signin /> */}
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
