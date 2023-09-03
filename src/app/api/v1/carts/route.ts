import "@total-typescript/ts-reset";
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
  products: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.preprocess(
        (value) => Number(value),
        z.number().min(0).max(999),
      ),
    }),
  ),
});

export async function POST(request: Request) {
  const store = String(request.headers.get("X-Store-ID"));
  const payload = cartSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  const { data } = payload;

  try {
    const cart = await db.$transaction(
      async (tx) => {
        const foundedProducts = data.products.map(async (product) => {
          const p = await tx.product.findFirst({
            where: {
              store,
              status: "ACTIVE",
              deletedAt: null,
              id: product.id,
              quantity: {
                gte: product.quantity,
              },
            },
            select: {
              id: true,
              quantity: true,
              price: true,
            },
          });

          if (!p) {
            return null;
          }

          return {
            ...p,
            quantity: product.quantity,
            price: product.quantity * (p?.price ?? 0),
          };
        });

        const products = (await Promise.all(foundedProducts)).filter(Boolean);

        if (!products.length) {
          throw new RaiseApiError({
            code: "INSUFFICIENT_PRODUCTS",
            error: `The requested quantity is not available`,
            status: 422,
          });
        }

        const price = products.reduce((value, product) => {
          if (product.price) {
            return (value += product.price);
          }

          return value;
        }, 0);

        products.map(async (product) => {
          await tx.product.update({
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

        const cart = await tx.order.create({
          data: {
            store,
            price,
            products: {
              createMany: {
                data: products.map((product) => ({
                  productId: product.id,
                  quantity: Number(product.quantity),
                })),
              },
            },
          },
          include: {
            products: {
              select: {
                product: {
                  include: {
                    collections: true,
                    images: true,
                  },
                },
                quantity: true,
              },
            },
          },
        });

        await tx.event.create({
          data: {
            action: "CREATE_ORDER",
            payload: data,
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

    return NextResponse.json(
      { cart: transformOrderResponse(cart) },
      { status: 201 },
    );
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}
