import { NextResponse } from "next/server";
import { ApiError } from "~/lib/api/errors";
import { db } from "~/lib/database";

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));

  const collection = await db.collection.findFirst({
    where: {
      store,
      deletedAt: null,
      slug: params.slug,
    },
    include: {
      images: true,
      _count: true,
    },
  });

  if (!collection) {
    return ApiError({
      code: "NOT_FOUND",
      error: `Can't find any collection with the slug "${params.slug}"`,
      status: 404,
    });
  }

  return NextResponse.json({ collection });
}
