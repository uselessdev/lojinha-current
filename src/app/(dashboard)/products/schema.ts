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
  variants: z
    .array(
      z.object({
        name: z.string(),
        values: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  options: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        originalPrice: z.string().optional().default("R$ 0,00"),
        quantity: z.number().optional().default(0),
        sku: z.string().optional(),
      }),
    )
    .default([]),
});

export type ProductSchema = z.infer<typeof productSchema>;
