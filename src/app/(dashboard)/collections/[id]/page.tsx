import { auth } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/lib/database";
import { UpdateCollectionForm } from "../components/update-collection-form";

type Props = {
  params: {
    id: string;
  };
};

/**
 * @todo can restore collection from edit page
 */
export default async function CollectionPage({ params }: Props) {
  const { orgId } = auth();

  const collection = await db.collection.findFirst({
    where: {
      id: params.id,
      store: String(orgId),
    },
    include: {
      parents: true,
      images: true,
    },
  });

  const collections = await db.collection.findMany({
    where: {
      store: String(orgId),
      NOT: {
        id: {
          equals: params.id,
        },
      },
    },
  });

  if (!collection) {
    return notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{collection.name}</CardTitle>
        <CardDescription>#{collection.id}</CardDescription>
      </CardHeader>

      <CardContent>
        <UpdateCollectionForm
          collection={collection}
          collections={collections}
        />
      </CardContent>
    </Card>
  );
}
