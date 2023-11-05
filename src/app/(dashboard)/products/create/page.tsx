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

  return <CreateProductForm collections={collections} />;
}
