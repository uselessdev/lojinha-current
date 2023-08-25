import { z } from "zod";

const status = z.enum(["ACTIVE", "DRAFT", "VALIDATION", "DISABLED"]);

export const productSchema = z.object({
  id: z.string().uuid("ID do produto é inválido").optional(),
  name: z.string().min(1, "Seu produto precisa de um nome"),
  slug: z.string().min(1, "Seu produto precisa de uma slug"),
  status: status.default("DRAFT"),
  collections: z.array(z.string().uuid()).default([]),
  description: z.string().optional(),
  price: z.string().optional(),
  originalPrice: z.string().optional(),
  quantity: z.number().optional().default(1),
  sku: z.string().optional(),
  store: z.string().min(1, "ID da loja é inválido"),
  user: z.string().min(1, "ID do usuário é inválido"),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const schema = z.object({
  id: z.string().uuid("ID do produto é inválido"),
  user: z.string().min(1, "ID do usuário é inválido"),
  store: z.string().min(1, "ID da loja é inválido"),
});

export type Schema = z.infer<typeof schema>;
