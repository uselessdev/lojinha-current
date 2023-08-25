import { auth } from "@clerk/nextjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { db } from "~/lib/database";

const f = createUploadthing();

const schema = z.object({
  collection: z.string().uuid(),
});

export const fileRouter = {
  collections: f({ image: { maxFileSize: "2MB", maxFileCount: 10 } })
    .input(schema)
    .middleware(({ input }) => {
      const { orgId } = auth();

      console.log(`starting upload for: ${orgId}`);

      return { collection: input.collection, store: orgId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log(`upload completed. key: ${file.key}`);

      await db.image.create({
        data: {
          key: file.key,
          url: file.url,
          store: metadata.store as string,
          collection: metadata.collection,
        },
      });

      console.log(
        `connect image: ${file.key} to collection: ${metadata.collection}`,
      );
    }),
  products: f({ image: { maxFileSize: "2MB", maxFileCount: 10 } })
    .input(z.object({ product: z.string().uuid() }))
    .middleware(({ input }) => {
      const { orgId } = auth();

      console.log(`starting upload for: ${orgId}`);

      return { product: input.product, store: orgId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log(`upload completed. key: ${file.key}`);

      await db.image.create({
        data: {
          key: file.key,
          url: file.url,
          store: metadata.store as string,
          product: metadata.product,
        },
      });

      console.log(`connect image: ${file.key} to product: ${metadata.product}`);
    }),
} satisfies FileRouter;

export type FileRouterLojinha = typeof fileRouter;
