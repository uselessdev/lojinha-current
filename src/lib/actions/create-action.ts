import { auth } from "@clerk/nextjs";
import { type z } from "zod";
import { db } from "../database";

export type Result<T> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function createServerAction<I, Output = void>(options: {
  schema: z.ZodSchema<I>;
  handler: (
    args: I,
    ctx: { user: string; store: string; wh?: string },
  ) => Promise<Result<Output>>;
}) {
  const { userId, orgId } = auth();

  return async (data: I) => {
    const payload = options.schema.safeParse(data);

    if (!payload.success) {
      return {
        success: false,
        error: payload.error.issues
          .map(({ message, path }) => `${String(path)}: ${message}`)
          .join(", "),
      };
    }

    const wh = await db.webhook.findFirst({
      where: {
        store: String(orgId),
      },
      select: {
        sid: true,
      },
    });

    return options.handler(payload.data, {
      store: String(orgId),
      user: String(userId),
      wh: wh?.sid,
    });
  };
}
