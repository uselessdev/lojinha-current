"use server";

import { createServerAction } from "~/lib/actions/create-action";
import { storeSchema } from "../schema";
import { db } from "~/lib/database";
import { revalidatePath } from "next/cache";

export const updateStoreAction = createServerAction({
  schema: storeSchema,
  handler: async ({ emails, ...payload }, ctx) => {
    try {
      const exclude = await db.email.findMany({
        where: {
          store: ctx.store,
          address: {
            notIn: emails,
          },
        },
        select: {
          id: true,
          address: true,
        },
      });

      const store = await db.store.upsert({
        where: {
          id: payload.id ?? "",
        },
        create: {
          ...payload,
          emails: {
            createMany: {
              data: emails.map((email) => ({
                address: email.trim(),
              })),
            },
          },
        },
        update: {
          name: payload.name,
          url: payload.url,
          emails: {
            createMany: {
              data: emails.map((email) => ({
                address: email.trim(),
              })),
              skipDuplicates: true,
            },
            deleteMany: exclude,
          },
        },
        include: {
          emails: true,
        },
      });

      if (store) {
        await db.event.create({
          data: {
            action: "UPDATE_STORE",
            payload: { emails, ...payload },
            user: ctx.user,
            store: ctx.store,
          },
        });
      }

      revalidatePath("/settings", "page");

      return { success: true, data: store };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});
