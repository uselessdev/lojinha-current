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
      variants: true,
      options: true,
    },
  });

  if (!product) {
    return notFound();
  }

  return <UpdateProductForm product={product} collections={collections} />;
}
