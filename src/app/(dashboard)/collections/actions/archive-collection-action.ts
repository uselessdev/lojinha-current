"use server";

import { type Collection } from "@prisma/client";
import { type Schema, schema } from "../schema";
import { db } from "~/lib/database";

export async function archiveCollectionAction(
  data: Schema,
  // @ts-expect-error action type
): ActionReturnType<Collection> {
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
    const { id, store, user } = payload.data;

    const collection = await db.collection.update({
      where: {
        id,
        store,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (collection) {
      await db.event.create({
        data: {
          action: "ARCHIVE_COLLECTION",
          payload: payload,
          store,
          user,
        },
      });
    }

    return { status: "success" };
  } catch (error) {
    return { status: "error", error: (error as Error).message };
  }
}
