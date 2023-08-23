import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CreateCollectionForm } from "../components/create-collection-form";
import { db } from "~/lib/database";
import { auth } from "@clerk/nextjs";

export default async function CreateCollectionPage() {
  const { orgId } = auth();

  const collections = await db.collection.findMany({
    where: {
      store: String(orgId),
      deletedAt: null,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Coleção</CardTitle>
      </CardHeader>

      <CardContent>
        <CreateCollectionForm collections={collections} />
      </CardContent>
    </Card>
  );
}
