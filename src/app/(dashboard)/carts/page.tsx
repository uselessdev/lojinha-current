import { auth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCarts } from "./components/list-carts-table";

export default async function CartsPage() {
  const { orgId } = auth();

  const carts = await db.order.findMany({
    where: {
      store: String(orgId),
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      products: {
        select: {
          product: true,
          quantity: true,
        },
      },
      customer: true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrinhos</CardTitle>
      </CardHeader>

      {carts.length <= 0 ? (
        <CardContent>
          <p className="text-sm text-zinc-600">Nenhum carrinho criado ainda.</p>
        </CardContent>
      ) : null}

      {carts.length > 0 ? (
        <ListCarts
          carts={carts.map(({ products, ...cart }) => ({
            ...cart,
            products: products.map(({ product, quantity }) => ({
              ...product,
              order: { quantity, price: Number(product.price ?? 0) * quantity },
            })),
          }))}
        />
      ) : null}
    </Card>
  );
}
