"use server";

import { z } from "zod";
import { env } from "~/env.mjs";
import { db } from "~/lib/database";
import { type ActionReturnType } from "~/lib/use-action";

async function revokeKey(key: string) {
  try {
    await fetch(`${env.UNKEY_APP_URL}/keys/${key}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env.UNKEY_APP_KEY}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new Error((err as Error).message);
  }
}

const revokeSchema = z.object({
  store: z.string().min(1, "ID da loja é inválido"),
  user: z.string().min(1, "ID do usuário é inválido"),
  key: z.string().min(1, "ID da chave é inválida"),
});

export async function revokeApiKeyAction(
  data: z.infer<typeof revokeSchema>,
): ActionReturnType<string> {
  const input = revokeSchema.safeParse(data);

  if (!input.success) {
    const errors = input.error.issues.map(({ message }) => message);
    return { status: "error", error: errors[0] };
  }

  try {
    await revokeKey(input.data.key);

    await db.event.create({
      data: {
        action: "REVOKE_KEY",
        payload: input.data,
        user: input.data.user,
        store: input.data.store,
      },
    });

    return { status: "success" };
  } catch (err) {
    return { status: "error", error: (err as Error).message };
  }
}
