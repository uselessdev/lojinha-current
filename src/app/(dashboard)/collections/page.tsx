import { auth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/lib/database";
import { ListCollectionsTable } from "./components/list-collections-table";

export default async function CollectionsPage() {
  const { orgId, user, organization } = auth();

  console.log(
    ">> starting fetch collections: store: ",
    orgId,
    `${organization?.name}`,
    " user: ",
    user?.id,
  );

  const collections = await db.collection.findMany({
    where: {
      store: String(orgId),
    },
    include: {
      parents: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Coleções</CardTitle>
          <CardDescription>
            Coleções são utilizadas para agrupar produtos ou outras coleções.
          </CardDescription>
        </div>

        <Button asChild size="sm" className="whitespace-nowrap">
          <Link href="/collections/create">Adicionar Coleção</Link>
        </Button>
      </CardHeader>

      {collections.length <= 0 ? (
        <CardContent>
          <p className="text-xs text-gray-500">Nenhuma coleção encontrada.</p>
        </CardContent>
      ) : null}

      {collections.length > 0 ? (
        <ListCollectionsTable collections={collections} />
      ) : null}
    </Card>
  );
}
