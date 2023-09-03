import { auth } from "@clerk/nextjs";
import { db } from "~/lib/database";
import { SvixPortal } from "./components/svix-portal";
import { env } from "~/env.mjs";

async function getSvixPortal(id: string) {
  const result = await fetch(`${env.SVIX_PORTAL_URL}/${id}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accep: "application/json",
      Authorization: `Bearer ${env.SVIX_AUTH_TOKEN}`,
    },
    body: JSON.stringify({}),
  });

  return result.json() as Promise<{ url: string }>;
}

export default async function SettingsPage() {
  const { orgId } = auth();

  const portal = await db.storeSvix.findFirst({
    where: {
      store: String(orgId),
    },
  });

  if (!portal) {
    return null;
  }

  const url = await getSvixPortal(portal.sid);

  return <SvixPortal url={url.url} />;
}
