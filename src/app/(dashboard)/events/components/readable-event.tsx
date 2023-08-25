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
  const { membershipList } = useOrganization({ membershipList: {} });
  const user = membershipList?.find(
    ({ publicUserData }) => publicUserData.userId === props.user,
  );

  return (
    <p>
      {user ? user?.publicUserData.firstName : `🤖 ${props.user}`}{" "}
      {getAction(props.action)}{" "}
      {intlFormatDistance(props.createdAt, new Date(), { locale: "pt-BR" })}
    </p>
  );
}
