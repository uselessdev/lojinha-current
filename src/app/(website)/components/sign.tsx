"use client";

import { SignInButton, useSession } from "@clerk/nextjs";
import { MoveRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export function Signin() {
  const { isSignedIn } = useSession();

  if (isSignedIn) {
    return (
      <Button asChild size="sm" className="group flex gap-2" variant="outline">
        <Link href="/dashboard">
          Dashboard
          <MoveRightIcon className="transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    );
  }

  return (
    <SignInButton
      mode="modal"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/settings"
    >
      <Button size="sm" className="group flex gap-2" variant="outline">
        Entrar
        <MoveRightIcon className="transition-transform group-hover:translate-x-1" />
      </Button>
    </SignInButton>
  );
}
