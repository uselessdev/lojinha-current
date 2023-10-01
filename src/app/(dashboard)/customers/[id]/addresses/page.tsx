import { auth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCustomerAddresses } from "./components/list-customer-addresses-table";

type Props = {
  params: {
    id: string;
  };
};

export default async function AddressesPage({ params }: Props) {
  const { orgId } = auth();

  const addresses = await db.address.findMany({
    where: {
      customerId: params.id,
      customer: {
        stores: {
          has: orgId,
        },
      },
    },
    include: {
      customer: true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereços</CardTitle>
        <CardDescription>
          Cliente: {addresses[0].customer.email}
        </CardDescription>
      </CardHeader>

      {addresses.length <= 0 ? (
        <CardContent>
          <p className="text-xs text-zinc-500">
            Este cliente ainda não cadastrou nenhum endereço.
          </p>
        </CardContent>
      ) : null}

      {addresses.length > 0 ? (
        <ListCustomerAddresses addresses={addresses} />
      ) : null}
    </Card>
  );
}
