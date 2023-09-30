"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";
import { svix } from "~/lib/svix";

export const archiveProductAction = createServerAction({
  schema: z.object({ id: z.string().uuid("Product id is required") }),
  handler: async (payload, ctx) => {
    try {
      const product = await db.product.update({
        where: {
          id: payload.id,
          store: ctx.store,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      if (product) {
        await db.event.create({
          data: {
            action: "ARCHIVE_PRODUCT",
            user: ctx.user,
            store: ctx.store,
            payload,
          },
        });

        await svix.message.create(String(ctx.wh), {
          eventType: "products.archive",
          payload: { product: product.id },
        });
      }

      revalidatePath("/products", "page");

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
