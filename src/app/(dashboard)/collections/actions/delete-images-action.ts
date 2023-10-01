"use server";

import { utapi } from "uploadthing/server";
import { z } from "zod";
import { createServerAction } from "~/lib/actions/create-action";
import { db } from "~/lib/database";

export const deleteImagesAction = createServerAction({
  schema: z.object({
    key: z.string().min(1, "Image key is required"),
    id: z.string().uuid("Image ID is required"),
  }),
  handler: async (payload, ctx) => {
    try {
      const result = await utapi.deleteFiles(payload.key);

      if (result) {
        await db.image.delete({
          where: {
            id: payload.id,
            store: ctx.store,
          },
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
