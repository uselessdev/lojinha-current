"use server";

import { createServerAction } from "~/lib/actions/create-action";
import { productSchema } from "../schema";
import { db } from "~/lib/database";
import { formatter } from "~/lib/utils";
import { svix } from "~/lib/svix";
import { revalidatePath } from "next/cache";

export const createProductAction = createServerAction({
  schema: productSchema,
  handler: async (
    {
      collections,
      price,
      originalPrice,
      variants,
      options,
      sku,
      quantity,
      ...payload
    },
    ctx,
  ) => {
    try {
      const product = await db.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...payload,
            store: ctx.store,
            collections: {
              connect: collections?.map((id) => ({ id })),
            },
          },
        });

        if (!variants?.length) {
          await tx.productVariants.create({
            data: {
              name: "default",
              store: ctx.store,
              values: ["default"],
              productId: product.id,
            },
          });

          await tx.productOption.create({
            data: {
              name: "default",
              store: ctx.store,
              price: formatter.number(price ?? ""),
              originalPrice: formatter.number(originalPrice ?? ""),
              sku: sku,
              productId: product.id,
              quantity: quantity,
            },
          });
        }

        if (variants && variants?.length > 0) {
          await tx.productVariants.createMany({
            data: variants?.map((variant) => ({
              name: variant.name,
              values: variant.values ?? [],
              productId: product.id,
              store: ctx.store,
            })),
          });
        }

        if (options && options.length > 0) {
          await tx.productOption.createMany({
            data: options.map((option) => ({
              name: option.name,
              productId: product.id,
              store: ctx.store,
              price: formatter.number(option.price ?? ""),
              originalPrice: formatter.number(option.originalPrice ?? ""),
              quantity: option.quantity,
              sku: option.sku,
            })),
          });
        }

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
      console.log(error);
      return { success: false, error: (error as Error).message };
    }
  },
});
