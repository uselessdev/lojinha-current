"use server";

import { env } from "process";
import { z } from "zod";
import { db } from "~/lib/database";
import { type ActionReturnType } from "~/lib/use-action";

async function createApiKey(store: string) {
  const unkey = await fetch(`${env.UNKEY_APP_URL}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UNKEY_APP_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prefix: "pk",
      byteLength: 32,
      meta: {
        // @todo create write mode for secret keys
        mode: "read",
        // @todo allow named keys
        name: "default",
      },
      apiId: env.UNKEY_APP_ID,
      ownerId: store,
    }),
    cache: "no-store",
  });

  const result = (await unkey.json()) as { keyId: string; key: string };
  return result as { key: string };
}

const schema = z.object({
  store: z.string().min(1, "ID da loja é inválido"),
  user: z.string().min(1, "ID do usuário é inválido"),
});

export async function createApiKeyAction(
  data: z.infer<typeof schema>,
): ActionReturnType<string> {
  const input = schema.safeParse(data);

  if (!input.success) {
    const errors = input.error.issues.map(({ message }) => message);
    return { status: "error", error: errors[0] };
  }

  try {
    const key = await createApiKey(input.data.store);

    if (key) {
      await db.event.create({
        data: {
          action: "CREATE_KEY",
          payload: input.data,
          user: input.data.user,
          store: input.data.store,
        },
      });
    }

    return { status: "success", data: key.key };
  } catch (err) {
    return { status: "error", error: (err as Error).message };
  }
}
