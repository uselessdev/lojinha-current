"use server";

import "@total-typescript/ts-reset/filter-boolean";
import { createServerAction } from "~/lib/actions/create-action";
import { productSchema } from "../schema";
import { db } from "~/lib/database";
import { formatter } from "~/lib/utils";
import { svix } from "~/lib/svix";
import { revalidatePath } from "next/cache";

export const updateProductAction = createServerAction({
  schema: productSchema,
  handler: async (
    {
      id,
      collections,
      price,
      originalPrice,
      variants = [],
      options = [],
      ...payload
    },
    ctx,
  ) => {
    const variantsToCreate = variants.filter(({ id }) => !Boolean(id));
    const variantsToUpdate = variants.filter(({ id }) => Boolean(id));
    const variantsIds = variantsToUpdate.map(({ id }) => id);

    const optionsToCreate = options.filter(({ id }) => !Boolean(id));
    const optionsToUpdate = options.filter(({ id }) => Boolean(id));
    const optionsIds = optionsToUpdate.map(({ id }) => id);

    try {
      const product = await db.$transaction(async (tx) => {
        /**
         * Delete all variants that are removed and not present in payload.variants
         */
        await tx.productVariants.deleteMany({
          where: {
            store: ctx.store,
            id: {
              notIn: variantsIds as string[],
            },
          },
        });

        /**
         * Delete all options that are removed and not present in payload.options
         */
        await tx.productOptions.deleteMany({
          where: {
            store: ctx.store,
            id: {
              notIn: optionsIds as string[],
            },
          },
        });

        variantsToUpdate.map(async (variant) => {
          await tx.productVariants.update({
            where: { id: variant.id },
            data: {
              ...variant,
              updatedAt: new Date(),
            },
          });
        });

        optionsToUpdate.map(async (option) => {
          await tx.productOptions.update({
            where: { id: option.id },
            data: {
              ...option,
              price: formatter.priceToNumberOrUndefined(option.price),
              originalPrice: formatter.priceToNumberOrUndefined(
                option.originalPrice,
              ),
              updatedAt: new Date(),
            },
          });
        });

        if (variantsToCreate.length) {
          await tx.productVariants.createMany({
            data: variantsToCreate.map((variant) => ({
              ...variant,
              productId: id as string,
              store: ctx.store,
            })),
          });
        }

        if (optionsToCreate.length) {
          await tx.productOptions.createMany({
            data: optionsToCreate.map((option) => ({
              ...option,
              productId: id as string,
              store: ctx.store,
              price: formatter.priceToNumberOrUndefined(option.price),
              originalPrice: formatter.priceToNumberOrUndefined(
                option.originalPrice,
              ),
            })),
          });
        }

        const result = await tx.product.update({
          where: { id, store: ctx.store },
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

        await db.event.create({
          data: {
            action: "UPDATE_PRODUCT",
            payload: { ...payload, collections, price, originalPrice, id },
            user: ctx.user,
            store: ctx.store,
          },
        });

        return result;
      });

      if (product) {
        await svix.message.create(String(ctx.wh), {
          eventType: "products.update",
          payload: { product },
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
