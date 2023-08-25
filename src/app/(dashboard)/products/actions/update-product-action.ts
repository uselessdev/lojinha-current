"use server";

import { revalidatePath } from "next/cache";
import { formatter } from "~/lib/utils";
import { type ProductSchema, productSchema } from "../schema";
import { type ActionReturnType } from "~/lib/use-action";
import { type Product } from "@prisma/client";
import { db } from "~/lib/database";

export async function updateProductAction(
  data: ProductSchema,
): ActionReturnType<Product> {
  const input = productSchema.safeParse(data);

  if (!input.success) {
    return {
      status: "error",
      error:
        `${input.error.issues.at(0)?.path.join(".")}: "${input.error.issues.at(
          0,
        )?.message}"` ?? "",
    };
  }

  try {
    const { user, store, id, ...data } = input.data;

    const product = await db.product.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        originalPrice: formatter.number(data.description ?? ""),
        price: formatter.number(data.price ?? ""),
        quantity: data.quantity,
        sku: data.sku,
        status: data.status,
        collections: {
          set: data.collections.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
    });

    if (product) {
      await db.event.create({
        data: {
          action: "UPDATE_PRODUCT",
          payload: data,
          store,
          user,
        },
      });
    }

    revalidatePath("/products");

    return { status: "success", data: product };
  } catch (error) {
    return { status: "error", error: (error as Error).message };
  }
}
