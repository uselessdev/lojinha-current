import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "@clerk/nextjs";
import { db } from "~/lib/database";
import { CreateProductForm } from "../components/create-product-form";

export default async function CreateProductPage() {
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
        <CardTitle>Novo Produto</CardTitle>
      </CardHeader>

      <CardContent>
        <CreateProductForm collections={collections} />
      </CardContent>
    </Card>
  );
}
