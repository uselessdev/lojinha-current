import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiCors } from "~/lib/api/cors";
import { ApiError, ApiErrorFromSchema, RaiseApiError } from "~/lib/api/errors";
import { transformOrderResponse } from "~/lib/api/transforms";
import { db } from "~/lib/database";

export function OPTIONS() {
  return ApiCors();
}

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));

  const orders = await db.order.findMany({
    where: {
      store,
      status: {
        not: "PENDING",
      },
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

  const total = await db.order.count({
    where: {
      store,
      status: {
        not: "PENDING",
      },
      customer: {
        OR: [{ id: params.id }, { externalId: params.id }],
      },
    },
  });

  return NextResponse.json({
    orders: orders.map(transformOrderResponse),
    total,
  });
}

const updateOrderSchema = z.object({
  id: z.string().uuid(),
  address: z.string().uuid().optional(),
  products: z.undefined(),
});

const createOrderSchema = z.object({
  id: z.undefined(),
  address: z.string().uuid().optional(),
  products: z
    .array(
      z.object({
        id: z.string().uuid(),
        quantity: z.preprocess(
          (value) => Number(value),
          z.number().min(0).max(999),
        ),
      }),
    )
    .default([]),
});

const orderSchema = z.union([updateOrderSchema, createOrderSchema]);

export async function POST(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));
  const payload = orderSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  try {
    let price = 0;
    let products: { id: string; quantity: number; price: number }[] = [];

    if (
      !payload.data.id &&
      payload.data.products &&
      payload.data.products.length > 0
    ) {
      const results = payload.data.products.map(async (requested) => {
        const result = await db.product.findFirst({
          where: {
            store,
            status: "ACTIVE",
            deletedAt: null,
            id: requested.id,
            quantity: {
              gte: requested.quantity,
            },
          },
          select: {
            id: true,
            quantity: true,
            price: true,
          },
        });

        if (!result) {
          return null;
        }

        return {
          ...result,
          quantity: requested.quantity,
          price: requested.quantity * (result.price ?? 0),
        };
      });

      products = (await Promise.all(results)).filter(Boolean);

      if (!products.length) {
        throw new RaiseApiError({
          code: "INSUFFICIENT_PRODUCTS",
          error: `The requested quantity is not available`,
          status: 422,
        });
      }

      payload.data.products.map(async (product) => {
        await db.product.update({
          where: {
            id: product.id,
          },
          data: {
            quantity: {
              decrement: product.quantity,
            },
          },
        });
      });

      price = products.reduce((value, product) => {
        if (product.price) {
          return (value += product.price);
        }

        return value;
      }, 0);
    }

    let order = await db.order.upsert({
      where: {
        id: payload.data.id ?? "",
      },
      update: {
        updatedAt: new Date(),
        status: "CREATED",
        customer: {
          connect: {
            id: params.id,
          },
        },
      },
      create: {
        store,
        price,
        status: "CREATED",
        customer: {
          connect: {
            id: params.id,
          },
        },
        products: {
          createMany: {
            data: products.map((product) => ({
              productId: product.id,
              quantity: product.quantity,
            })),
          },
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

    if (payload.data.address) {
      order = await db.order.update({
        where: {
          id: order.id,
        },
        data: {
          address: {
            connect: {
              id: payload.data.address,
            },
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
    }

    if (order) {
      await db.event.create({
        data: {
          action: "UPDATE_ORDER",
          payload: { ...payload.data, status: "CREATED" },
          user: `client-store:${store}`,
          store,
        },
      });
    }

    return NextResponse.json(
      { order: transformOrderResponse(order) },
      { status: 201 },
    );
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}
