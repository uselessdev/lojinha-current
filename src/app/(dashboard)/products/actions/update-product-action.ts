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
      sku,
      quantity,
      ...payload
    },
    ctx,
  ) => {
    const variantsToCreate = variants.filter(({ id }) => !Boolean(id));
    const variantsToUpdate = variants.filter(
      ({ id, name }) => Boolean(id) && name !== "default",
    );
    const variantsIds = variantsToUpdate.map(({ id }) => id);

    const optionsToCreate = options.filter(({ id }) => !Boolean(id));
    const optionsToUpdate = options.filter(
      ({ id, name }) => Boolean(id) && name !== "default",
    );
    const optionsIds = optionsToUpdate.map(({ id }) => id);

    const defaultVariants = variants.find(({ name }) => name === "default");
    const defaultOptions = options.find(({ name }) => name === "default");

    try {
      const product = await db.$transaction(
        async (tx) => {
          /**
           * Delete all variants that are removed and not present in payload.variants
           */
          await tx.productVariants.deleteMany({
            where: {
              store: ctx.store,
              name: {
                not: "default",
              },
              productId: id,
              id: {
                notIn: variantsIds as string[],
              },
            },
          });

          /**
           * Delete all options that are removed and not present in payload.options
           */
          await tx.productOption.deleteMany({
            where: {
              store: ctx.store,
              productId: id,
              name: {
                not: "default",
              },
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
            await tx.productOption.update({
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
            if (defaultVariants) {
              await tx.productVariants.delete({
                where: {
                  id: defaultVariants?.id,
                  productId: id,
                  name: "default",
                },
              });
            }

            await tx.productVariants.createMany({
              data: variantsToCreate.map((variant) => ({
                ...variant,
                productId: id as string,
                store: ctx.store,
              })),
            });
          }

          if (optionsToCreate.length) {
            if (defaultOptions) {
              await tx.productOption.delete({
                where: {
                  id: defaultOptions?.id,
                  productId: id,
                  name: "default",
                },
              });
            }

            await tx.productOption.createMany({
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

          if (
            defaultVariants &&
            defaultOptions &&
            !variantsToCreate.length &&
            !optionsToCreate.length
          ) {
            await tx.productVariants.update({
              where: {
                productId: id,
                id: defaultVariants.id,
                store: ctx.store,
              },
              data: {
                name: defaultVariants.name,
                updatedAt: new Date(),
              },
            });

            await tx.productOption.update({
              where: {
                productId: id,
                id: defaultOptions.id,
                store: ctx.store,
              },
              data: {
                name: defaultOptions.name,
                price: formatter.number(price ?? ""),
                originalPrice: formatter.number(originalPrice ?? ""),
                quantity: quantity,
                sku: sku,
                updatedAt: new Date(),
              },
            });
          }

          if (
            !defaultOptions &&
            !defaultVariants &&
            !variantsToUpdate.length &&
            !variantsToCreate.length &&
            price
          ) {
            await tx.productVariants.create({
              data: {
                name: "default",
                store: ctx.store,
                productId: String(id),
                values: ["default"],
              },
            });

            await tx.productOption.create({
              data: {
                name: "default",
                store: ctx.store,
                productId: String(id),
                price: formatter.number(price),
                originalPrice: formatter.number(originalPrice ?? ""),
                quantity,
                sku,
              },
            });
          }

          const result = await tx.product.update({
            where: { id, store: ctx.store },
            data: {
              ...payload,
              updatedAt: new Date(),
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
        },
        {
          maxWait: 20000,
          timeout: 60000,
        },
      );

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
