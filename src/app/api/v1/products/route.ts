import { NextResponse } from "next/server";
import { db } from "~/lib/database";

export async function GET(request: Request) {
  const store = String(request.headers.get("X-Store-ID"));

  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection");

  const products = await db.product.findMany({
    where: {
      store,
      deletedAt: null,
      status: {
        notIn: ["DISABLED", "DRAFT", "VALIDATION"],
      },
      collections: {
        some: {
          deletedAt: null,
          slug: collection ?? undefined,
        },
      },
    },
    include: {
      images: true,
      collections: true,
      _count: true,
    },
  });

  const total = await db.product.count({
    where: {
      store,
      deletedAt: null,
      status: {
        notIn: ["DISABLED", "DRAFT", "VALIDATION"],
      },
      collections: {
        some: {
          deletedAt: null,
          slug: collection ?? undefined,
        },
      },
    },
  });

  return NextResponse.json({ products, total });
}
