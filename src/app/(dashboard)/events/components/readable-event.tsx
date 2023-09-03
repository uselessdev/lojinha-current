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
  const { membershipList, isLoaded, organization } = useOrganization({
    membershipList: {},
  });
  const user = membershipList?.find(
    ({ publicUserData }) => publicUserData.userId === props.user,
  );

  return (
    <p className="text-zinc-700">
      <strong className="font-medium">
        {user && isLoaded
          ? user?.publicUserData.firstName
          : `🤖 ${organization?.name}`}
        {": "}
      </strong>
      {getAction(props.action)}{" "}
      {intlFormatDistance(props.createdAt, new Date(), { locale: "pt-BR" })}
    </p>
  );
}
