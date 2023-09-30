import { auth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCustomerOrders } from "../customers/[id]/orders/components/list-customer-orders-table";

export default async function OrdersPage() {
  const { orgId } = auth();

  const results = await db.order.findMany({
    where: {
      store: String(orgId),
      status: {
        not: "PENDING",
      },
    },
    include: {
      address: true,
      customer: true,
      products: {
        select: {
          quantity: true,
          product: true,
        },
      },
    },
  });

  const orders = results.map((order) => ({
    ...order,
    products: order.products.map(({ product, quantity }) => ({
      ...product,
      order: {
        quantity,
        price: Number(product.price ?? 0) * quantity,
      },
    })),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
      </CardHeader>

      {orders.length <= 0 ? (
        <CardContent>
          <p className="text-xs text-gray-500">
            Você ainda não tem nenhum pedido.
          </p>
        </CardContent>
      ) : null}

      {orders.length > 0 ? <ListCustomerOrders orders={orders} /> : null}
    </Card>
  );
}
