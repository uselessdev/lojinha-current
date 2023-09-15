import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiCors } from "~/lib/api/cors";
import { ApiErrorFromSchema } from "~/lib/api/errors";
import { db } from "~/lib/database";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const store = String(request.headers.get("X-Store-ID"));

  const addresses = await db.address.findMany({
    where: {
      deletedAt: null,
      customer: {
        stores: {
          has: store,
        },
        OR: [{ id: params.id }, { externalId: params.id }],
      },
    },
  });

  const total = await db.address.count({
    where: {
      deletedAt: null,
      customer: {
        stores: {
          has: store,
        },
        OR: [{ id: params.id }, { externalId: params.id }],
      },
    },
  });

  return NextResponse.json({ addresses, total });
}

export function OPTIONS() {
  return ApiCors();
}

const addressesSchema = z.object({
  alias: z.string().optional(),
  zipcode: z.string(),
  street: z.string().min(1),
  state: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2),
  neightborhood: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const payload = addressesSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  const address = await db.address.create({
    data: {
      ...payload.data,
      customerId: params.id,
    },
  });

  if (address) {
    await db.customer.update({
      where: {
        id: params.id,
      },
      data: {
        addresses: {
          connect: {
            id: address.id,
          },
        },
      },
    });
  }

  return NextResponse.json({ address }, { status: 201 });
}
