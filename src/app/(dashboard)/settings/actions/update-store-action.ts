"use server";

import { type ActionReturnType } from "~/lib/use-action";
import { type StoreSchema, storeSchema } from "../schema";
import { type Store } from "@prisma/client";
import { db } from "~/lib/database";

export async function updateStoreAction(
  data: StoreSchema,
): ActionReturnType<Store> {
  const payload = storeSchema.safeParse(data);

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
    const emails = await db.email.findMany({
      where: {
        store: payload.data.id,
        address: {
          notIn: payload.data.emails,
        },
      },
      select: {
        id: true,
        address: true,
      },
    });

    const store = await db.store.upsert({
      where: {
        id: payload.data.id ?? "",
      },
      create: {
        cnpj: payload.data.cnpj,
        name: payload.data.name,
        store: payload.data.store,
        url: payload.data.url,
        emails: {
          createMany: {
            data: payload.data.emails.map((email) => ({
              address: email.trim(),
            })),
          },
        },
      },
      update: {
        name: payload.data.name,
        url: payload.data.url,
        emails: {
          createMany: {
            data: payload.data.emails.map((email) => ({
              address: email.trim(),
            })),
            skipDuplicates: true,
          },
          deleteMany: emails,
        },
      },
      include: {
        emails: true,
      },
    });

    return { status: "success", data: store };
  } catch (error) {
    return { status: "error", error: (error as Error).message };
  }
}
