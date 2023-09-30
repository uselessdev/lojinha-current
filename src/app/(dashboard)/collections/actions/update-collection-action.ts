"use server";

import { createServerAction } from "~/lib/actions/create-action";
import { collectionSchema } from "../schema";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";
import { revalidatePath } from "next/cache";

export const updateCollectionAction = createServerAction({
  schema: collectionSchema,
  handler: async ({ parents, ...payload }, ctx) => {
    try {
      const collection = await db.$transaction(async (tx) => {
        const collection = await tx.collection.update({
          where: {
            id: payload.id,
            store: ctx.store,
          },
          data: {
            ...payload,
            parents: {
              set: parents?.map((id) => ({ id })),
            },
            updatedAt: new Date(),
          },
        });

        await db.event.create({
          data: {
            action: "UPDATE_COLLECTION",
            user: ctx.user,
            store: ctx.store,
            payload,
          },
        });

        await svix.message.create(String(ctx.wh), {
          eventType: "collections.update",
          payload: collection,
        });

        return collection;
      });

      revalidatePath(`/collections`, "page");

      return { success: true, data: collection };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
