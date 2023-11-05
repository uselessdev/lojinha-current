import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiCors } from "~/lib/api/cors";
import { ApiError, ApiErrorFromSchema, RaiseApiError } from "~/lib/api/errors";
import { transformOrderResponse } from "~/lib/api/transforms";
import { db } from "~/lib/database";

export function OPTIONS() {
  return ApiCors();
}

const cartSchema = z.object({
  id: z.string().uuid(),
  quantity: z.preprocess((value) => Number(value), z.number().min(0).max(999)),
});

const cartParams = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export async function POST(
  request: Request,
  { params }: z.infer<typeof cartParams>,
) {
  const store = String(request.headers.get("X-Store-ID"));
  const payload = cartSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  try {
    const { data } = payload;

    const cart = await db.$transaction(
      async (tx) => {
        const exists = await tx.order.findFirst({
          where: {
            store,
            id: params.id,
            status: "PENDING",
            deletedAt: null,
          },
        });

        if (!exists) {
          throw new RaiseApiError({
            code: "NOT_FOUND",
            error: `Can't find any cart with the id ${params.id}`,
            status: 404,
          });
        }

        const result = await tx.productOption.findFirst({
          where: {
            store,
            id: data.id,
            quantity: {
              gte: data.quantity,
            },
            product: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
          select: {
            id: true,
            price: true,
            productId: true,
          },
        });

        if (!result) {
          throw new RaiseApiError({
            code: "INSUFFICIENT_PRODUCTS",
            error: `The requested quantity is not available.`,
            status: 422,
          });
        }

        const product = {
          ...result,
          quantity: data.quantity,
          price: data.quantity * Number(result.price ?? 0),
        };

        await tx.productOption.update({
          where: {
            store,
            id: data.id,
          },
          data: {
            quantity: {
              decrement: data.quantity,
            },
            updatedAt: new Date(),
          },
        });

        await tx.orderProduct.upsert({
          create: {
            optionId: data.id,
            price: product.price,
            quantity: product.quantity,
            orderId: params.id,
            productId: product.productId,
          },
          update: {
            price: {
              increment: product.price,
            },
            quantity: {
              increment: product.quantity,
            },
          },
          where: {
            productId_orderId_optionId: {
              optionId: product.id,
              orderId: params.id,
              productId: product.productId,
            },
          },
        });

        const products = await tx.orderProduct.findMany({
          where: {
            orderId: params.id,
          },
          select: {
            optionId: true,
            price: true,
          },
        });

        const price = products.reduce((value, product) => {
          return (value += product.price);
        }, 0);

        const cart = await tx.order.update({
          where: {
            store,
            id: params.id,
          },
          data: {
            price,
            updatedAt: new Date(),
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

        await tx.event.create({
          data: {
            action: "UPDATE_ORDER",
            payload: { ...payload.data, id: params.id },
            user: `client-store:${store}`,
            store,
          },
        });

        return cart;
      },
      {
        maxWait: 20000,
        timeout: 60000,
      },
    );

    return NextResponse.json({
      cart: transformOrderResponse(cart),
    });
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}
