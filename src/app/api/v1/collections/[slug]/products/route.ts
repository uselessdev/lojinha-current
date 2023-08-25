import { NextResponse } from "next/server";
import { db } from "~/lib/database";

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));

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
          slug: params.slug,
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
          slug: params.slug,
        },
      },
    },
  });

  return NextResponse.json({ products, total });
}
