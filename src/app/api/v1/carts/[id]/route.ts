import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "~/lib/api/errors";
import { transformOrderResponse } from "~/lib/api/transforms";
import { db } from "~/lib/database";

const cartParams = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export async function GET(
  request: Request,
  { params }: z.infer<typeof cartParams>,
) {
  const store = String(request.headers.get("X-Store-ID"));

  const cart = await db.order.findFirst({
    where: {
      store,
      id: params.id,
      status: "PENDING",
      deletedAt: null,
    },
    include: {
      products: {
        select: {
          product: true,
          quantity: true,
        },
      },
    },
  });

  if (!cart) {
    return ApiError({
      code: "NOT_FOUND",
      error: `Can't find any cart with id ${params.id}`,
      status: 404,
    });
  }

  return NextResponse.json({ cart: transformOrderResponse(cart) });
}
