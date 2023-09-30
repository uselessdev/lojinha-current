"use client";

import { useOrganization } from "@clerk/nextjs";
import { type EventActions } from "@prisma/client";
import { intlFormatDistance } from "date-fns";
import { getAction } from "../utils";

export function ReadableEvent(props: {
  user: string;
  action: EventActions;
  createdAt: Date;
}) {
  const { memberships, organization } = useOrganization({ memberships: {} });

  if (memberships?.isLoading) {
    return (
      <span className="inline-block h-5 w-full animate-pulse rounded-sm bg-foreground/10" />
    );
  }

  const user = memberships?.data?.find(({ publicUserData }) => {
    return publicUserData.userId === props.user;
  });

  return (
    <p>
      <strong className="font-medium">
        {user ? user?.publicUserData.firstName : `🤖 ${organization?.name}`}{" "}
      </strong>
      {getAction(props.action)}{" "}
      {intlFormatDistance(props.createdAt, new Date(), { locale: "pt-BR" })}
    </p>
  );
}
