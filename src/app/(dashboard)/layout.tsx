"use client";

import {
  CreateOrganization,
  OrganizationSwitcher,
  UserButton,
  useOrganization,
  useSession,
} from "@clerk/nextjs";
import Link from "next/link";
import * as React from "react";
import { redirect, usePathname } from "next/navigation";
import Image from "next/image";
import { PageHeader } from "~/components/page-header";
import { menu } from "./menu";
import clsx from "clsx";
import { Toaster } from "~/components/ui/toaster";

export default function DashboardLayout({
  children,
}: React.PropsWithChildren<unknown>) {
  const store = useOrganization();
  const session = useSession();

  const pathname = usePathname();

  if (!session.isSignedIn && session.isLoaded) {
    return redirect("/");
  }

  return (
    <>
      {!store.organization ? (
        <section className="grid h-screen w-full place-items-center">
          <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
        </section>
      ) : null}

      {store.organization ? (
        <div className="grid min-h-screen w-full grid-cols-[300px_1fr]">
          <aside className="sticky top-0 grid grid-rows-[80px_1fr]">
            <header className="flex h-20 flex-col justify-center px-6">
              <h1 className="text-xs font-semibold text-gray-700">
                <Link href="/">
                  <Image
                    src="/android-chrome-512x512.png"
                    alt="lojinha.dev"
                    width={24}
                    height={24}
                    className="h-w-6 w-6"
                  />
                </Link>
              </h1>
            </header>

            <nav className="flex flex-col gap-2 px-4">
              {menu.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className={clsx(
                    `flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-50`,
                    { "text-gray-800": pathname.startsWith(item.url) },
                  )}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="grid min-h-screen w-full grid-rows-[80px_1fr]">
            <PageHeader>
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  elements: {
                    organizationSwitcherPopoverActionButton__createOrganization:
                      {
                        display: "none",
                      },
                  },
                }}
              />
              <UserButton />
            </PageHeader>
            <main className="pb-6 pr-6">{children}</main>
          </section>
        </div>
      ) : null}

      <Toaster />
    </>
  );
}
