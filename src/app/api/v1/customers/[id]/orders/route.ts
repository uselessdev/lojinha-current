import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiCors } from "~/lib/api/cors";
import { ApiError, ApiErrorFromSchema, RaiseApiError } from "~/lib/api/errors";
import { transformOrderResponse } from "~/lib/api/transforms";
import { db } from "~/lib/database";
import { type ProductOption } from "@prisma/client";

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
          price: true,
          quantity: true,
          option: true,
          product: {
            include: {
              collections: true,
              images: true,
            },
          },
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

// function getOrderStatus(status: OrderStatus) {
//   switch (status) {
//     case "CREATED":
//       return `Aguardando Pagamento.`;
//     default:
//       break;
//   }
// }

export async function POST(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));
  const payload = orderSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  try {
    const { data } = payload;
    const isNotUsingCartId =
      !data.id && data.products && data.products?.length > 0;

    let price = 0;
    let products: ProductOption[] = [];

    if (isNotUsingCartId) {
      const requested = data.products.map(async ({ id, quantity }) => {
        const product = await db.productOption.findFirst({
          where: {
            id,
            store,
            quantity: { gte: quantity },
            product: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
        });

        if (!product) {
          return null;
        }

        return {
          ...product,
          quantity,
          price: quantity * Number(product.price ?? 0),
        };
      });

      products = (await Promise.all(requested)).filter(Boolean);

      if (products.length <= 0) {
        throw new RaiseApiError({
          code: "INSUFFICIENT_PRODUCTS",
          status: 422,
          error: `The requested quantity is not available.`,
        });
      }

      products.map(async (product) => {
        await db.productOption.update({
          where: {
            id: product.id,
          },
          data: {
            quantity: {
              decrement: product.quantity ?? 0,
            },
            updatedAt: new Date(),
          },
        });
      });

      price = products.reduce((value, product) => {
        return (value += Number(product.price ?? 0));
      }, 0);
    }

    let order = await db.order.upsert({
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
              optionId: product.id,
              price: product.price ?? 0,
              quantity: product.quantity ?? 0,
              productId: product.productId,
            })),
          },
        },
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
      where: {
        store,
        id: String(data.id),
      },
      include: {
        products: {
          select: {
            price: true,
            quantity: true,
            option: true,
            product: {
              include: {
                collections: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (data.address) {
      order = await db.order.update({
        where: {
          store,
          id: order.id,
        },
        data: {
          address: {
            connect: {
              id: data.address,
            },
          },
        },
        include: {
          products: {
            select: {
              price: true,
              quantity: true,
              option: true,
              product: {
                include: {
                  collections: true,
                  images: true,
                },
              },
            },
          },
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
