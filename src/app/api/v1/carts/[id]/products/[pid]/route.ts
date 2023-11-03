import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiCors } from "~/lib/api/cors";
import { ApiError, ApiErrorFromSchema, RaiseApiError } from "~/lib/api/errors";
import { transformOrderResponse } from "~/lib/api/transforms";
import { db } from "~/lib/database";

export function OPTIONS() {
  return ApiCors();
}

const cartParams = z.object({
  params: z.object({
    pid: z.string().uuid(),
    id: z.string().uuid(),
  }),
});

export async function DELETE(
  request: Request,
  { params }: z.infer<typeof cartParams>,
) {
  const store = String(request.headers.get("X-Store-ID"));

  try {
    const cart = await db.$transaction(
      async (tx) => {
        const exists = await tx.order.findFirst({
          where: {
            store,
            id: params.id,
            status: "PENDING",
            deletedAt: null,
            products: {
              some: {
                optionId: params.pid,
              },
            },
          },
        });

        if (!exists) {
          throw new RaiseApiError({
            code: "NOT_FOUND",
            error: `Cart or product not found`,
            status: 404,
          });
        }

        const option = await tx.productOption.findFirst({
          where: {
            id: params.pid,
          },
        });

        const product = await tx.orderProduct.delete({
          where: {
            productId_orderId_optionId: {
              orderId: params.id,
              optionId: params.pid,
              productId: option?.productId as string,
            },
          },
          select: {
            quantity: true,
          },
        });

        await tx.productOption.update({
          where: {
            id: params.pid,
          },
          data: {
            quantity: {
              increment: product.quantity,
            },
            updatedAt: new Date(),
          },
        });

        const products = await tx.orderProduct.findMany({
          where: {
            orderId: params.id,
          },
          select: {
            quantity: true,
            price: true,
          },
        });

        if (products.length <= 0) {
          await tx.order.delete({
            where: {
              id: params.id,
            },
          });

          return null;
        }

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
            payload: { cart: params.id, product: params.pid },
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

    if (!cart) {
      return new Response(null, {
        status: 204,
      });
    }

    return NextResponse.json({ cart: transformOrderResponse(cart) });
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}

const cartProductUpdateSchema = z.object({
  quantity: z.preprocess((value) => Number(value), z.number().min(0).max(999)),
});

export async function PATCH(
  request: Request,
  { params }: z.infer<typeof cartParams>,
) {
  const store = String(request.headers.get("X-Store-ID"));
  const payload = cartProductUpdateSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  try {
    const { data } = payload;

    const cart = await db.$transaction(
      async (tx) => {
        const cartExists = await tx.order.findFirst({
          where: {
            id: params.id,
            status: "PENDING",
            deletedAt: null,
            store,
            products: {
              some: {
                optionId: params.pid,
              },
            },
          },
        });

        if (!cartExists) {
          throw new RaiseApiError({
            code: "NOT_FOUND",
            error: `Cart or product not found`,
            status: 404,
          });
        }

        const productOption = await tx.productOption.findFirst({
          where: {
            store,
            id: params.pid,
          },
          select: {
            id: true,
            quantity: true,
            price: true,
          },
        });

        if (!productOption) {
          throw new RaiseApiError({
            code: "NOT_FOUND",
            error: `Can't find the product`,
            status: 404,
          });
        }

        const optionProductInCart = await tx.orderProduct.findFirst({
          where: {
            orderId: params.id,
            optionId: params.pid,
          },
          select: {
            productId: true,
            quantity: true,
          },
        });

        if (data.quantity === Number(optionProductInCart?.quantity)) {
          return "UNCHANGED";
        }

        const delta = data.quantity - Number(optionProductInCart?.quantity);

        if (delta > Number(productOption.quantity)) {
          throw new RaiseApiError({
            code: "INSUFFICIENT_PRODUCTS",
            error: `The requested quantity is unavailable`,
            status: 422,
          });
        }

        if (data.quantity <= 0) {
          await tx.orderProduct.delete({
            where: {
              productId_orderId_optionId: {
                optionId: params.pid,
                orderId: params.id,
                productId: optionProductInCart?.productId as string,
              },
            },
          });
        }

        if (data.quantity > 0) {
          await tx.orderProduct.update({
            where: {
              productId_orderId_optionId: {
                orderId: params.id,
                optionId: params.pid,
                productId: optionProductInCart?.productId as string,
              },
            },
            data: {
              price: {
                set: data.quantity * Number(productOption.price ?? 0),
              },
              quantity: {
                set: data.quantity,
              },
            },
          });
        }

        await tx.productOption.update({
          where: {
            store,
            id: params.pid,
          },
          data: {
            quantity: {
              decrement: delta,
            },
            updatedAt: new Date(),
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

        if (products.length <= 0) {
          await tx.order.delete({
            where: {
              id: params.id,
            },
          });

          return `REMOVED`;
        }

        const price = products.reduce((value, { price }) => {
          return (value += price);
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
            payload: { ...data, cart: params.id, product: params.pid },
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

    if (cart === "REMOVED") {
      return new Response(null, {
        status: 204,
      });
    }

    if (cart === "UNCHANGED") {
      return new Response(null, {
        status: 304,
      });
    }

    return NextResponse.json({
      cart: transformOrderResponse(cart),
    });
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}
