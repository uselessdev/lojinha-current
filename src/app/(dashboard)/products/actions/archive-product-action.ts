"use server";

import { type Product } from "@prisma/client";
import { type Schema, schema } from "../schema";
import { type ActionReturnType } from "~/lib/use-action";
import { db } from "~/lib/database";

export async function archiveProductAction(
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
    const product = await db.product.update({
      where: {
        id: payload.data.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (product) {
      await db.event.create({
        data: {
          payload: { id: payload.data.id },
          user: payload.data.user,
          store: product.store,
          action: "ARCHIVE_PRODUCT",
        },
      });
    }

    return { status: "success", data: product };
  } catch (err) {
    return { status: "error", error: (err as Error).message };
  }
}
