import { z } from "zod";

export const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Sua coleção precisa de um nome."),
  slug: z.string().min(1),
  description: z.string().optional(),
  store: z.string().min(1, "ID da loja é inválido"),
  parents: z.array(z.string()).optional(),
  user: z.string().min(1, "ID do usuário é inválido"),
});

export type CollectionSchema = z.infer<typeof collectionSchema>;

export const schema = z.object({
  id: z.string().uuid("ID da coleção é inválido"),
  user: z.string().min(1, "ID do usuário é inválido"),
  store: z.string().min(1, "ID da loja é inválido"),
});

export type Schema = z.infer<typeof schema>;
