import { NextResponse } from "next/server";
import { db } from "~/lib/database";

export async function GET(request: Request) {
  const store = String(request.headers.get("X-Store-ID"));

  const collections = await db.collection.findMany({
    where: {
      store,
      deletedAt: null,
    },
    include: {
      images: true,
      _count: true,
    },
  });

  const total = await db.collection.count({
    where: {
      store,
      deletedAt: null,
    },
  });

  return NextResponse.json({ collections, total });
}
