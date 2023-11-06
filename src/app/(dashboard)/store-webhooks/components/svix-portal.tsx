"use client";

import { AppPortal } from "svix-react";
import { Card } from "~/components/ui/card";
import "svix-react/style.css";

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
