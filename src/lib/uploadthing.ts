import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import type { FileRouterLojinha } from "~/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<FileRouterLojinha>();
export const { UploadDropzone } = generateComponents<FileRouterLojinha>();
