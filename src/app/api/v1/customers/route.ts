import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiCors } from "~/lib/api/cors";
import { ApiErrorFromSchema } from "~/lib/api/errors";
import { db } from "~/lib/database";

export function OPTIONS() {
  return ApiCors();
}

const customerSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const store = String(request.headers.get("X-Store-ID"));
  const payload = customerSchema.safeParse(await request.json());

  if (!payload.success) {
    return ApiErrorFromSchema(payload.error.issues);
  }

  const customer = await db.customer.findFirst({
    where: {
      email: payload.data.email,
    },
  });

  if (customer) {
    const instore = await db.customer.findFirst({
      where: {
        stores: {
          has: store,
        },
      },
    });

    if (!instore) {
      await db.customer.update({
        where: {
          email: payload.data.email,
        },
        data: {
          stores: {
            push: store,
          },
        },
      });
    }
  }

  if (!customer) {
    const customer = await db.customer.create({
      data: {
        email: payload.data.email,
        stores: [store],
      },
    });

    return NextResponse.json({ customer: customer.id }, { status: 201 });
  }

  return NextResponse.json({ customer: customer.id }, { status: 201 });
}
