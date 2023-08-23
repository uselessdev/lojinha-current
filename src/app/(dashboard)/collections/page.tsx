import { auth } from "@clerk/nextjs";
import Link from "next/link";
import { isEmpty } from "remeda";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/lib/database";

export default async function CollectionsPage() {
  const { orgId } = auth();

  const collections = await db.collection.findMany({
    where: {
      store: orgId as string,
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
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Coleções</CardTitle>
          <CardDescription>
            Coleções são utilizadas para agrupar produtos ou outras coleções.
          </CardDescription>
        </div>

        <Button asChild size="sm" className="whitespace-nowrap">
          <Link href="/collections/create">Adicionar Coleção</Link>
        </Button>
      </CardHeader>

      {isEmpty(collections) ? (
        <CardContent>
          <p className="text-xs text-gray-500">Nenhuma coleção encontrada.</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
