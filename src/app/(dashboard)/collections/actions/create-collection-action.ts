"use server";

import { type ActionReturnType } from "~/lib/use-action";
import { collectionSchema, type CollectionSchema } from "../schema";
import { type Collection } from "@prisma/client";
import { db } from "~/lib/database";

export async function createCollectionAction(
  data: CollectionSchema,
  // @ts-expect-error actions has conflict with es5
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
    const { store, user, parents, ...data } = payload.data;

    const collection = await db.collection.create({
      data: {
        store,
        name: data.name,
        slug: data.slug,
        description: data.description,
        parents: {
          connect: parents?.map((id) => ({ id })),
        },
      },
    });

    if (collection) {
      await db.event.create({
        data: {
          user,
          store,
          action: "CREATE_COLLECTION",
          payload: data,
        },
      });
    }

    return { status: "success", data: collection };
  } catch (error) {
    console.error("create collection failed: ", error);
    return { status: "error", error: (error as Error).message };
  }
}