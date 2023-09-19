import { NextResponse } from "next/server";
import { ApiError } from "~/lib/api/errors";
import { transformOrderResponse } from "~/lib/api/transforms";
import { db } from "~/lib/database";

type Params = {
  params: {
    oid: string;
    id: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));

  const order = await db.order.findFirst({
    where: {
      store,
      id: params.oid,
      customer: {
        OR: [{ id: params.id }, { externalId: params.id }],
      },
    },
    include: {
      products: {
        select: {
          product: true,
          quantity: true,
        },
      },
      address: true,
    },
  });

  if (!order) {
    return ApiError({
      code: "NOT_FOUND",
      error: `Can't find any order with id ${params.id}`,
      status: 404,
    });
  }

  return NextResponse.json({ order: transformOrderResponse(order) });
}
