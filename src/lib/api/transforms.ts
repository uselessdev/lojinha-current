import { type Order, type Product } from "@prisma/client";

type OrderOriginalResponse = Order & {
  products: Array<{
    product: Product;
    quantity: number;
  }>;
};

export function transformOrderResponse(order: OrderOriginalResponse) {
  return {
    ...order,
    products: order.products.map(({ product, quantity }) => ({
      ...product,
      order: {
        quantity,
        price: Number(product.price ?? 0) * quantity,
      },
    })),
  };
}
