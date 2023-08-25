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

  const product = await db.product.findFirst({
    where: {
      slug: params.slug,
      deletedAt: null,
      store,
      status: {
        notIn: ["DISABLED", "DRAFT", "VALIDATION"],
      },
      collections: {
        some: {
          deletedAt: null,
        },
      },
    },
    include: {
      _count: true,
    },
  });

  if (!product) {
    return ApiError({
      code: "NOT_FOUND",
      error: `Can't find any product with the slug "${params.slug}"`,
      status: 404,
    });
  }

  return NextResponse.json({ product });
}
