"use server";

import { type ActionReturnType } from "~/lib/use-action";
import { collectionSchema, type CollectionSchema } from "../schema";
import { type Collection } from "@prisma/client";
import { db } from "~/lib/database";

export async function updateCollectionAction(
  data: CollectionSchema,
): ActionReturnType<Collection> {
  const payload = collectionSchema.safeParse(data);

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
    const { user, store, id, ...data } = payload.data;

    const collection = await db.collection.update({
      where: {
        id,
        store,
      },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parents: {
          set: data.parents?.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
    });

    if (collection) {
      await db.event.create({
        data: {
          action: "UPDATE_COLLECTION",
          payload: { ...data, id },
          user,
          store,
        },
      });
    }

    return { status: "success", data: collection };
  } catch (err) {
    console.error(`update collection failed: `, err);
    return { status: "error", error: (err as Error).message };
  }
}
