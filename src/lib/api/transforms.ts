import { type Order, type Product, type ProductOption } from "@prisma/client";

type OrderOriginalResponse = Order & {
  products: Array<{
    price: number;
    quantity: number;
    option: ProductOption;
    product: Product;
  }>;
};

export function transformOrderResponse(order: OrderOriginalResponse) {
  const { products, ...cart } = order;

  const apply = products.map(({ product, option, price, quantity }) => ({
    ...product,
    option: {
      ...option,
      order: {
        quantity,
        price,
      },
    },
  }));

  const groups = apply.reduce(
    (group, product) => {
      const { id, option, ...tail } = product;

      if (!group[id]) {
        group[id] = { id, ...tail, options: [] };
      }

      group[id].options.push(option);

      return group;
    },
    {} as Record<string, Product & { options: ProductOption[] }>,
  );

  return { ...cart, products: Object.values(groups) };
}
