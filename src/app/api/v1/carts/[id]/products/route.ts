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
    const cart = await db.$transaction(
      async (tx) => {
        const cartExists = await tx.order.findFirst({
          where: {
            store,
            id: params.id,
            status: "PENDING",
            deletedAt: null,
          },
        });

        if (!cartExists) {
          throw new RaiseApiError({
            code: "NOT_FOUND",
            error: `Can't find any cart with id ${params.id}`,
            status: 404,
          });
        }

        const result = await tx.product.findFirst({
          where: {
            store,
            status: "ACTIVE",
            deletedAt: null,
            id: payload.data.id,
            quantity: {
              gte: payload.data.quantity,
            },
          },
          select: {
            id: true,
            price: true,
          },
        });

        if (!result) {
          throw new RaiseApiError({
            code: "INSUFFICIENT_PRODUCTS",
            error: `The requested quantity is not available`,
            status: 422,
          });
        }

        const product = {
          ...result,
          quantity: payload.data.quantity,
          price: payload.data.quantity * (result.price ?? 0),
        };

        const productInCart = await tx.orderProduct.findFirst({
          where: {
            orderId: params.id,
            productId: product.id,
          },
          select: {
            productId: true,
            quantity: true,
          },
        });

        if (productInCart) {
          await tx.orderProduct.update({
            where: {
              productId_orderId: {
                orderId: params.id,
                productId: product.id,
              },
            },
            data: {
              quantity: productInCart.quantity + product.quantity,
            },
          });
        }

        if (!productInCart) {
          await tx.orderProduct.create({
            data: {
              orderId: params.id,
              productId: product.id,
              quantity: product.quantity,
            },
          });
        }

        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            quantity: {
              decrement: product.quantity,
            },
            updatedAt: new Date(),
          },
        });

        const productsInCart = await tx.orderProduct.findMany({
          where: {
            orderId: params.id,
          },
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                price: true,
              },
            },
          },
        });

        const price = productsInCart.reduce((value, { quantity, product }) => {
          if (product.price) {
            return (value += product.price * quantity);
          }

          return value;
        }, 0);

        const cart = await tx.order.update({
          where: {
            id: params.id,
          },
          data: {
            price,
            updatedAt: new Date(),
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

    return NextResponse.json({ cart: transformOrderResponse(cart) });
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}
