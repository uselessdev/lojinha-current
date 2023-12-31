import { auth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCustomerOrders } from "../customers/[id]/orders/components/list-customer-orders-table";

export default async function OrdersPage() {
  const { orgId } = auth();

  const orders = await db.order.findMany({
    where: {
      store: String(orgId),
      status: {
        not: "PENDING",
      },
    },
    orderBy: {
      createdAt: "desc",
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
              variants: true,
            },
          },
        },
      },
      customer: true,
    },
  });

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
