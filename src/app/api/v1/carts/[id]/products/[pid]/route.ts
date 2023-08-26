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
        const cartExists = await tx.order.findFirst({
          where: {
            id: params.id,
            status: "PENDING",
            store,
            deletedAt: null,
            products: {
              some: {
                productId: params.pid,
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

        const product = await tx.orderProduct.delete({
          where: {
            productId_orderId: {
              orderId: params.id,
              productId: params.pid,
            },
          },
          select: {
            quantity: true,
          },
        });

        await tx.product.update({
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

        const cartProducts = await tx.order.findFirst({
          where: {
            id: params.id,
          },
          select: {
            products: {
              select: {
                quantity: true,
                product: true,
              },
            },
          },
        });

        if (!cartProducts?.products.length) {
          await tx.order.update({
            where: {
              id: params.id,
            },
            data: {
              deletedAt: new Date(),
            },
          });

          await tx.event.create({
            data: {
              action: "ARCHIVE_ORDER",
              payload: { id: params.id, product: params.pid },
              user: `client-store:${store}`,
              store,
            },
          });

          return null;
        }

        const price = cartProducts?.products.reduce(
          (value, { product, quantity }) => {
            if (product.price) {
              return (value += product.price * quantity);
            }

            return value;
          },
          0,
        );

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
                quantity: true,
                product: true,
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
                productId: params.pid,
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

        const product = await tx.product.findFirst({
          where: {
            id: params.pid,
          },
          select: {
            id: true,
            quantity: true,
            price: true,
          },
        });

        if (!product) {
          throw new RaiseApiError({
            code: "NOT_FOUND",
            error: `Can't find the product`,
            status: 404,
          });
        }

        const productInCart = await tx.orderProduct.findFirst({
          where: {
            orderId: params.id,
            productId: params.pid,
          },
          select: {
            quantity: true,
          },
        });

        if (data.quantity === Number(productInCart?.quantity)) {
          return "UNCHANGED";
        }

        const delta = data.quantity - Number(productInCart?.quantity);

        if (delta > Number(product.quantity)) {
          throw new RaiseApiError({
            code: "INSUFFICIENT_PRODUCTS",
            error: `The requested quantity is unavailable`,
            status: 422,
          });
        }

        if (data.quantity <= 0) {
          await tx.orderProduct.delete({
            where: {
              productId_orderId: {
                orderId: params.id,
                productId: params.pid,
              },
            },
          });
        }

        if (data.quantity > 0) {
          await tx.orderProduct.update({
            where: {
              productId_orderId: {
                orderId: params.id,
                productId: params.pid,
              },
            },
            data: {
              quantity: {
                set: data.quantity,
              },
            },
          });
        }

        await tx.product.update({
          where: {
            id: params.pid,
          },
          data: {
            quantity: {
              decrement: delta,
            },
            updatedAt: new Date(),
          },
        });

        const productsInCart = await tx.order.findFirst({
          where: {
            id: params.id,
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

        if (productsInCart?.products && productsInCart.products.length <= 0) {
          await tx.order.update({
            where: {
              id: params.id,
            },
            data: {
              deletedAt: new Date(),
            },
          });

          return "CART_REMOVED";
        }

        const price = productsInCart?.products.reduce(
          (value, { product, quantity }) => {
            if (product.price) {
              return (value += product.price * quantity);
            }

            return value;
          },
          0,
        );

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

    if (cart === "CART_REMOVED") {
      return new Response(null, {
        status: 204,
      });
    }

    if (cart === "UNCHANGED") {
      return new Response(null, {
        status: 304,
      });
    }

    return NextResponse.json({ cart: transformOrderResponse(cart) });
  } catch (error) {
    return ApiError(error as RaiseApiError);
  }
}
