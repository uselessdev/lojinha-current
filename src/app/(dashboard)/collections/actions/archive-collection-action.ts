"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";

export const archiveCollectionAction = createServerAction({
  schema: z.object({ id: z.string().uuid("Missing collection id") }),
  handler: async (payload, ctx) => {
    try {
      const collection = await db.collection.update({
        where: {
          id: payload.id,
          store: ctx.store,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await db.event.create({
        data: {
          action: "ARCHIVE_COLLECTION",
          payload,
          store: ctx.store,
          user: ctx.user,
        },
      });

      await svix.message.create(String(ctx.wh), {
        eventType: "collections.archive",
        payload: { collection: collection.id },
      });

      revalidatePath("/collections", "page");

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
