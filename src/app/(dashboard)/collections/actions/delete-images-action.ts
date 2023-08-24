"use server";

import { utapi } from "uploadthing/server";
import { db } from "~/lib/database";
import { type ActionReturnType } from "~/lib/use-action";

export async function deleteImagesAction({
  key,
  id,
  store,
}: {
  key: string;
  id: string;
  store: string;
  // @ts-expect-error action return type
}): ActionReturnType<string> {
  try {
    const result = await utapi.deleteFiles(key);

    if (result.success) {
      await db.image.delete({
        where: {
          id,
          key,
          store,
        },
      });
    }

    return { status: "success", data: "Imagem deletada" };
  } catch (err) {
    console.error(`failed to delete image "${key}":`, err);
    return { status: "error", error: (err as Error).message };
  }
}
