"use client";

// @ts-expect-error types are missing
import { AppPortal } from "svix-react";
import "svix-react/style.css";
import { Card } from "~/components/ui/card";

type Props = {
  url: string;
};

export function SvixPortal({ url }: Props) {
  return (
    <Card className="relative min-h-[calc(100dvh-120px)] [&>*]:h-[calc(100dvh-120px)]">
      <AppPortal url={url} />
    </Card>
  );
}
