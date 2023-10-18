import { NextResponse } from "next/server";
import { db } from "~/lib/database";

export async function GET(request: Request) {
  const store = String(request.headers.get("X-Store-ID"));

  const products = await db.product.findMany({
    where: {
      store,
      deletedAt: null,
      status: {
        notIn: ["DISABLED", "DRAFT", "VALIDATION"],
      },
    },
    include: {
      images: true,
      collections: true,
      options: true,
      variants: true,
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
    },
  });

  return NextResponse.json({ products, total });
}
