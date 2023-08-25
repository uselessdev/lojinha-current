import { auth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/lib/database";
import { StoreSettingsForm } from "./components/store-settings-form";

export default async function SettingsPage() {
  const { orgId } = auth();

  const store = await db.store.findFirst({
    where: {
      store: String(orgId),
    },
    include: {
      emails: {
        select: {
          address: true,
        },
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
      </CardHeader>

      <CardContent>
        <StoreSettingsForm store={store} />
      </CardContent>
    </Card>
  );
}
