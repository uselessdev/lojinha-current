"use server";

import { createServerAction } from "~/lib/actions/create-action";
import { productSchema } from "../schema";
import { db } from "~/lib/database";
import { formatter } from "~/lib/utils";
import { svix } from "~/lib/svix";
import { revalidatePath } from "next/cache";

export const updateProductAction = createServerAction({
  schema: productSchema,
  handler: async (
    { id, collections, price, originalPrice, ...payload },
    ctx,
  ) => {
    try {
      const product = await db.product.update({
        where: {
          id,
          store: ctx.store,
        },
        data: {
          ...payload,
          updatedAt: new Date(),
          price: formatter.number(price ?? ""),
          originalPrice: formatter.number(originalPrice ?? ""),
          collections: {
            set: collections?.map((id) => ({ id })),
          },
        },
      });

      if (product) {
        await svix.message.create(String(ctx.wh), {
          eventType: "products.update",
          payload: { product },
        });

        await db.event.create({
          data: {
            action: "UPDATE_PRODUCT",
            payload: { ...payload, collections, price, originalPrice, id },
            user: ctx.user,
            store: ctx.store,
          },
        });
      }

      revalidatePath("/products", "page");

      return { success: true, data: product };
    } catch (error) {
      console.error(error);

      return { success: false, error: (error as Error).message };
    }
  },
});
