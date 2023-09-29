import type {
  OrganizationJSON,
  UserJSON,
  WebhookEvent,
} from "@clerk/clerk-sdk-node";
import { Webhook } from "svix";
import type { WebhookRequiredHeaders } from "svix";
import { headers } from "next/headers";
import { env } from "~/env.mjs";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";

async function handler(request: Request) {
  const payload = (await request.json()) as string;

  const requiredHeaders = {
    "svix-id": headers().get("svix-id"),
    "svix-timestamp": headers().get("svix-timestamp"),
    "svix-signature": headers().get("svix-signature"),
  };

  const wh = new Webhook(env.SVIX_WEBHOOK_CLERK_SECRET);

  let data: WebhookEvent;

  try {
    data = wh.verify(
      JSON.stringify(payload),
      requiredHeaders as WebhookRequiredHeaders,
    ) as WebhookEvent;
  } catch (error) {
    console.log(error);
    return new Response(null, { status: 400 });
  }

  switch (data.type) {
    case "user.created":
      await createAccountEvent(data.data);
      break;
    case "user.deleted":
      /** @todo sync for user deleted */
      break;
    case "organization.created":
      await createOrganizationEvent(data.data);
      break;
    case "organization.deleted":
      /** @todo sync for organization delete */
      break;
    case "organizationInvitation.accepted":
      /** @todo handle for invitation acceped */
      break;
    default:
      break;
  }

  return new Response("OK", { status: 200 });
}

export const POST = handler;

async function createAccountEvent(user: UserJSON) {
  const payload = {
    id: user.id,
    email: user.email_addresses.map(({ email_address }) => email_address),
    name: `${user.first_name} ${user.last_name}`,
  };

  await db.event.create({
    data: {
      payload,
      action: "CREATE_ACCOUNT",
      user: user.id,
    },
  });
}

async function createOrganizationEvent(store: OrganizationJSON) {
  const payload = {
    id: store.id,
    name: store.name,
    created_by: store.created_by,
  };

  const app = await svix.application.create({
    name: store.name,
    uid: store.id,
  });

  await db.webhook.create({
    data: {
      sid: app.id,
      store: store.id,
    },
  });

  await db.event.create({
    data: {
      action: "CREATE_STORE",
      payload: payload,
      user: payload.created_by,
      store: payload.id,
    },
  });
}
