"use server";

import { createServerAction } from "~/lib/actions/create-action";
import { collectionSchema } from "../schema";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";
import { revalidatePath } from "next/cache";

export const createCollectionAction = createServerAction({
  schema: collectionSchema,
  handler: async ({ parents, ...payload }, ctx) => {
    try {
      const collection = await db.$transaction(async (tx) => {
        const result = await tx.collection.create({
          data: {
            ...payload,
            store: ctx.store,
            parents: {
              connect: parents?.map((id) => ({ id })),
            },
          },
        });

        await db.event.create({
          data: {
            action: "CREATE_COLLECTION",
            payload: { parents, ...payload },
            user: ctx.user,
            store: ctx.store,
          },
        });

        return result;
      });

      await svix.message.create(ctx.wh as string, {
        eventType: "collections.create",
        payload: { collection },
      });

      revalidatePath("/collections", "page");

      return { success: true, data: collection };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
