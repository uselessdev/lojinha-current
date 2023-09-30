"use server";

import { revalidatePath } from "next/cache";
import { utapi } from "uploadthing/server";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";

export const destroyProductAction = createServerAction({
  schema: z.object({ id: z.string().uuid("Product ID is required") }),
  handler: async (payload, ctx) => {
    try {
      const product = await db.product.delete({
        where: {
          id: payload.id,
          store: ctx.store,
        },
        include: {
          images: true,
        },
      });

      if (product) {
        await db.event.create({
          data: {
            action: "DELETE_PRODUCT",
            user: ctx.user,
            store: ctx.store,
            payload,
          },
        });

        await svix.message.create(String(ctx.wh), {
          eventType: "products.delete",
          payload: { product: payload.id },
        });
      }

      if (product.images.length > 0) {
        await db.image.deleteMany({
          where: {
            id: {
              in: product.images.map(({ id }) => id),
            },
          },
        });

        await utapi.deleteFiles(product.images.map(({ key }) => key));
      }

      revalidatePath("/products", "page");

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
