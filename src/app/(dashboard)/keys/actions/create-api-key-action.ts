"use server";

import { revalidatePath } from "next/cache";
import { env } from "process";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";

async function createApiKey(store: string) {
  const unkey = await fetch(`${env.UNKEY_APP_URL}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UNKEY_APP_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prefix: "pk",
      byteLength: 32,
      meta: {
        // @todo create write mode for secret keys
        mode: "read",
        // @todo allow named keys
        name: "default",
      },
      apiId: env.UNKEY_APP_ID,
      ownerId: store,
    }),
    cache: "no-store",
  });

  const result = (await unkey.json()) as { keyId: string; key: string };
  return result as { key: string };
}

const schema = z.undefined();

export const createApiKeyAction = createServerAction({
  schema,
  handler: async (payload, ctx) => {
    try {
      const key = await createApiKey(ctx.store);

      if (key) {
        await db.event.create({
          data: {
            action: "CREATE_KEY",
            payload: { store: ctx.store },
            user: ctx.user,
            store: ctx.store,
          },
        });
      }

      revalidatePath("/keys", "page");

      return { success: true, data: key.key };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
