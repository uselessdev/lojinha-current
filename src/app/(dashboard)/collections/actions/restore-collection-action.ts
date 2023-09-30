"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";

export const restoreCollectionAction = createServerAction({
  schema: z.object({ id: z.string().uuid("Collection id is required") }),
  handler: async (payload, ctx) => {
    try {
      await db.$transaction(async (tx) => {
        await tx.collection.update({
          where: {
            id: payload.id,
            store: ctx.store,
          },
          data: {
            deletedAt: null,
          },
        });

        await tx.event.create({
          data: {
            action: "UNARCHIVE_COLLECTION",
            user: ctx.user,
            store: ctx.store,
            payload,
          },
        });

        await svix.message.create(String(ctx.wh), {
          eventType: "collections.restore",
          payload: { collection: payload.id },
        });
      });

      revalidatePath("/collections", "page");

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
