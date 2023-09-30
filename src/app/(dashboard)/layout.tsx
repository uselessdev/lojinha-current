"use client";

import {
  CreateOrganization,
  OrganizationSwitcher,
  UserButton,
  useOrganization,
  useSession,
} from "@clerk/nextjs";
import Link from "next/link";
import { dark } from "@clerk/themes";
import { redirect, usePathname } from "next/navigation";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Logo } from "~/components/logo";
import { menu } from "./menu";
import { ThemeToggle } from "~/components/theme-toggle";
import { useTheme } from "next-themes";
import { Toaster } from "~/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  const { organization } = useOrganization();
  const { isSignedIn, isLoaded } = useSession();
  const pathname = usePathname();

  if (isLoaded && !isSignedIn) {
    return redirect("/");
  }

  if (!organization) {
    return (
      <div className="grid h-[100dvh] w-full place-content-center">
        <CreateOrganization
          appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
          afterCreateOrganizationUrl="/settings"
        />
      </div>
    );
  }

  return (
    <>
      <main className="grid h-[100dvh] w-full grid-cols-[300px_1fr]">
        <aside className="grid grid-rows-[80px_1fr]">
          <header className="flex h-20 flex-col justify-center px-6">
            <h1 className="text-xs font-semibold">
              <Link href="/">
                <Logo className="h-8 w-8" />
              </Link>
            </h1>
          </header>

          <nav className="flex flex-col gap-2 px-4 pb-6">
            {menu.map((menu) => (
              <Link
                key={menu.url}
                href={menu.url}
                className={twMerge(
                  clsx(
                    "flex items-center gap-2 rounded-md p-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5",
                    {
                      "bg-foreground/5 text-foreground dark:bg-foreground/10":
                        pathname.startsWith(menu.url),
                    },
                  ),
                )}
              >
                {menu.icon} {menu.label}
              </Link>
            ))}

            <div className="mt-auto px-2">
              <ThemeToggle />
            </div>
          </nav>
        </aside>

        <section>
          <header className="flex h-20 items-center justify-between pr-6">
            <OrganizationSwitcher
              hidePersonal
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  organizationSwitcherPopoverActionButton__createOrganization: {
                    display: "none",
                  },
                },
              }}
            />
            <UserButton
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
              }}
            />
          </header>

          <div className="h-[calc(100dvh-80px)] pb-6 pr-6">{children}</div>
        </section>
      </main>

      <Toaster />
    </>
  );
}
