import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { UpdateProductForm } from "../components/update-product-form";
import { auth } from "@clerk/nextjs";
import { db } from "~/lib/database";
import { notFound } from "next/navigation";

type Props = {
  params: {
    id: string;
  };
};

export default async function ProductPage({ params }: Props) {
  const { orgId } = auth();

  const collections = await db.collection.findMany({
    where: {
      store: String(orgId),
      deletedAt: null,
    },
  });

  const product = await db.product.findFirst({
    where: {
      id: params.id,
      store: String(orgId),
    },
    include: {
      collections: true,
      images: true,
    },
  });

  if (!product) {
    return notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>#{product.id}</CardDescription>
      </CardHeader>

      <CardContent>
        <UpdateProductForm product={product} collections={collections} />
      </CardContent>
    </Card>
  );
}
