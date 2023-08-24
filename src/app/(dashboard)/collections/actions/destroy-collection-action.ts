"use server";

import { type Collection } from "@prisma/client";
import { type Schema, schema } from "../schema";
import { db } from "~/lib/database";
import { utapi } from "uploadthing/server";

export async function destroyCollectionAction(
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

    const collection = await db.collection.delete({
      where: {
        id,
        store,
      },
      include: {
        images: true,
      },
    });

    if (collection) {
      await db.event.create({
        data: {
          action: "DELETE_COLLECTION",
          payload: payload,
          store,
          user,
        },
      });

      if (collection.images.length > 0) {
        await db.image.deleteMany({
          where: {
            id: {
              in: collection.images.map(({ id }) => id),
            },
          },
        });

        await utapi.deleteFiles(collection.images.map(({ key }) => key));
      }
    }

    return { status: "success" };
  } catch (error) {
    return { status: "error", error: (error as Error).message };
  }
}
