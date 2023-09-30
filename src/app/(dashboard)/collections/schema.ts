import { z } from "zod";

export const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Sua coleção precisa de um nome."),
  slug: z.string().min(1),
  description: z.string().optional(),
  parents: z.array(z.string()).optional(),
});

export type CollectionSchema = z.infer<typeof collectionSchema>;
