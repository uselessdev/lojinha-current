"use server";

import { type Product } from "@prisma/client";
import { type Schema, schema } from "../schema";
import { type ActionReturnType } from "~/lib/use-action";
import { db } from "~/lib/database";
import { utapi } from "uploadthing/server";

export async function destroyProductAction(
  data: Schema,
): ActionReturnType<Product> {
  const payload = schema.safeParse(data);

  if (!payload.success) {
    return {
      status: "error",
      error:
        `${payload.error.issues
          .at(0)
          ?.path.join(".")}: "${payload.error.issues.at(0)?.message}"` ?? "",
    };
  }

  try {
    const product = await db.product.delete({
      where: {
        id: payload.data.id,
      },
      include: {
        images: true,
      },
    });

    if (product) {
      await db.event.create({
        data: {
          payload: { id: payload.data.id },
          user: payload.data.user,
          store: product.store,
          action: "DELETE_PRODUCT",
        },
      });

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
    }

    return { status: "success", data: product };
  } catch (err) {
    return { status: "error", error: (err as Error).message };
  }
}
