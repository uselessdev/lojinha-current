"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "~/env.mjs";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";

async function revokeKey(key: string) {
  try {
    await fetch(`${env.UNKEY_APP_URL}/keys/${key}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env.UNKEY_APP_KEY}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new Error((err as Error).message);
  }
}

export const revokeApiKeyAction = createServerAction({
  schema: z.object({ key: z.string().min(1, "Invalid API key id") }),
  handler: async (payload, ctx) => {
    try {
      await revokeKey(payload.key);

      await db.event.create({
        data: {
          action: "REVOKE_KEY",
          user: ctx.user,
          store: ctx.store,
          payload,
        },
      });

      revalidatePath("/keys", "page");

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
