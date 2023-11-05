import { NextResponse } from "next/server";
import { ApiError } from "~/lib/api/errors";
import { db } from "~/lib/database";

type Params = {
  params: {
    id: string;
  };
};

/** @todo use omit to remove store */
function omit<T extends Record<string, unknown>, K extends keyof T>(
  keys: K[],
  model: T,
): Omit<T, K> {
  // @ts-expect-error return
  return Object.fromEntries(
    // @ts-expect-error key
    Object.entries(model).filter(([key]) => !keys.includes(key)),
  );
}

export async function GET(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));

  const customer = await db.customer.findFirst({
    where: {
      stores: {
        has: store,
      },
      OR: [{ id: params.id }, { externalId: params.id }],
    },
  });

  if (!customer) {
    return ApiError({
      code: "NOT_FOUND",
      error: `Can't find the customer`,
      status: 404,
    });
  }

  return NextResponse.json({ customer: omit(["stores"], customer) });
}
