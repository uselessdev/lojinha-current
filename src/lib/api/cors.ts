import { NextResponse } from "next/server";

/** @todo configure cors for store domain */
export function ApiCors(domain = "*") {
  return NextResponse.json("ok", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": `${domain}`,
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
