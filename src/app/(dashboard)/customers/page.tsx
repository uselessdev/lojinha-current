import { auth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCustomers } from "./components/list-customers";

export default async function CustomersPage() {
  const { orgId: store } = auth();

  const customers = await db.customer.findMany({
    where: {
      stores: {
        has: store,
      },
    },
    include: {
      addresses: true,
      orders: true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
      </CardHeader>

      {customers.length <= 0 ? (
        <CardContent>
          <p className="text-xs text-zinc-500">
            Você ainda não tem nenhum cliente.
          </p>
        </CardContent>
      ) : null}

      {customers.length > 0 ? <ListCustomers customers={customers} /> : null}
    </Card>
  );
}
