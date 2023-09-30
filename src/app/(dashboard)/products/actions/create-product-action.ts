"use server";

import { createServerAction } from "~/lib/actions/create-action";
import { productSchema } from "../schema";
import { db } from "~/lib/database";
import { formatter } from "~/lib/utils";
import { svix } from "~/lib/svix";
import { revalidatePath } from "next/cache";

export const createProductAction = createServerAction({
  schema: productSchema,
  handler: async ({ collections, price, originalPrice, ...payload }, ctx) => {
    try {
      const product = await db.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...payload,
            price: formatter.number(price ?? ""),
            originalPrice: formatter.number(originalPrice ?? ""),
            store: ctx.store,
            collections: {
              connect: collections?.map((id) => ({ id })),
            },
          },
        });

        await tx.event.create({
          data: {
            action: "CREATE_PRODUCT",
            payload: { ...payload, price, originalPrice, collections },
            user: ctx.user,
            store: ctx.store,
          },
        });

        return product;
      });

      if (product) {
        await svix.message.create(String(ctx.wh), {
          eventType: "products.create",
          payload: { product },
        });
      }

      revalidatePath("/products", "page");

      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
