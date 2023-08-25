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
import { ListProductsTable } from "./components/list-products-table";

export default async function ProductsPage() {
  const { orgId } = auth();

  const products = await db.product.findMany({
    where: {
      store: String(orgId),
    },
    include: {
      collections: true,
      orders: true,
      images: true,
    },
  });

  return (
    <Card className="pb-6">
      <CardHeader className="flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Os produtos da sua loja.</CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/products/create">Adicionar Produto</Link>
        </Button>
      </CardHeader>

      {products.length <= 0 ? (
        <CardContent>
          <p className="text-xs text-gray-500">Nenhum produto encontrado.</p>
        </CardContent>
      ) : null}

      {products.length > 0 ? <ListProductsTable products={products} /> : null}
    </Card>
  );
}
