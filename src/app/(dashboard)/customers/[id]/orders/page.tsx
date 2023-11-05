import { auth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCustomerOrders } from "./components/list-customer-orders-table";

type Props = {
  params: {
    id: string;
  };
};

export default async function OrdersPage({ params }: Props) {
  const { orgId } = auth();

  const orders = await db.order.findMany({
    where: {
      store: String(orgId),
      customerId: params.id,
      status: {
        not: "PENDING",
      },
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
          <p className="text-xs text-zinc-500">
            Este cliente ainda não tem nenhum pedido realizado.
          </p>
        </CardContent>
      ) : null}

      {orders.length > 0 ? <ListCustomerOrders orders={orders} /> : null}
    </Card>
  );
}
