import { NextResponse } from "next/server";
import type { z } from "zod";

type ApiErrorCode =
  | "BAD_REQUEST"
  | "INSUFFICIENT_PRODUCTS"
  | "PRODUCT_ALREADY_IN_CART"
  | "CART_WITH_NO_PRODUCTS"
  | "PRODUCT_UNCHANGED_QUANTITY"
  | "NOT_FOUND";

type ApiError = {
  code: ApiErrorCode;
  error?: string;
  message?: string;
  fields?: z.ZodIssue[];
  status: Response["status"];
};

type NoContent = {
  status: 204;
};

export function ApiError({ status, ...data }: ApiError | NoContent) {
  return NextResponse.json(data, { status });
}

export function ApiErrorFromSchema(
  issues: z.ZodIssue[],
  error = `Invalid request payload, make sure you have been sent the correct data.`,
) {
  return ApiError({
    error,
    code: "BAD_REQUEST",
    fields: issues,
    status: 400,
  });
}

export class RaiseNoContent extends Error {
  readonly status: 204;

  constructor() {
    super();
    this.status = 204;
  }
}

export class RaiseApiError extends Error {
  readonly code: ApiErrorCode;
  readonly error?: string;
  // @ts-expect-error message is differente from Error.message
  readonly message?: string;
  readonly status: Response["status"];

  constructor({ code, error, message, status }: ApiError) {
    super();

    this.code = code;
    this.error = error;
    this.message = message;
    this.status = status;
  }
}
