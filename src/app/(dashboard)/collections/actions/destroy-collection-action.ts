"use server";

import { revalidatePath } from "next/cache";
import { utapi } from "uploadthing/server";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";

export const destroyCollectionAction = createServerAction({
  schema: z.object({ id: z.string().uuid("Collection id is required") }),
  handler: async (payload, ctx) => {
    try {
      await db.$transaction(async (tx) => {
        const collection = await tx.collection.delete({
          where: {
            id: payload.id,
            store: ctx.store,
          },
          include: {
            images: true,
          },
        });

        await tx.event.create({
          data: {
            action: "DELETE_COLLECTION",
            user: ctx.user,
            store: ctx.store,
            payload,
          },
        });

        if (collection.images.length > 0) {
          await tx.image.deleteMany({
            where: {
              id: {
                in: collection.images.map(({ id }) => id),
              },
            },
          });

          await utapi.deleteFiles(collection.images.map(({ key }) => key));
        }

        await svix.message.create(String(ctx.wh), {
          eventType: "collections.delete",
          payload: { collection: collection.id },
        });
      });

      revalidatePath("/collections", "page");

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
