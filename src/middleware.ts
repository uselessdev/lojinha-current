import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { unkey } from "./lib/unkey";

export default authMiddleware({
  afterAuth: async (auth, request) => {
    if (request.method === "OPTIONS") {
      return NextResponse.next();
    }

    if (request.nextUrl.pathname.startsWith("/api/v1")) {
      const authorization = request.headers.get("authorization");

      if (!authorization?.startsWith("Bearer ")) {
        return NextResponse.json("Unauthorized", { status: 401 });
      }

      if (!authorization) {
        return NextResponse.json("Unauthorized", { status: 401 });
      }

      const { result } = await unkey.keys.verify({
        key: authorization,
      });

      if (!result?.valid) {
        return NextResponse.json("Unauthorized", { status: 401 });
      }

      request.headers.set("X-Store-ID", String(result.ownerId));
      request.headers.set("X-Key-Meta", JSON.stringify(result.meta));

      return NextResponse.next();
    }
  },
  // @ts-expect-error regex failed
  publicRoutes: ["/", "/api/(.*)", "/webhooks/(.*)"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
